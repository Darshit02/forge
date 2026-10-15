import fs from "node:fs/promises";
import path from "node:path";
import * as babelParser from "@babel/parser";
import traverseModule from "@babel/traverse";
// Handle Babel traverse default vs named export in Bun/ESM
const traverse = (traverseModule as any).default || traverseModule;

import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { apiRequests, apiSpecs, collections, projects } from "../db/schema.js";
import { CONSTANTS } from "../config/constants.js";
import { fileStoreService } from "./fileStore.service.js";
import { wsHub } from "../ws/hub.js";
import { logger } from "../utils/logger.js";

export class SpecExtractorService {
  /**
   * Attempts to fetch OpenAPI spec directly from the running container via HTTP
   */
  async fetchFromContainer(
    hostPort: number,
    framework: string
  ): Promise<Record<string, unknown> | null> {
    const candidatePaths = [
      ...(CONSTANTS.SPEC_PATHS[framework] || []),
      "/openapi.json",
      "/api-json",
      "/doc",
      "/api-docs.json",
      "/swagger.json",
      "/apispec.json",
      "/api/schema/",
      "/api/schema.json",
    ];

    // Remove duplicates
    const uniquePaths = Array.from(new Set(candidatePaths));

    for (const specPath of uniquePaths) {
      try {
        const url = `http://127.0.0.1:${hostPort}${specPath}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json && (json.openapi || json.swagger || json.paths)) {
            logger.info(
              { hostPort, path: specPath },
              "Successfully fetched OpenAPI spec from container"
            );
            return json as Record<string, unknown>;
          }
        }
      } catch {
        // Try next candidate path
      }
    }

    return null;
  }

  /**
   * Fallback: Parses workspace source code files using AST to extract routes
   */
  async extractFromAST(projectId: string): Promise<Record<string, unknown>> {
    const files = await fileStoreService.getAllWorkspaceFiles(projectId);
    const pathsObj: Record<string, any> = {};

    for (const file of files) {
      const ext = path.extname(file.path).toLowerCase();

      // JS / TS files
      if (ext === ".js" || ext === ".ts" || ext === ".mjs") {
        this.parseJsTsAst(file.content, pathsObj);
      }
      // Python files
      else if (ext === ".py") {
        this.parsePythonRoutes(file.content, pathsObj);
      }
    }

    return {
      openapi: "3.0.3",
      info: {
        title: "Forge Auto-Extracted API Spec",
        version: "1.0.0",
        description:
          "OpenAPI specification automatically synthesized from workspace source code AST",
      },
      paths: pathsObj,
    };
  }

  /**
   * Uses Babel AST to parse route definitions from JS/TS files
   */
  private parseJsTsAst(code: string, pathsObj: Record<string, any>): void {
    try {
      const ast = babelParser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy"],
      });

      const httpMethods = new Set([
        "get",
        "post",
        "put",
        "delete",
        "patch",
        "options",
        "head",
      ]);

      traverse(ast, {
        CallExpression(path: any) {
          const callee = path.node.callee;
          if (
            callee.type === "MemberExpression" &&
            callee.property.type === "Identifier"
          ) {
            const methodName = callee.property.name.toLowerCase();
            if (httpMethods.has(methodName)) {
              const args = path.node.arguments;
              if (args.length > 0 && args[0].type === "StringLiteral") {
                let routePath = args[0].value;
                if (!routePath.startsWith("/")) {
                  routePath = `/${routePath}`;
                }

                if (!pathsObj[routePath]) {
                  pathsObj[routePath] = {};
                }

                pathsObj[routePath][methodName] = {
                  summary: `${methodName.toUpperCase()} ${routePath}`,
                  description: `Auto-discovered endpoint via source code AST`,
                  responses: {
                    "200": {
                      description: "Successful response",
                    },
                  },
                };
              }
            }
          }
        },
      });
    } catch {
      // Ignore unparseable files
    }
  }

  /**
   * Regex-based AST extractor for Python routes (@app.get("/items"), etc.)
   */
  private parsePythonRoutes(code: string, pathsObj: Record<string, any>): void {
    const routeRegex =
      /@(?:app|router|api)\.(get|post|put|delete|patch|options|head)\(\s*["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = routeRegex.exec(code)) !== null) {
      const method = match[1].toLowerCase();
      let routePath = match[2];
      if (!routePath.startsWith("/")) {
        routePath = `/${routePath}`;
      }

      if (!pathsObj[routePath]) {
        pathsObj[routePath] = {};
      }

      pathsObj[routePath][method] = {
        summary: `${method.toUpperCase()} ${routePath}`,
        description: `Auto-discovered Python route via source scan`,
        responses: {
          "200": {
            description: "Successful response",
          },
        },
      };
    }
  }

  /**
   * Main extractor routine:
   * 1. Try container HTTP endpoints
   * 2. If unsuccessful, fallback to AST
   * 3. Sync spec with DB and collections
   * 4. Emit spec.updated via WebSocket
   */
  async extractAndSync(projectId: string): Promise<Record<string, unknown>> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    let spec: Record<string, unknown> | null = null;

    // 1. Try container if running
    if (project.status === "running" && project.hostPort) {
      spec = await this.fetchFromContainer(project.hostPort, project.framework);
    }

    // 2. Fallback to AST
    if (!spec) {
      logger.info(
        { projectId },
        "Container not ready or spec endpoint unavailable; extracting via AST parser"
      );
      spec = await this.extractFromAST(projectId);
    }

    // 3. Persist in api_specs table
    await this.persistSpec(projectId, spec);

    // 4. Sync endpoints into collections & api_requests
    await this.syncCollections(projectId, spec);

    // 5. Broadcast to connected WebSocket clients
    wsHub.broadcastSpecUpdated(projectId, spec);

    return spec;
  }

  /**
   * Persists or updates the OpenAPI spec in DB
   */
  private async persistSpec(
    projectId: string,
    spec: Record<string, unknown>
  ): Promise<void> {
    const [existing] = await db
      .select({ id: apiSpecs.id })
      .from(apiSpecs)
      .where(eq(apiSpecs.projectId, projectId))
      .limit(1);

    if (existing) {
      await db
        .update(apiSpecs)
        .set({
          specJson: spec,
          fetchedAt: new Date(),
        })
        .where(eq(apiSpecs.projectId, projectId));
    } else {
      await db.insert(apiSpecs).values({
        projectId,
        specJson: spec,
        fetchedAt: new Date(),
      });
    }
  }

  /**
   * Upserts discovered endpoints into collections & api_requests tables.
   * Crucially: Preserves user-customized requests where auto_generated = false.
   */
  private async syncCollections(
    projectId: string,
    spec: Record<string, any>
  ): Promise<void> {
    if (!spec.paths || typeof spec.paths !== "object") {
      return;
    }

    // 1. Get or create Default collection
    let [defaultCollection] = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.projectId, projectId),
          eq(collections.name, "Default")
        )
      )
      .limit(1);

    if (!defaultCollection) {
      const [newColl] = await db
        .insert(collections)
        .values({
          projectId,
          name: "Default",
          orderIndex: 0,
        })
        .returning();
      defaultCollection = newColl;
    }

    // 2. Fetch existing requests for project
    const existingRequests = await db
      .select()
      .from(apiRequests)
      .where(eq(apiRequests.projectId, projectId));

    const existingMap = new Map<string, typeof existingRequests[0]>();
    for (const req of existingRequests) {
      const key = `${req.method.toUpperCase()} ${req.path}`;
      existingMap.set(key, req);
    }

    // 3. Traverse paths and upsert
    for (const [routePath, methods] of Object.entries(spec.paths)) {
      if (typeof methods !== "object" || !methods) continue;

      for (const [methodRaw, details] of Object.entries(
        methods as Record<string, any>
      )) {
        const method = methodRaw.toUpperCase();
        if (
          !["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].includes(
            method
          )
        ) {
          continue;
        }

        const key = `${method} ${routePath}`;
        const summary =
          details?.summary || details?.description || `${method} ${routePath}`;
        const existing = existingMap.get(key);

        if (existing) {
          // If auto_generated = true, update metadata
          // If auto_generated = false (user customized), preserve headers, body, auth!
          if (existing.autoGenerated) {
            await db
              .update(apiRequests)
              .set({
                name: summary,
                updatedAt: new Date(),
              })
              .where(eq(apiRequests.id, existing.id));
          }
        } else {
          // Insert new auto-generated request
          await db.insert(apiRequests).values({
            projectId,
            collectionId: defaultCollection.id,
            name: summary,
            method,
            path: routePath,
            headers: {
              "Content-Type": "application/json",
            },
            body: {},
            authConfig: {},
            autoGenerated: true,
          });
        }
      }
    }
  }
}

export const specExtractorService = new SpecExtractorService();

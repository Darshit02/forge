import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileStoreService } from "./fileStore.service.js";
import { BadRequestError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type { ProjectFramework, ProjectLanguage } from "../types/index.js";

export interface TemplateMetadata {
  id: ProjectFramework;
  name: string;
  language: ProjectLanguage;
  description: string;
  defaultPort: number;
  openApiEndpoints: string[];
}

export const SUPPORTED_FRAMEWORKS: Record<
  ProjectLanguage,
  ProjectFramework[]
> = {
  python: ["fastapi", "flask", "django"],
  node: ["express", "nestjs"],
  typescript: ["hono", "fastify"],
  go: ["fiber", "gin"],
  rust: ["axum"],
};

export class ScaffoldService {
  private getTemplatesRoot(): string {
    const cwdTemplates = path.resolve(process.cwd(), "templates");
    if (fsSync.existsSync(cwdTemplates)) {
      return cwdTemplates;
    }
    const relativeTemplates = path.resolve(import.meta.dirname, "../../templates");
    if (fsSync.existsSync(relativeTemplates)) {
      return relativeTemplates;
    }
    return cwdTemplates;
  }

  /**
   * Validates if the framework matches the language
   */
  validateFramework(language: ProjectLanguage, framework: string): void {
    const validFrameworks = SUPPORTED_FRAMEWORKS[language];
    if (!validFrameworks || !validFrameworks.includes(framework as ProjectFramework)) {
      throw new BadRequestError(
        `Framework '${framework}' is not supported for language '${language}'. Supported: ${
          validFrameworks ? validFrameworks.join(", ") : "none"
        }`
      );
    }
  }

  /**
   * Returns list of supported templates with metadata
   */
  getTemplates(): TemplateMetadata[] {
    return [
      {
        id: "fastapi",
        name: "FastAPI",
        language: "python",
        description: "Modern, high-performance web framework for Python with automatic OpenAPI docs",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json"],
      },
      {
        id: "express",
        name: "Express.js",
        language: "node",
        description: "Classic, minimalist Node.js web framework equipped with swagger-jsdoc",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json", "/api-docs.json"],
      },
      {
        id: "nestjs",
        name: "NestJS",
        language: "node",
        description: "Enterprise progressive TypeScript Node.js framework with Swagger OpenAPI",
        defaultPort: 8000,
        openApiEndpoints: ["/api-json", "/openapi.json"],
      },
      {
        id: "hono",
        name: "Hono",
        language: "typescript",
        description: "Ultrafast web framework for Bun & modern runtimes with @hono/zod-openapi",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json", "/doc"],
      },
      {
        id: "flask",
        name: "Flask",
        language: "python",
        description: "Lightweight WSGI Python framework with Flasgger OpenAPI integration",
        defaultPort: 8000,
        openApiEndpoints: ["/apispec.json", "/openapi.json"],
      },
      {
        id: "django",
        name: "Django REST Framework",
        language: "python",
        description: "High-level Python web framework with DRF and drf-spectacular OpenAPI",
        defaultPort: 8000,
        openApiEndpoints: ["/api/schema.json", "/api/schema/"],
      },
      {
        id: "fastify",
        name: "Fastify",
        language: "typescript",
        description: "Low overhead Node.js/TS web framework with OpenAPI",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json"],
      },
      {
        id: "fiber",
        name: "Fiber",
        language: "go",
        description: "Express-inspired high-speed web framework written in Go",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json"],
      },
      {
        id: "gin",
        name: "Gin",
        language: "go",
        description: "Fast HTTP web framework in Go",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json"],
      },
      {
        id: "axum",
        name: "Axum",
        language: "rust",
        description: "Ergonomic and modular web framework built with Tokio and Tower",
        defaultPort: 8000,
        openApiEndpoints: ["/openapi.json"],
      },
    ];
  }

  /**
   * Scaffolds starter files into target project workspace
   */
  async scaffoldProject(
    projectId: string,
    language: ProjectLanguage,
    framework: string
  ): Promise<void> {
    this.validateFramework(language, framework);

    const templateDir = path.join(this.getTemplatesRoot(), framework);
    if (!fsSync.existsSync(templateDir)) {
      throw new BadRequestError(
        `Starter template for framework '${framework}' is not installed or available.`
      );
    }
    const workspaceDir = await fileStoreService.initWorkspace(projectId);

    try {
      await this.copyDirRecursive(templateDir, workspaceDir);
      logger.info(
        { projectId, framework, language },
        "Scaffolded template into workspace successfully"
      );
    } catch (err: any) {
      logger.error(
        { projectId, framework, err },
        "Failed to scaffold project template"
      );
      throw new Error(`Failed to scaffold project: ${err.message}`);
    }
  }

  private async copyDirRecursive(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirRecursive(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

export const scaffoldService = new ScaffoldService();

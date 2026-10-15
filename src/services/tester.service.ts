import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  apiRequests,
  environments,
  projects,
  testHistory,
} from "../db/schema.js";
import { CONSTANTS } from "../config/constants.js";
import { wsHub } from "../ws/hub.js";
import {
  BadRequestError,
  NotFoundError,
  SSRFError,
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type {
  TestRequestPayload,
  TestResponsePayload,
} from "../types/index.js";

export class TesterService {
  /**
   * Enforces strict SSRF protections:
   * Only allows requests directly to 127.0.0.1:<allocated_project_port>
   */
  validateTargetUrl(targetUrl: string, expectedPort: number): void {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new SSRFError("Invalid target URL format");
    }

    const hostname = parsed.hostname.toLowerCase();

    // 1. Block metadata endpoints
    if (
      hostname === CONSTANTS.SSRF_PROTECTION.METADATA_ENDPOINT ||
      hostname.includes("169.254")
    ) {
      throw new SSRFError(
        "Access denied: Cloud metadata endpoints are strictly forbidden"
      );
    }

    // 2. Reject all hosts except 127.0.0.1
    if (hostname !== CONSTANTS.SSRF_PROTECTION.ALLOWED_HOST) {
      throw new SSRFError(
        `Access denied: Requests are only permitted to the allocated container at 127.0.0.1, got '${hostname}'`
      );
    }

    // 3. Reject any port other than the allocated project host port
    const port = parsed.port ? parseInt(parsed.port, 10) : 80;
    if (port !== expectedPort) {
      throw new SSRFError(
        `Access denied: Port ${port} does not match the allocated container port (${expectedPort})`
      );
    }
  }

  /**
   * Interpolates environment variables formatted as {{VAR_NAME}}
   */
  interpolateVariables(
    value: string,
    variables: Record<string, string>
  ): string {
    return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return variables[trimmed] !== undefined ? variables[trimmed] : `{{${key}}}`;
    });
  }

  /**
   * Resolves active environment variables for a project
   */
  async getEnvironmentVariables(
    projectId: string,
    environmentId?: string
  ): Promise<Record<string, string>> {
    let envRecord = null;

    if (environmentId) {
      [envRecord] = await db
        .select()
        .from(environments)
        .where(
          and(
            eq(environments.id, environmentId),
            eq(environments.projectId, projectId)
          )
        )
        .limit(1);
    }

    if (!envRecord) {
      // Find active environment
      [envRecord] = await db
        .select()
        .from(environments)
        .where(
          and(
            eq(environments.projectId, projectId),
            eq(environments.isActive, true)
          )
        )
        .limit(1);
    }

    return (envRecord?.variables as Record<string, string>) || {};
  }

  /**
   * Executes an API test against the project's running container
   */
  async executeTest(
    projectId: string,
    payload: TestRequestPayload
  ): Promise<TestResponsePayload> {
    const [project] = await db
      .select({
        id: projects.id,
        status: projects.status,
        hostPort: projects.hostPort,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    if (project.status !== "running" || !project.hostPort) {
      throw new BadRequestError(
        "Project container is not running. Please start the container before testing endpoints."
      );
    }

    // Resolve environment variables
    const envVars = await this.getEnvironmentVariables(
      projectId,
      payload.environmentId
    );

    // Apply environment substitution to path
    let resolvedPath = this.interpolateVariables(payload.path, envVars);
    if (!resolvedPath.startsWith("/")) {
      resolvedPath = `/${resolvedPath}`;
    }

    // Construct full target URL
    const targetUrl = `http://127.0.0.1:${project.hostPort}${resolvedPath}`;

    // Verify SSRF guards
    this.validateTargetUrl(targetUrl, project.hostPort);

    // Prepare headers with environment substitution
    const requestHeaders: Record<string, string> = {};
    if (payload.headers) {
      for (const [k, v] of Object.entries(payload.headers)) {
        requestHeaders[k] = this.interpolateVariables(String(v), envVars);
      }
    }

    // Prepare body
    let requestBody: string | undefined;
    if (
      payload.method !== "GET" &&
      payload.method !== "HEAD" &&
      payload.body !== undefined
    ) {
      if (typeof payload.body === "string") {
        requestBody = this.interpolateVariables(payload.body, envVars);
      } else {
        requestBody = JSON.stringify(payload.body);
      }
      if (!requestHeaders["content-type"] && !requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }
    }

    const startTime = Date.now();
    let status = 0;
    const responseHeaders: Record<string, string> = {};
    let responseBody: any = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

      const res = await fetch(targetUrl, {
        method: payload.method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      status = res.status;
      res.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          responseBody = await res.json();
        } catch {
          responseBody = await res.text();
        }
      } else {
        responseBody = await res.text();
      }
    } catch (err: any) {
      status = 502;
      responseBody = {
        error: "Failed to connect to container service",
        details: err.message,
      };
    }

    const durationMs = Date.now() - startTime;

    const resultPayload: TestResponsePayload = {
      status,
      headers: responseHeaders,
      body: responseBody,
      durationMs,
    };

    // Record test in test_history
    await db.insert(testHistory).values({
      projectId,
      requestId: payload.requestId || null,
      method: payload.method,
      path: resolvedPath,
      statusCode: status,
      durationMs,
      responseSnippet:
        typeof responseBody === "object"
          ? responseBody
          : { raw: String(responseBody).slice(0, 1000) },
    });

    // If an api_request ID was provided, update last_response
    if (payload.requestId) {
      await db
        .update(apiRequests)
        .set({
          lastResponse: resultPayload,
          updatedAt: new Date(),
        })
        .where(eq(apiRequests.id, payload.requestId));
    }

    // Broadcast test.result via WebSocket
    wsHub.broadcastTestResult(projectId, payload.requestId, resultPayload);

    return resultPayload;
  }

  /**
   * Retrieves test history for a project
   */
  async getHistory(projectId: string, limit = 50) {
    return db
      .select()
      .from(testHistory)
      .where(eq(testHistory.projectId, projectId))
      .orderBy(desc(testHistory.ranAt))
      .limit(limit);
  }
}

export const testerService = new TesterService();

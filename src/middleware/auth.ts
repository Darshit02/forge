import type { Context, Next } from "hono";
import { authService } from "../services/auth.service.js";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../utils/errors.js";
import { db } from "../db/client.js";
import { projects } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedUser } from "../types/index.js";

// Extend Hono's Context Variables
declare module "hono" {
  interface ContextVariableMap {
    user: AuthenticatedUser;
    projectId?: string;
  }
}

/**
 * Extracts JWT token from Authorization header or 'token' query param
 */
export function extractToken(c: Context): string | null {
  const authHeader = c.req.header("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const queryToken = c.req.query("token");
  if (queryToken) {
    return queryToken.trim();
  }
  return null;
}

/**
 * Middleware: Requires a valid JWT access token
 */
export async function requireAuth(c: Context, next: Next) {
  const token = extractToken(c);
  if (!token) {
    throw new UnauthorizedError("Authentication token is required");
  }

  const payload = authService.verifyAccessToken(token);
  const user = await authService.getUserById(payload.userId);
  c.set("user", user);

  await next();
}

/**
 * Middleware: Verifies that the authenticated user owns the target project (:id)
 * Enforces requirement: All /api/projects/:id/* routes must verify project.user_id === req.user.id
 */
export async function requireProjectOwner(c: Context, next: Next) {
  const user = c.get("user");
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  const projectId = c.req.param("id") || c.req.param("projectId");
  if (!projectId) {
    await next();
    return;
  }

  const [project] = await db
    .select({
      id: projects.id,
      userId: projects.userId,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new NotFoundError(`Project ${projectId} not found`);
  }

  if (project.userId !== user.id) {
    throw new ForbiddenError(
      "Access denied: You do not have permission to access this project"
    );
  }

  c.set("projectId", projectId);
  await next();
}

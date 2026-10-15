import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { db } from "../db/client.js";
import { environments } from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";

export const environmentsRoutes = new Hono();

environmentsRoutes.use("*", requireAuth);

const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(50),
  variables: z.record(z.string()).default({}),
  isActive: z.boolean().default(false),
});

const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  variables: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/projects/:id/environments - List environments
 */
environmentsRoutes.get(
  "/projects/:id/environments",
  requireProjectOwner,
  async (c) => {
    const projectId = c.req.param("id");

    const envs = await db
      .select()
      .from(environments)
      .where(eq(environments.projectId, projectId));

    return c.json({ environments: envs });
  }
);

/**
 * POST /api/projects/:id/environments - Create environment
 */
environmentsRoutes.post(
  "/projects/:id/environments",
  requireProjectOwner,
  zValidator("json", createEnvironmentSchema),
  async (c) => {
    const projectId = c.req.param("id");
    const body = c.req.valid("json");

    if (body.isActive) {
      // Deactivate other environments
      await db
        .update(environments)
        .set({ isActive: false })
        .where(eq(environments.projectId, projectId));
    }

    const [created] = await db
      .insert(environments)
      .values({
        projectId,
        name: body.name.trim(),
        variables: body.variables || {},
        isActive: body.isActive ?? false,
      })
      .returning();

    return c.json({ environment: created }, 201);
  }
);

/**
 * PATCH /api/environments/:id - Update environment
 */
environmentsRoutes.patch(
  "/environments/:id",
  zValidator("json", updateEnvironmentSchema),
  async (c) => {
    const envId = c.req.param("id");
    const body = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(environments)
      .where(eq(environments.id, envId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Environment not found");
    }

    if (body.isActive) {
      await db
        .update(environments)
        .set({ isActive: false })
        .where(eq(environments.projectId, existing.projectId));
    }

    const [updated] = await db
      .update(environments)
      .set({
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.variables !== undefined ? { variables: body.variables } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      })
      .where(eq(environments.id, envId))
      .returning();

    return c.json({ environment: updated });
  }
);

/**
 * DELETE /api/environments/:id - Delete environment
 */
environmentsRoutes.delete("/environments/:id", async (c) => {
  const envId = c.req.param("id");

  const [deleted] = await db
    .delete(environments)
    .where(eq(environments.id, envId))
    .returning({ id: environments.id });

  if (!deleted) {
    throw new NotFoundError("Environment not found");
  }

  return c.json({ ok: true, id: deleted.id });
});

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { specExtractorService } from "../services/specExtractor.service.js";
import { db } from "../db/client.js";
import { apiSpecs } from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";

export const specRoutes = new Hono();

specRoutes.use("*", requireAuth);

/**
 * GET /api/projects/:id/spec - Retrieve latest OpenAPI specification (cached)
 */
specRoutes.get("/:id/spec", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;

  const [specRecord] = await db
    .select()
    .from(apiSpecs)
    .where(eq(apiSpecs.projectId, projectId))
    .limit(1);

  if (!specRecord) {
    // If not yet generated, trigger extraction on-the-fly
    const generated = await specExtractorService.extractAndSync(projectId);
    return c.json({ spec: generated, fetchedAt: new Date() });
  }

  return c.json({
    spec: specRecord.specJson,
    fetchedAt: specRecord.fetchedAt,
  });
});

/**
 * POST /api/projects/:id/spec/refresh - Force re-fetch spec from container/AST
 */
specRoutes.post("/:id/spec/refresh", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;

  const spec = await specExtractorService.extractAndSync(projectId);

  return c.json({
    spec,
    refreshedAt: new Date(),
  });
});

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { testerRateLimiter } from "../middleware/rateLimit.js";
import { testerService } from "../services/tester.service.js";

export const testerRoutes = new Hono();

testerRoutes.use("*", requireAuth);

const executeTestSchema = z.object({
  method: z.enum([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
    "HEAD",
  ]),
  path: z.string().min(1, "Request path is required"),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  environmentId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
});

/**
 * POST /api/projects/:id/test - Execute HTTP test proxy against running container
 */
testerRoutes.post(
  "/:id/test",
  requireProjectOwner,
  testerRateLimiter,
  zValidator("json", executeTestSchema),
  async (c) => {
    const projectId = c.req.param("id");
    const payload = c.req.valid("json");

    const result = await testerService.executeTest(projectId, payload);
    return c.json(result);
  }
);

/**
 * GET /api/projects/:id/test/history - Retrieve test execution history
 */
testerRoutes.get("/:id/test/history", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id");
  const limit = parseInt(c.req.query("limit") || "50", 10);

  const history = await testerService.getHistory(projectId, limit);
  return c.json({ history });
});

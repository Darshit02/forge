import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { testerRateLimiter } from "../middleware/rateLimit.js";
import { testerService } from "../services/tester.service.js";

export const testerRoutes = new Hono();

import { TestRequestPayloadSchema } from "@forge/shared";

testerRoutes.use("*", requireAuth);

/**
 * POST /api/projects/:id/test - Execute HTTP test proxy against running container
 */
testerRoutes.post(
  "/:id/test",
  requireProjectOwner,
  testerRateLimiter,
  zValidator("json", TestRequestPayloadSchema),
  async (c) => {
    const projectId = c.req.param("id")!;
    const payload = c.req.valid("json");

    const result = await testerService.executeTest(projectId, payload);
    return c.json(result);
  }
);

/**
 * GET /api/projects/:id/test/history - Retrieve test execution history
 */
testerRoutes.get("/:id/test/history", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const limit = parseInt(c.req.query("limit") || "50", 10);

  const history = await testerService.getHistory(projectId, limit);
  return c.json({ history });
});

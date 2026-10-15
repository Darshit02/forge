import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { dockerService } from "../services/docker.service.js";
import { watcherService } from "../services/watcher.service.js";
import { specExtractorService } from "../services/specExtractor.service.js";
import { wsHub } from "../ws/hub.js";

export const containersRoutes = new Hono();

containersRoutes.use("*", requireAuth);

/**
 * POST /api/projects/:id/start - Starts project container & file watcher
 */
containersRoutes.post("/:id/start", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;

  const status = await dockerService.startProject(projectId);
  await watcherService.startWatcher(projectId);

  // Trigger initial spec extract
  specExtractorService.extractAndSync(projectId).catch(() => {});

  wsHub.broadcastContainerStatus(projectId, status.status);

  return c.json({ container: status });
});

/**
 * POST /api/projects/:id/stop - Stops project container & file watcher
 */
containersRoutes.post("/:id/stop", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;

  await watcherService.stopWatcher(projectId);
  const status = await dockerService.stopProject(projectId);

  wsHub.broadcastContainerStatus(projectId, status.status);

  return c.json({ container: status });
});

/**
 * POST /api/projects/:id/restart - Restarts container
 */
containersRoutes.post("/:id/restart", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;

  const status = await dockerService.restartProject(projectId);
  await watcherService.startWatcher(projectId);

  specExtractorService.extractAndSync(projectId).catch(() => {});

  wsHub.broadcastContainerStatus(projectId, status.status);

  return c.json({ container: status });
});

/**
 * GET /api/projects/:id/status - Container status
 */
containersRoutes.get("/:id/status", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const status = await dockerService.getStatus(projectId);
  return c.json({ container: status });
});

/**
 * GET /api/projects/:id/logs - SSE stream of container logs (?tail=200)
 */
containersRoutes.get("/:id/logs", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const tail = parseInt(c.req.query("tail") || "200", 10);

  return streamSSE(c, async (stream) => {
    try {
      const logStream = await dockerService.getContainerLogs(
        projectId,
        tail,
        true
      );

      logStream.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        stream.writeSSE({
          data: text,
          event: "log",
        });
        wsHub.broadcastContainerLog(projectId, text);
      });

      logStream.on("error", (err: any) => {
        stream.writeSSE({
          data: JSON.stringify({ error: err.message }),
          event: "error",
        });
      });

      stream.onAbort(() => {
        logStream.destroy();
      });

      // Keep stream alive with periodic comment pings
      while (true) {
        await stream.sleep(15000);
        await stream.writeSSE({ data: "ping", event: "ping" });
      }
    } catch (err: any) {
      await stream.writeSSE({
        data: JSON.stringify({ error: err.message }),
        event: "error",
      });
    }
  });
});

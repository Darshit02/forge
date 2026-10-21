import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import { checkDatabaseConnection, closeDatabaseConnection } from "./db/client.js";
import { executionService } from "./services/execution/index.js";
import { watcherService } from "./services/watcher.service.js";
import { fileStoreService } from "./services/fileStore.service.js";
import { authService } from "./services/auth.service.js";
import { wsHub } from "./ws/hub.js";

// Routes
import { authRoutes } from "./routes/auth.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { providersRoutes } from "./routes/providers.routes.js";
import { projectsRoutes } from "./routes/projects.routes.js";
import { filesRoutes } from "./routes/files.routes.js";
import { containersRoutes } from "./routes/containers.routes.js";
import { aiRoutes } from "./routes/ai.routes.js";
import { specRoutes } from "./routes/spec.routes.js";
import { testerRoutes } from "./routes/tester.routes.js";
import { collectionsRoutes } from "./routes/collections.routes.js";
import { environmentsRoutes } from "./routes/environments.routes.js";

// Initialize Bun WebSocket support for Hono
const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();

// Global Middlewares
app.use(
  "*",
  cors({
    origin: (origin) => origin || env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Refresh-Token"],
    exposeHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
    credentials: true,
  })
);

app.use("*", honoLogger());

// Global Error Handler
app.onError(errorHandler);

/**
 * Health Check Endpoint
 * GET /health
 */
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "forge-backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * Native WebSocket Handler
 * ws://<host>:<port>/ws?projectId=<id>&token=<jwt>
 */
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const projectId = c.req.query("projectId");
    const token = c.req.query("token");

    if (!projectId) {
      logger.warn("WebSocket connection rejected: Missing projectId");
      return {};
    }

    let userId = "anonymous";
    if (token) {
      try {
        const payload = authService.verifyAccessToken(token);
        userId = payload.userId;
      } catch (err: any) {
        logger.warn(
          { projectId, err: err.message },
          "WebSocket connection using unverified token"
        );
      }
    }

    return {
      onOpen(_event, ws) {
        wsHub.handleConnection(ws as unknown as ServerWebSocket<unknown>, userId, projectId);
      },
      onMessage(event, ws) {
        wsHub.handleMessage(
          ws as unknown as ServerWebSocket<unknown>,
          event.data as string | Buffer
        );
      },
      onClose(_event, ws) {
        wsHub.handleDisconnection(ws as unknown as ServerWebSocket<unknown>);
      },
      onError(event, ws) {
        logger.error({ event }, "WebSocket connection error");
        wsHub.handleDisconnection(ws as unknown as ServerWebSocket<unknown>);
      },
    };
  })
);

// Mount API Routes
app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/providers", providersRoutes);
app.route("/api/projects", projectsRoutes);
app.route("/api/projects", filesRoutes);
app.route("/api/projects", containersRoutes);
app.route("/api/projects", aiRoutes);
app.route("/api/projects", specRoutes);
app.route("/api/projects", testerRoutes);
app.route("/api", collectionsRoutes);
app.route("/api", environmentsRoutes);

// Root fallback / documentation pointer
app.get("/", (c) => {
  return c.json({
    name: "Forge AI-Native Backend IDE API",
    version: "1.0.0",
    docs: "/health",
    endpoints: {
      auth: "/api/auth",
      providers: "/api/providers",
      projects: "/api/projects",
      websocket: "/ws?projectId=<id>&token=<jwt>",
    },
  });
});

// Startup Reconciliations & Checks
async function bootstrap() {
  logger.info("Initializing Forge Backend services...");

  // 1. Verify DB and load project workspaces
  await checkDatabaseConnection();
  await fileStoreService.loadWorkspacesFromDb();

  // 2. Reconcile execution engine states
  await executionService.reconcile();

  logger.info(
    `Forge Backend running on http://${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode`
  );
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Fatal error during backend bootstrap");
});

// Graceful Shutdown
async function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  await executionService.stopAll();
  await watcherService.stopAll();
  await closeDatabaseConnection();
  process.exit(0);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// Export Bun server definition
export default {
  port: env.PORT,
  hostname: env.HOST,
  fetch: app.fetch,
  websocket,
};

import net from "node:net";
import { eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { projects } from "../db/schema.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export class PortAllocatorService {
  private startPort: number;
  private endPort: number;

  constructor() {
    this.startPort = env.PORT_RANGE_START;
    this.endPort = env.PORT_RANGE_END;
  }

  /**
   * Checks if a port is currently listening on localhost
   */
  async isPortFreeOnHost(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();

      server.on("error", () => {
        resolve(false);
      });

      server.listen(port, "127.0.0.1", () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }

  /**
   * Allocates an available host port in [PORT_RANGE_START, PORT_RANGE_END]
   * and saves it to the project record in PostgreSQL
   */
  async allocatePort(projectId: string): Promise<number> {
    // 1. Check if project already has a port allocated
    const [existing] = await db
      .select({ hostPort: projects.hostPort })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existing?.hostPort) {
      const isFree = await this.isPortFreeOnHost(existing.hostPort);
      if (isFree) {
        return existing.hostPort;
      }
    }

    // 2. Fetch all currently assigned ports from DB
    const assignedRows = await db
      .select({ hostPort: projects.hostPort })
      .from(projects)
      .where(isNotNull(projects.hostPort));

    const assignedPorts = new Set(
      assignedRows
        .map((r) => r.hostPort)
        .filter((p): p is number => p !== null)
    );

    // 3. Find the lowest port in range that is not in DB and free on host
    for (let port = this.startPort; port <= this.endPort; port++) {
      if (!assignedPorts.has(port)) {
        const isFree = await this.isPortFreeOnHost(port);
        if (isFree) {
          // Assign to project in DB
          await db
            .update(projects)
            .set({
              hostPort: port,
              updatedAt: new Date(),
            })
            .where(eq(projects.id, projectId));

          logger.info({ projectId, port }, "Allocated host port for project");
          return port;
        }
      }
    }

    throw new AppError(
      `No available ports in range [${this.startPort}, ${this.endPort}]`,
      503
    );
  }

  /**
   * Releases an allocated port from the project
   */
  async releasePort(projectId: string): Promise<void> {
    await db
      .update(projects)
      .set({
        hostPort: null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    logger.info({ projectId }, "Released host port for project");
  }
}

export const portAllocatorService = new PortAllocatorService();

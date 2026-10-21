import Docker from "dockerode";
import { eq } from "drizzle-orm";
import type { Readable } from "node:stream";
import { db } from "../../db/client.js";
import { projects } from "../../db/schema.js";
import { env } from "../../config/env.js";
import { CONSTANTS } from "../../config/constants.js";
import { portAllocatorService } from "../portAllocator.service.js";
import { fileStoreService } from "../fileStore.service.js";
import { DockerError, NotFoundError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import type {
  ExecutionEngine,
  ExecutionStatusInfo,
  ExecutionCommandResult,
} from "./types.js";
import type { ProjectStatus } from "../../types/index.js";

export class DockerExecutionEngine implements ExecutionEngine {
  readonly name = "docker";
  private docker: Docker;
  private isDockerAvailable = false;

  constructor() {
    this.docker = new Docker({
      socketPath: env.DOCKER_SOCKET,
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      this.isDockerAvailable = true;
      return true;
    } catch {
      this.isDockerAvailable = false;
      return false;
    }
  }

  async ensureNetwork(): Promise<string> {
    if (!this.isDockerAvailable) return "bridge";
    try {
      const networks = await this.docker.listNetworks();
      const existing = networks.find(
        (n) => n.Name === CONSTANTS.DOCKER.NETWORK_NAME
      );
      if (existing) {
        return existing.Id;
      }

      const network = await this.docker.createNetwork({
        Name: CONSTANTS.DOCKER.NETWORK_NAME,
        Driver: "bridge",
        CheckDuplicate: true,
        Internal: false,
        Attachable: true,
        Labels: {
          "forge.network": "true",
        },
      });
      return network.id;
    } catch (err: any) {
      return "bridge";
    }
  }

  async start(projectId: string): Promise<ExecutionStatusInfo> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    const available = await this.isAvailable();
    if (!available) {
      throw new DockerError(
        `Docker daemon is not reachable at ${env.DOCKER_SOCKET}.`
      );
    }

    await db
      .update(projects)
      .set({ status: "starting", updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    try {
      const hostPort = await portAllocatorService.allocatePort(projectId);
      const hostWorkspace = fileStoreService.getWorkspaceDir(projectId);
      await fileStoreService.initWorkspace(projectId);

      if (project.containerId) {
        await this.safeRemoveContainer(project.containerId);
      }

      await this.ensureNetwork();

      const primaryImage = `forge-sandbox-${project.framework}:latest`;
      const secondaryImage = `${project.framework}-sandbox:latest`;

      const fallbackImage =
        project.language === "python"
          ? "python:3.11-slim"
          : project.language === "typescript"
          ? "oven/bun:1.1"
          : project.language === "go"
          ? "golang:1.22-alpine"
          : project.language === "rust"
          ? "rust:1.77-slim"
          : "node:20-slim";

      let targetImage = fallbackImage;
      try {
        await this.docker.getImage(primaryImage).inspect();
        targetImage = primaryImage;
      } catch {
        try {
          await this.docker.getImage(secondaryImage).inspect();
          targetImage = secondaryImage;
        } catch {
          targetImage = fallbackImage;
        }
      }

      const container = await this.docker.createContainer({
        Image: targetImage,
        name: `forge-project-${projectId}`,
        WorkingDir: CONSTANTS.DOCKER.WORKSPACE_DIR,
        User: CONSTANTS.DOCKER.DEFAULT_USER,
        ExposedPorts: {
          [`${CONSTANTS.DOCKER.CONTAINER_INTERNAL_PORT}/tcp`]: {},
        },
        HostConfig: {
          Binds: [`${hostWorkspace}:${CONSTANTS.DOCKER.WORKSPACE_DIR}`],
          PortBindings: {
            [`${CONSTANTS.DOCKER.CONTAINER_INTERNAL_PORT}/tcp`]: [
              { HostIp: "127.0.0.1", HostPort: `${hostPort}` },
            ],
          },
          Memory: CONSTANTS.DOCKER.MEMORY_LIMIT,
          NanoCpus: CONSTANTS.DOCKER.NANO_CPUS,
          PidsLimit: CONSTANTS.DOCKER.PIDS_LIMIT,
          CapDrop: [...CONSTANTS.DOCKER.CAP_DROP],
          SecurityOpt: [...CONSTANTS.DOCKER.SECURITY_OPT],
          NetworkMode: CONSTANTS.DOCKER.NETWORK_NAME,
          RestartPolicy: CONSTANTS.DOCKER.RESTART_POLICY,
          LogConfig: CONSTANTS.DOCKER.LOG_CONFIG,
        },
        Labels: {
          "forge.project": projectId,
          "forge.user": project.userId,
          "forge.framework": project.framework,
        },
        Env: [
          `PORT=${CONSTANTS.DOCKER.CONTAINER_INTERNAL_PORT}`,
          `HOST=0.0.0.0`,
          `PROJECT_ID=${projectId}`,
        ],
      });

      await container.start();
      const containerId = container.id;

      const timeoutMs = CONSTANTS.DOCKER.HEALTH_CHECK_TIMEOUT_MS;
      const startTime = Date.now();
      let isReady = false;

      while (Date.now() - startTime < timeoutMs) {
        try {
          const res = await fetch(`http://127.0.0.1:${hostPort}/openapi.json`, {
            signal: AbortSignal.timeout(1000),
          }).catch(() =>
            fetch(`http://127.0.0.1:${hostPort}/health`, {
              signal: AbortSignal.timeout(1000),
            })
          ).catch(() =>
            fetch(`http://127.0.0.1:${hostPort}/`, {
              signal: AbortSignal.timeout(1000),
            })
          );

          if (res) {
            isReady = true;
            break;
          }
        } catch {
          // not ready
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      await db
        .update(projects)
        .set({
          status: "running",
          containerId,
          lastStartedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      return {
        status: "running",
        containerId,
        hostPort,
        engine: this.name,
      };
    } catch (err: any) {
      await db
        .update(projects)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(projects.id, projectId));

      throw new DockerError(`Failed to start project container: ${err.message}`);
    }
  }

  async stop(projectId: string): Promise<ExecutionStatusInfo> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    if (project.containerId && this.isDockerAvailable) {
      await this.safeRemoveContainer(project.containerId);
    }

    await portAllocatorService.releasePort(projectId);

    await db
      .update(projects)
      .set({
        status: "stopped",
        containerId: null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    return {
      status: "stopped",
      containerId: null,
      hostPort: null,
      engine: this.name,
    };
  }

  async restart(projectId: string): Promise<ExecutionStatusInfo> {
    await this.stop(projectId);
    return this.start(projectId);
  }

  async getStatus(projectId: string): Promise<ExecutionStatusInfo> {
    const [project] = await db
      .select({
        status: projects.status,
        containerId: projects.containerId,
        hostPort: projects.hostPort,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    if (!project.containerId || !this.isDockerAvailable) {
      return {
        status: project.status as ProjectStatus,
        containerId: project.containerId,
        hostPort: project.hostPort,
        engine: this.name,
      };
    }

    try {
      const container = this.docker.getContainer(project.containerId);
      const inspect = await container.inspect();
      const isRunning = inspect.State.Running;
      const status: ProjectStatus = isRunning ? "running" : "stopped";

      return {
        status,
        containerId: project.containerId,
        hostPort: project.hostPort,
        engine: this.name,
      };
    } catch {
      return {
        status: "stopped",
        containerId: project.containerId,
        hostPort: project.hostPort,
        engine: this.name,
      };
    }
  }

  async getLogs(
    projectId: string,
    tail = 200,
    follow = false
  ): Promise<Readable> {
    const [project] = await db
      .select({ containerId: projects.containerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project?.containerId) {
      throw new NotFoundError("Project is not running (no active container)");
    }

    const container = this.docker.getContainer(project.containerId);
    return (await (container as any).logs({
      stdout: true,
      stderr: true,
      tail,
      follow,
      timestamps: true,
    })) as unknown as Readable;
  }

  private async safeRemoveContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      try {
        await container.stop({ t: 5 });
      } catch {
        // already stopped
      }
      await container.remove({ force: true });
    } catch (err: any) {
      logger.warn(
        { containerId, err: err.message },
        "Error removing container or container does not exist"
      );
    }
  }

  async reconcile(): Promise<void> {
    const isConnected = await this.isAvailable();
    if (!isConnected) {
      logger.info("Skipping Docker reconciliation: Docker daemon is currently unreachable");
      return;
    }

    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: { label: ["forge.project"] },
      });

      for (const info of containers) {
        const projectId = info.Labels["forge.project"];
        if (projectId) {
          const [proj] = await db
            .select({ id: projects.id, status: projects.status })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

          if (!proj || proj.status === "stopped") {
            await this.safeRemoveContainer(info.Id);
          }
        }
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, "Error during Docker reconciliation");
    }
  }
}

import Docker from "dockerode";
import { eq } from "drizzle-orm";
import { Readable } from "node:stream";
import { db } from "../db/client.js";
import { projects } from "../db/schema.js";
import { env } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import { portAllocatorService } from "./portAllocator.service.js";
import { fileStoreService } from "./fileStore.service.js";
import { DockerError, NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type { ContainerStatusInfo, ProjectStatus } from "../types/index.js";

export class DockerService {
  private docker: Docker;
  private isDockerAvailable = false;

  constructor() {
    this.docker = new Docker({
      socketPath: env.DOCKER_SOCKET,
    });
  }

  /**
   * Pings Docker daemon to verify connectivity
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.docker.ping();
      this.isDockerAvailable = true;
      logger.info(
        { socket: env.DOCKER_SOCKET },
        "Docker daemon connected successfully"
      );
      return true;
    } catch (err: any) {
      this.isDockerAvailable = false;
      logger.warn(
        { socket: env.DOCKER_SOCKET, err: err.message },
        "Docker daemon is not reachable at configured socket"
      );
      return false;
    }
  }

  /**
   * Ensures the isolated sandbox bridge network exists
   */
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
      logger.info(
        { networkId: network.id },
        "Created Forge isolated Docker network"
      );
      return network.id;
    } catch (err: any) {
      logger.warn(
        { err: err.message },
        "Falling back to standard bridge network"
      );
      return "bridge";
    }
  }

  /**
   * Starts a project's container
   */
  async startProject(projectId: string): Promise<ContainerStatusInfo> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    const isConnected = await this.checkConnection();
    if (!isConnected) {
      throw new DockerError(
        `Docker daemon is not reachable at ${env.DOCKER_SOCKET}. Please ensure Docker is running.`
      );
    }

    // Set status to starting
    await db
      .update(projects)
      .set({ status: "starting", updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    try {
      // 1. Allocate host port
      const hostPort = await portAllocatorService.allocatePort(projectId);

      // 2. Prepare workspace directory on host
      const hostWorkspace = fileStoreService.getWorkspaceDir(projectId);
      await fileStoreService.initWorkspace(projectId);

      // 3. Clean up existing container if any
      if (project.containerId) {
        await this.safeRemoveContainer(project.containerId);
      }

      await this.ensureNetwork();

      // Determine container image (try forge-sandbox-<fw>, then <fw>-sandbox, then language fallback)
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
          logger.info(
            { primaryImage, secondaryImage, targetImage },
            "Custom sandbox image not found, using fallback base image"
          );
        }
      }

      // 4. Create container with hardened security profile
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

      // 5. Start container
      await container.start();
      const containerId = container.id;

      // 6. Poll for readiness (up to 30s)
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
          // container not accepting connections yet
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      // 7. Update project status in DB
      await db
        .update(projects)
        .set({
          status: "running",
          containerId,
          lastStartedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      logger.info(
        { projectId, containerId, hostPort, isReady },
        "Container started successfully"
      );

      return {
        status: "running",
        containerId,
        hostPort,
      };
    } catch (err: any) {
      await db
        .update(projects)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(projects.id, projectId));

      logger.error({ projectId, err: err.message }, "Failed to start container");
      throw new DockerError(`Failed to start project container: ${err.message}`);
    }
  }

  /**
   * Stops a project's container and reclaims the port
   */
  async stopProject(projectId: string): Promise<ContainerStatusInfo> {
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

    logger.info({ projectId }, "Container stopped and port released");

    return {
      status: "stopped",
      containerId: null,
      hostPort: null,
    };
  }

  /**
   * Restarts a project's container
   */
  async restartProject(projectId: string): Promise<ContainerStatusInfo> {
    await this.stopProject(projectId);
    return this.startProject(projectId);
  }

  /**
   * Gets current status of container
   */
  async getStatus(projectId: string): Promise<ContainerStatusInfo> {
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
        status: project.status,
        containerId: project.containerId,
        hostPort: project.hostPort,
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
      };
    } catch {
      return {
        status: "stopped",
        containerId: project.containerId,
        hostPort: project.hostPort,
      };
    }
  }

  /**
   * Retrieves container log stream
   */
  async getContainerLogs(
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
    const stream = (await (container as any).logs({
      stdout: true,
      stderr: true,
      tail,
      follow,
      timestamps: true,
    })) as unknown as Readable;

    return stream;
  }

  /**
   * Safely stops and removes a container by ID
   */
  private async safeRemoveContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      try {
        await container.stop({ t: 5 });
      } catch {
        // Container may already be stopped
      }
      await container.remove({ force: true });
    } catch (err: any) {
      logger.warn(
        { containerId, err: err.message },
        "Error removing container or container does not exist"
      );
    }
  }

  /**
   * Reconciles running containers against database on startup
   * Stops orphaned containers and marks missing containers as stopped
   */
  async reconcile(): Promise<void> {
    const isConnected = await this.checkConnection();
    if (!isConnected) {
      logger.info(
        "Skipping Docker reconciliation: Docker daemon is currently unreachable"
      );
      return;
    }

    try {
      logger.info("Starting Docker container reconciliation...");
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ["forge.project"],
        },
      });

      const dbProjects = await db.select().from(projects);
      const activeProjectIds = new Set(dbProjects.map((p) => p.id));
      const projectMap = new Map(dbProjects.map((p) => [p.id, p]));

      for (const containerInfo of containers) {
        const projectId = containerInfo.Labels["forge.project"];
        const project = projectMap.get(projectId);

        if (!activeProjectIds.has(projectId) || !project) {
          // Orphan container - project was deleted while server was offline
          logger.info(
            { containerId: containerInfo.Id, projectId },
            "Removing orphaned container"
          );
          await this.safeRemoveContainer(containerInfo.Id);
        } else if (
          project.status === "stopped" &&
          containerInfo.State === "running"
        ) {
          // Container running but DB says stopped
          logger.info(
            { containerId: containerInfo.Id, projectId },
            "Stopping stray container"
          );
          await this.safeRemoveContainer(containerInfo.Id);
        } else if (
          project.status === "running" &&
          containerInfo.State === "running"
        ) {
          // Reattach container to project if containerId changed
          if (project.containerId !== containerInfo.Id) {
            await db
              .update(projects)
              .set({ containerId: containerInfo.Id, updatedAt: new Date() })
              .where(eq(projects.id, projectId));
            logger.info(
              { containerId: containerInfo.Id, projectId },
              "Reattached running container to project"
            );
          }
        }
      }

      // Mark projects whose containers died as error
      for (const p of dbProjects) {
        if (p.status === "running") {
          const match = containers.find(
            (c) => c.Labels["forge.project"] === p.id && c.State === "running"
          );
          if (!match) {
            await db
              .update(projects)
              .set({ status: "error", containerId: null, updatedAt: new Date() })
              .where(eq(projects.id, p.id));
            logger.info(
              { projectId: p.id },
              "Marked dead container project as error"
            );
          }
        }
      }

      logger.info("Docker container reconciliation complete");
    } catch (err: any) {
      logger.error({ err: err.message }, "Error during Docker reconciliation");
    }
  }
}

export const dockerService = new DockerService();

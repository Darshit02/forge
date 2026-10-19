import { spawn, type ChildProcess } from "node:child_process";
import { Readable, PassThrough } from "node:stream";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { projects, environments } from "../../db/schema.js";
import { portAllocatorService } from "../portAllocator.service.js";
import { fileStoreService } from "../fileStore.service.js";
import { wsHub } from "../../ws/hub.js";
import { NotFoundError, AppError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import type {
  ExecutionEngine,
  ExecutionStatusInfo,
  ExecutionCommandResult,
} from "./types.js";
import type { ProjectStatus } from "../../types/index.js";

interface RunningProcess {
  process: ChildProcess;
  pid: number;
  hostPort: number;
  startedAt: Date;
  logs: string[];
  streamListeners: Set<(chunk: string) => void>;
}

export class ProcessExecutionEngine implements ExecutionEngine {
  readonly name = "process";
  private runningProcesses = new Map<string, RunningProcess>();
  private readonly MAX_LOG_LINES = 2000;

  async isAvailable(): Promise<boolean> {
    return true; // Native process execution is always available on host
  }

  /**
   * Resolves the command and args needed to launch a framework project
   */
  private resolveLaunchCommand(
    framework: string,
    language: string,
    port: number
  ): { command: string; args: string[] } {
    const isWindows = process.platform === "win32";

    switch (framework.toLowerCase()) {
      case "fastapi":
        return {
          command: isWindows ? "python" : "python3",
          args: ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", `${port}`],
        };
      case "flask":
        return {
          command: isWindows ? "python" : "python3",
          args: ["app.py"],
        };
      case "django":
        return {
          command: isWindows ? "python" : "python3",
          args: ["manage.py", "runserver", `0.0.0.0:${port}`, "--noreload"],
        };
      case "express":
        return {
          command: "node",
          args: ["index.js"],
        };
      case "fastify":
        return {
          command: "node",
          args: ["src/index.js"],
        };
      case "hono":
        return {
          command: "bun",
          args: ["run", "src/index.ts"],
        };
      case "nestjs":
        return {
          command: "npm",
          args: ["run", "start:dev"],
        };
      case "fiber":
      case "gin":
        return {
          command: "go",
          args: ["run", "main.go"],
        };
      case "axum":
        return {
          command: "cargo",
          args: ["run"],
        };
      default:
        if (language === "python") {
          return {
            command: isWindows ? "python" : "python3",
            args: ["main.py"],
          };
        }
        return {
          command: "node",
          args: ["index.js"],
        };
    }
  }

  /**
   * Loads custom project environment variables
   */
  private async loadProjectEnv(projectId: string): Promise<Record<string, string>> {
    const envVars: Record<string, string> = {};
    try {
      const records = await db
        .select()
        .from(environments)
        .where(eq(environments.projectId, projectId));

      for (const rec of records) {
        if (rec.variables && typeof rec.variables === "object") {
          Object.assign(envVars, rec.variables);
        }
      }
    } catch (err: any) {
      logger.warn({ projectId, err: err.message }, "Could not load project environment variables");
    }
    return envVars;
  }

  /**
   * Starts a project using direct process execution
   */
  async start(projectId: string): Promise<ExecutionStatusInfo> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    // Stop existing process if already running
    if (this.runningProcesses.has(projectId)) {
      await this.stop(projectId);
    }

    // Set starting status
    await db
      .update(projects)
      .set({ status: "starting", updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    wsHub.broadcastContainerStatus(projectId, "starting");

    try {
      // 1. Allocate host port
      const hostPort = await portAllocatorService.allocatePort(projectId);

      // 2. Prepare workspace directory
      const workspaceDir = fileStoreService.getWorkspaceDir(projectId);
      await fileStoreService.initWorkspace(projectId);

      // 3. Resolve launch command
      const { command, args } = this.resolveLaunchCommand(
        project.framework,
        project.language,
        hostPort
      );

      // 4. Resolve environment variables
      const customEnv = await this.loadProjectEnv(projectId);
      const childEnv = {
        ...process.env,
        ...customEnv,
        PORT: `${hostPort}`,
        HOST: "0.0.0.0",
        PROJECT_ID: projectId,
        NODE_ENV: "development",
        PYTHONUNBUFFERED: "1",
      };

      logger.info(
        { projectId, command, args, workspaceDir, hostPort },
        "Launching backend process"
      );

      // 5. Spawn process
      const child = spawn(command, args, {
        cwd: workspaceDir,
        env: childEnv,
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
      });

      const pid = child.pid || Date.now();
      const processInfo: RunningProcess = {
        process: child,
        pid,
        hostPort,
        startedAt: new Date(),
        logs: [],
        streamListeners: new Set(),
      };

      this.runningProcesses.set(projectId, processInfo);

      const appendLog = (line: string) => {
        processInfo.logs.push(line);
        if (processInfo.logs.length > this.MAX_LOG_LINES) {
          processInfo.logs.shift();
        }
        for (const listener of processInfo.streamListeners) {
          try {
            listener(line);
          } catch {
            // ignore listener error
          }
        }
        wsHub.broadcastContainerLog(projectId, line);
      };

      appendLog(`[Forge Engine] Starting ${project.framework} backend service on port ${hostPort}...`);

      child.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        for (const line of text.split(/\r?\n/)) {
          if (line) appendLog(line);
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        for (const line of text.split(/\r?\n/)) {
          if (line) appendLog(line);
        }
      });

      child.on("error", async (err: any) => {
        logger.error({ projectId, err: err.message }, "Backend process error");
        appendLog(`[Forge Engine Error] ${err.message}`);
        this.runningProcesses.delete(projectId);
        await portAllocatorService.releasePort(projectId);
        await db
          .update(projects)
          .set({ status: "error", updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        wsHub.broadcastContainerStatus(projectId, "error");
      });

      child.on("exit", async (code, signal) => {
        logger.info(
          { projectId, code, signal },
          "Backend process terminated"
        );
        appendLog(`[Forge Engine] Process exited (code: ${code ?? 0}, signal: ${signal ?? "none"})`);
        this.runningProcesses.delete(projectId);
        await portAllocatorService.releasePort(projectId);

        const newStatus: ProjectStatus = code === 0 || signal === "SIGTERM" ? "stopped" : "error";
        await db
          .update(projects)
          .set({ status: newStatus, containerId: null, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        wsHub.broadcastContainerStatus(projectId, newStatus);
      });

      // 6. Readiness check (poll for up to 15s)
      const startTime = Date.now();
      const timeoutMs = 15000;
      let isReady = false;

      while (Date.now() - startTime < timeoutMs) {
        if (!this.runningProcesses.has(projectId)) {
          break; // Process died during startup
        }
        try {
          const res = await fetch(`http://127.0.0.1:${hostPort}/openapi.json`, {
            signal: AbortSignal.timeout(800),
          }).catch(() =>
            fetch(`http://127.0.0.1:${hostPort}/health`, {
              signal: AbortSignal.timeout(800),
            })
          ).catch(() =>
            fetch(`http://127.0.0.1:${hostPort}/`, {
              signal: AbortSignal.timeout(800),
            })
          );

          if (res) {
            isReady = true;
            break;
          }
        } catch {
          // not ready yet
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      // 7. Update status to running
      await db
        .update(projects)
        .set({
          status: "running",
          containerId: `proc-${pid}`,
          lastStartedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      logger.info(
        { projectId, pid, hostPort, isReady },
        "Backend process started successfully"
      );

      return {
        status: "running",
        containerId: `proc-${pid}`,
        hostPort,
        engine: this.name,
      };
    } catch (err: any) {
      await this.stop(projectId).catch(() => {});
      await db
        .update(projects)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(projects.id, projectId));
      wsHub.broadcastContainerStatus(projectId, "error");
      logger.error({ projectId, err: err.message }, "Failed to start backend process");
      throw new AppError(`Failed to start backend process: ${err.message}`, 500);
    }
  }

  /**
   * Stops a running project process
   */
  async stop(projectId: string): Promise<ExecutionStatusInfo> {
    const running = this.runningProcesses.get(projectId);
    if (running) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", `${running.pid}`, "/T", "/F"], { stdio: "ignore" });
        } else {
          running.process.kill("SIGTERM");
          setTimeout(() => {
            try {
              running.process.kill("SIGKILL");
            } catch {
              // already dead
            }
          }, 3000);
        }
      } catch (err: any) {
        logger.warn({ projectId, err: err.message }, "Error killing backend process");
      }
      this.runningProcesses.delete(projectId);
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

    logger.info({ projectId }, "Backend process stopped and port released");

    return {
      status: "stopped",
      containerId: null,
      hostPort: null,
      engine: this.name,
    };
  }

  /**
   * Restarts the project process
   */
  async restart(projectId: string): Promise<ExecutionStatusInfo> {
    await this.stop(projectId);
    return this.start(projectId);
  }

  /**
   * Gets current execution status
   */
  async getStatus(projectId: string): Promise<ExecutionStatusInfo> {
    const running = this.runningProcesses.get(projectId);
    if (running) {
      return {
        status: "running",
        containerId: `proc-${running.pid}`,
        hostPort: running.hostPort,
        uptimeSeconds: Math.floor((Date.now() - running.startedAt.getTime()) / 1000),
        engine: this.name,
      };
    }

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

    return {
      status: (project.status as ProjectStatus) || "stopped",
      containerId: project.containerId,
      hostPort: project.hostPort,
      engine: this.name,
    };
  }

  /**
   * Returns a log stream for the project
   */
  async getLogs(
    projectId: string,
    tail = 200,
    follow = false
  ): Promise<Readable> {
    const stream = new PassThrough();
    const running = this.runningProcesses.get(projectId);

    if (!running) {
      // Write historical note and close
      stream.write("[Forge Engine] Service is currently stopped.\n");
      if (!follow) {
        stream.end();
      }
      return stream;
    }

    // Output tail logs
    const slice = running.logs.slice(-tail);
    for (const line of slice) {
      stream.write(`${line}\n`);
    }

    if (!follow) {
      stream.end();
      return stream;
    }

    // Follow live output
    const listener = (line: string) => {
      stream.write(`${line}\n`);
    };

    running.streamListeners.add(listener);

    stream.on("close", () => {
      running.streamListeners.delete(listener);
    });

    return stream;
  }

  /**
   * Runs a command in the project workspace
   */
  async executeCommand(
    projectId: string,
    cmd: string
  ): Promise<ExecutionCommandResult> {
    const workspaceDir = fileStoreService.getWorkspaceDir(projectId);
    return new Promise((resolve) => {
      const parts = cmd.split(" ");
      const bin = parts[0]!;
      const args = parts.slice(1);

      const child = spawn(bin, args, {
        cwd: workspaceDir,
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (d) => (stdout += d.toString()));
      child.stderr?.on("data", (d) => (stderr += d.toString()));

      child.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      });

      child.on("error", (err) => {
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
        });
      });
    });
  }

  /**
   * Reconciles process states on startup
   */
  async reconcile(): Promise<void> {
    logger.info("Initializing ProcessExecutionEngine: resetting dangling running statuses in DB");
    await db
      .update(projects)
      .set({ status: "stopped", containerId: null })
      .where(eq(projects.status, "running"));
  }

  /**
   * Stops all running processes on shutdown
   */
  async stopAll(): Promise<void> {
    logger.info(`Shutting down all (${this.runningProcesses.size}) active backend processes`);
    const projectIds = Array.from(this.runningProcesses.keys());
    await Promise.allSettled(projectIds.map((id) => this.stop(id)));
  }
}

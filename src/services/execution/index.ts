import type { Readable } from "node:stream";
import { ProcessExecutionEngine } from "./process.engine.js";
import { DockerExecutionEngine } from "./docker.engine.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type {
  ExecutionEngine,
  ExecutionStatusInfo,
  ExecutionCommandResult,
} from "./types.js";

export class ExecutionService implements ExecutionEngine {
  readonly name = "execution-manager";
  private processEngine: ProcessExecutionEngine;
  private dockerEngine: DockerExecutionEngine;
  private activeEngineCache: ExecutionEngine | null = null;

  constructor() {
    this.processEngine = new ProcessExecutionEngine();
    this.dockerEngine = new DockerExecutionEngine();
  }

  /**
   * Resolves the best available execution engine:
   * 1. If explicit config 'process' -> ProcessExecutionEngine
   * 2. If explicit config 'docker' -> DockerExecutionEngine
   * 3. If 'auto' -> Try Docker if daemon is running; otherwise fallback to ProcessExecutionEngine seamlessly
   */
  async getActiveEngine(): Promise<ExecutionEngine> {
    const configured = (process.env.EXECUTION_ENGINE || "auto").toLowerCase();

    if (configured === "process") {
      return this.processEngine;
    }

    if (configured === "docker") {
      const dockerOk = await this.dockerEngine.isAvailable();
      if (!dockerOk) {
        logger.warn("Docker engine requested but daemon is unreachable. Falling back to process engine.");
        return this.processEngine;
      }
      return this.dockerEngine;
    }

    // Auto mode
    const dockerRunning = await this.dockerEngine.isAvailable();
    if (dockerRunning) {
      logger.info("Auto execution mode: Docker daemon detected, using Docker engine");
      return this.dockerEngine;
    }

    logger.info("Auto execution mode: No Docker daemon detected, using native process execution engine");
    return this.processEngine;
  }

  async isAvailable(): Promise<boolean> {
    const engine = await this.getActiveEngine();
    return engine.isAvailable();
  }

  async start(projectId: string): Promise<ExecutionStatusInfo> {
    const engine = await this.getActiveEngine();
    return engine.start(projectId);
  }

  async stop(projectId: string): Promise<ExecutionStatusInfo> {
    // Attempt stop on both to ensure clean state
    await this.processEngine.stop(projectId).catch(() => {});
    await this.dockerEngine.stop(projectId).catch(() => {});

    return {
      status: "stopped",
      containerId: null,
      hostPort: null,
      engine: this.name,
    };
  }

  async restart(projectId: string): Promise<ExecutionStatusInfo> {
    const engine = await this.getActiveEngine();
    return engine.restart(projectId);
  }

  async getStatus(projectId: string): Promise<ExecutionStatusInfo> {
    const engine = await this.getActiveEngine();
    return engine.getStatus(projectId);
  }

  async getLogs(
    projectId: string,
    tail = 200,
    follow = false
  ): Promise<Readable> {
    const engine = await this.getActiveEngine();
    return engine.getLogs(projectId, tail, follow);
  }

  async executeCommand(
    projectId: string,
    cmd: string
  ): Promise<ExecutionCommandResult> {
    const engine = await this.getActiveEngine();
    if (engine.executeCommand) {
      return engine.executeCommand(projectId, cmd);
    }
    return this.processEngine.executeCommand(projectId, cmd);
  }

  async reconcile(): Promise<void> {
    await this.processEngine.reconcile?.();
    await this.dockerEngine.reconcile?.();
  }

  async stopAll(): Promise<void> {
    await this.processEngine.stopAll?.();
  }
}

export const executionService = new ExecutionService();
export * from "./types.js";

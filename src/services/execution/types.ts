import type { Readable } from "node:stream";
import type { ProjectStatus } from "../types/index.js";

export type ExecutionEngineType = "process" | "docker" | "auto";

export interface ExecutionStatusInfo {
  status: ProjectStatus;
  containerId: string | null; // execution identifier (process PID, container ID, etc.)
  hostPort: number | null;
  uptimeSeconds?: number;
  engine?: string;
  error?: string;
}

export interface ExecutionCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecutionEngine {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  start(projectId: string): Promise<ExecutionStatusInfo>;
  stop(projectId: string): Promise<ExecutionStatusInfo>;
  restart(projectId: string): Promise<ExecutionStatusInfo>;
  getStatus(projectId: string): Promise<ExecutionStatusInfo>;
  getLogs(projectId: string, tail?: number, follow?: boolean): Promise<Readable>;
  executeCommand?(projectId: string, cmd: string): Promise<ExecutionCommandResult>;
  reconcile?(): Promise<void>;
  stopAll?(): Promise<void>;
}

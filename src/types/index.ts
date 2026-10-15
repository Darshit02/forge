import type { ServerWebSocket } from "bun";

export type ProjectLanguage = "python" | "node" | "typescript" | "go" | "rust";

export type ProjectFramework =
  | "fastapi"
  | "flask"
  | "django"
  | "express"
  | "nestjs"
  | "hono"
  | "fastify"
  | "fiber"
  | "gin"
  | "axum";

export type ProjectStatus =
  | "stopped"
  | "starting"
  | "running"
  | "error"
  | "building";

export type AIProviderType = "openai" | "anthropic" | "google" | "custom";

export type ChatRole = "user" | "assistant" | "system" | "tool";

export type ChatMode = "chat" | "edit" | "agent";

export interface JwtPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface FileTreeNode {
  name: string;
  path: string; // relative to workspace root
  type: "file" | "directory";
  size?: number;
  children?: FileTreeNode[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  updatedAt: Date;
}

export interface ContainerStatusInfo {
  status: ProjectStatus;
  containerId: string | null;
  hostPort: number | null;
  uptimeSeconds?: number;
}

// WebSocket Message Schemas
export type WSClientMessage =
  | { type: "ping" }
  | { type: "subscribe"; projectId: string }
  | { type: "unsubscribe"; projectId: string };

export type WSServerMessage =
  | { type: "container.status"; status: ProjectStatus }
  | { type: "container.log"; line: string }
  | { type: "spec.updated"; spec: Record<string, unknown> }
  | { type: "file.changed"; path: string; content?: string }
  | { type: "ai.token"; delta: string }
  | { type: "ai.done"; messageId: string }
  | { type: "test.result"; requestId?: string; response: TestResponsePayload }
  | { type: "error"; error: string };

export interface TestRequestPayload {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  environmentId?: string;
  requestId?: string;
}

export interface TestResponsePayload {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
}

export interface ToolCallExecution {
  toolCallId: string;
  toolName: "writeFile" | "deleteFile" | "readFile" | "runCommand";
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ClientConnectionContext {
  userId: string;
  projectId: string;
  ws: ServerWebSocket<unknown>;
}

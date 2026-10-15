import { z } from "zod";
import { ProjectStatusSchema } from "./enums.js";
import { TestResponsePayloadSchema } from "./api.js";

// ==========================================
// WebSocket Server Messages (Server -> Client)
// ==========================================
export const ContainerStatusMessageSchema = z.object({
  type: z.literal("container.status"),
  status: ProjectStatusSchema,
});

export const ContainerLogMessageSchema = z.object({
  type: z.literal("container.log"),
  line: z.string(),
});

export const SpecUpdatedMessageSchema = z.object({
  type: z.literal("spec.updated"),
  spec: z.record(z.unknown()),
  diff: z.unknown().optional(),
});

export const FileChangedMessageSchema = z.object({
  type: z.literal("file.changed"),
  path: z.string(),
  content: z.string().optional(),
});

export const AiTokenMessageSchema = z.object({
  type: z.literal("ai.token"),
  delta: z.string(),
});

export const AiDoneMessageSchema = z.object({
  type: z.literal("ai.done"),
  messageId: z.string(),
});

export const AiErrorMessageSchema = z.object({
  type: z.literal("ai.error"),
  error: z.string(),
});

export const TestResultMessageSchema = z.object({
  type: z.literal("test.result"),
  requestId: z.string().optional(),
  response: TestResponsePayloadSchema,
});

export const PongMessageSchema = z.object({
  type: z.literal("pong"),
  timestamp: z.number().optional(),
});

export const ErrorMessageSchema = z.object({
  type: z.literal("error"),
  error: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  ContainerStatusMessageSchema,
  ContainerLogMessageSchema,
  SpecUpdatedMessageSchema,
  FileChangedMessageSchema,
  AiTokenMessageSchema,
  AiDoneMessageSchema,
  AiErrorMessageSchema,
  TestResultMessageSchema,
  PongMessageSchema,
  ErrorMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
export type WSServerMessage = ServerMessage;

// ==========================================
// WebSocket Client Messages (Client -> Server)
// ==========================================
export const PingMessageSchema = z.object({
  type: z.literal("ping"),
});

export const SubscribeMessageSchema = z.object({
  type: z.literal("subscribe"),
  projectId: z.string(),
});

export const UnsubscribeMessageSchema = z.object({
  type: z.literal("unsubscribe"),
  projectId: z.string(),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  PingMessageSchema,
  SubscribeMessageSchema,
  UnsubscribeMessageSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type WSClientMessage = ClientMessage;

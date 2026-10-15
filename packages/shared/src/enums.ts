import { z } from "zod";

export const ProjectLanguageSchema = z.enum([
  "python",
  "node",
  "typescript",
  "go",
  "rust",
]);
export type ProjectLanguage = z.infer<typeof ProjectLanguageSchema>;

export const ProjectFrameworkSchema = z.enum([
  "fastapi",
  "flask",
  "django",
  "express",
  "nestjs",
  "hono",
  "fastify",
  "fiber",
  "gin",
  "axum",
]);
export type ProjectFramework = z.infer<typeof ProjectFrameworkSchema>;

export const ProjectStatusSchema = z.enum([
  "stopped",
  "starting",
  "running",
  "error",
  "building",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const AIProviderTypeSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "custom",
]);
export type AIProviderType = z.infer<typeof AIProviderTypeSchema>;

export const ChatRoleSchema = z.enum(["user", "assistant", "system", "tool"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatModeSchema = z.enum(["chat", "edit", "agent"]);
export type ChatMode = z.infer<typeof ChatModeSchema>;

export const HttpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

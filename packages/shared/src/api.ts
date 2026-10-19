import { z } from "zod";
import {
  AIProviderTypeSchema,
  ChatModeSchema,
  ChatRoleSchema,
  HttpMethodSchema,
  ProjectFrameworkSchema,
  ProjectLanguageSchema,
  ProjectStatusSchema,
} from "./enums.js";

// ==========================================
// 1. Auth Schemas
// ==========================================
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(1).max(100).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ==========================================
// 2. AI Provider Schemas
// ==========================================
export const CreateProviderRequestSchema = z.object({
  provider: AIProviderTypeSchema,
  label: z.string().min(1).max(50),
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().optional().nullable(),
  modelDefault: z.string().min(1).optional(),
});
export type CreateProviderRequest = z.infer<typeof CreateProviderRequestSchema>;

export const UpdateProviderRequestSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  apiKey: z.string().min(1).optional(),
  baseUrl: z.string().url().optional().nullable(),
  modelDefault: z.string().min(1).optional(),
});
export type UpdateProviderRequest = z.infer<typeof UpdateProviderRequestSchema>;

export const AiProviderSchema = z.object({
  id: z.string(),
  provider: AIProviderTypeSchema,
  label: z.string(),
  maskedKey: z.string(),
  baseUrl: z.string().nullable(),
  modelDefault: z.string(),
  isDefault: z.boolean(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});
export type AiProvider = z.infer<typeof AiProviderSchema>;
export type AIProvider = AiProvider;

// ==========================================
// 3. Project Schemas
// ==========================================
export const TemplateMetadataSchema = z.object({
  id: ProjectFrameworkSchema,
  name: z.string(),
  language: ProjectLanguageSchema,
  description: z.string(),
  defaultPort: z.number(),
  openApiEndpoints: z.array(z.string()),
});
export type TemplateMetadata = z.infer<typeof TemplateMetadataSchema>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  language: ProjectLanguageSchema,
  framework: ProjectFrameworkSchema,
  aiProviderId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || undefined),
  source: z.enum(["scratch", "import"]).default("scratch"),
  folderPath: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  importSource: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("git"),
        url: z.string().url("Valid Git URL is required"),
      }),
      z.object({
        type: z.literal("template"),
        templateId: ProjectFrameworkSchema,
      }),
    ])
    .optional(),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  aiProviderId: z.string().uuid().optional().nullable(),
});
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  language: ProjectLanguageSchema,
  framework: ProjectFrameworkSchema,
  status: ProjectStatusSchema,
  hostPort: z.number().nullable(),
  containerId: z.string().nullable(),
  workspacePath: z.string(),
  aiProviderId: z.string().nullable(),
  lastStartedAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export type Project = z.infer<typeof ProjectSchema>;

// ==========================================
// 4. File Operation Schemas
// ==========================================
export const FileTreeNodeSchema: z.ZodType<FileTreeNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(["file", "directory"]),
    size: z.number().optional(),
    children: z.array(FileTreeNodeSchema).optional(),
  })
);
export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileTreeNode[];
}

export const FileContentSchema = z.object({
  path: z.string(),
  content: z.string(),
  size: z.number(),
  updatedAt: z.union([z.string(), z.date()]),
});
export type FileContent = z.infer<typeof FileContentSchema>;

export const WriteFileRequestSchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string(),
});
export type WriteFileRequest = z.infer<typeof WriteFileRequestSchema>;

export const DeleteFileRequestSchema = z.object({
  path: z.string().min(1, "File path is required"),
});
export type DeleteFileRequest = z.infer<typeof DeleteFileRequestSchema>;

// ==========================================
// 5. Container Status Schemas
// ==========================================
export const ContainerStatusInfoSchema = z.object({
  status: ProjectStatusSchema,
  containerId: z.string().nullable(),
  hostPort: z.number().nullable(),
  uptimeSeconds: z.number().optional(),
});
export type ContainerStatusInfo = z.infer<typeof ContainerStatusInfoSchema>;

// ==========================================
// 6. AI Chat Schemas
// ==========================================
export const ToolCallExecutionSchema = z.object({
  toolCallId: z.string(),
  toolName: z.enum(["writeFile", "deleteFile", "readFile", "runCommand"]),
  args: z.record(z.unknown()),
  result: z.unknown().optional(),
});
export type ToolCallExecution = z.infer<typeof ToolCallExecutionSchema>;

export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1, "Message cannot be empty"),
  providerId: z.string().uuid().optional(),
  model: z.string().optional(),
  mode: ChatModeSchema.default("edit"),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: ChatRoleSchema,
  content: z.string(),
  toolCalls: z.array(ToolCallExecutionSchema).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ==========================================
// 7. OpenAPI & Extracted Endpoints
// ==========================================
export const ExtractedEndpointSchema = z.object({
  method: HttpMethodSchema,
  path: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(z.unknown()).optional(),
  requestBody: z.unknown().optional(),
  responses: z.record(z.unknown()).optional(),
});
export type ExtractedEndpoint = z.infer<typeof ExtractedEndpointSchema>;

export const OpenApiSpecSchema = z.record(z.unknown());
export type OpenApiSpec = Record<string, unknown>;

// ==========================================
// 8. Tester & Requests
// ==========================================
export const TestRequestPayloadSchema = z.object({
  method: HttpMethodSchema,
  path: z.string().min(1, "Request path is required"),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  environmentId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
});
export type TestRequestPayload = z.infer<typeof TestRequestPayloadSchema>;

export const TestResponsePayloadSchema = z.object({
  status: z.number(),
  statusText: z.string().optional(),
  headers: z.record(z.string()),
  body: z.unknown(),
  durationMs: z.number(),
  sizeBytes: z.number().optional(),
});
export type TestResponsePayload = z.infer<typeof TestResponsePayloadSchema>;

export const TestHistoryItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  requestId: z.string().nullable().optional(),
  method: z.string(),
  path: z.string(),
  statusCode: z.number(),
  durationMs: z.number(),
  responseSnippet: z.unknown(),
  ranAt: z.union([z.string(), z.date()]),
});
export type TestHistoryItem = z.infer<typeof TestHistoryItemSchema>;

// ==========================================
// 9. Collections & Saved Requests
// ==========================================
export const CreateCollectionRequestSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
});
export type CreateCollectionRequest = z.infer<typeof CreateCollectionRequestSchema>;

export const UpdateCollectionRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  orderIndex: z.number().int().optional(),
});
export type UpdateCollectionRequest = z.infer<typeof UpdateCollectionRequestSchema>;

export const CreateApiRequestRequestSchema = z.object({
  name: z.string().min(1).max(100),
  method: z.string().min(1),
  path: z.string().min(1),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  authConfig: z.record(z.unknown()).optional(),
});
export type CreateApiRequestRequest = z.infer<typeof CreateApiRequestRequestSchema>;

export const UpdateApiRequestRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  method: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  authConfig: z.record(z.unknown()).optional(),
});
export type UpdateApiRequestRequest = z.infer<typeof UpdateApiRequestRequestSchema>;

export const APIRequestSchema = z.object({
  id: z.string(),
  collectionId: z.string().nullable(),
  projectId: z.string(),
  name: z.string(),
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string()),
  body: z.unknown(),
  authConfig: z.record(z.unknown()),
  autoGenerated: z.boolean(),
  lastResponse: TestResponsePayloadSchema.optional().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export type APIRequest = z.infer<typeof APIRequestSchema>;

export const CollectionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  orderIndex: z.number(),
  createdAt: z.union([z.string(), z.date()]),
  requests: z.array(APIRequestSchema).optional(),
});
export type Collection = z.infer<typeof CollectionSchema>;

// ==========================================
// 10. Environments
// ==========================================
export const CreateEnvironmentRequestSchema = z.object({
  name: z.string().min(1).max(50),
  variables: z.record(z.string()).default({}),
  isActive: z.boolean().default(false),
});
export type CreateEnvironmentRequest = z.infer<typeof CreateEnvironmentRequestSchema>;

export const UpdateEnvironmentRequestSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  variables: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEnvironmentRequest = z.infer<typeof UpdateEnvironmentRequestSchema>;

export const EnvironmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  variables: z.record(z.string()),
  isActive: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

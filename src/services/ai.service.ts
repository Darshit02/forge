import { streamText, tool, type CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  aiProviders,
  chatMessages,
  chatSessions,
  projects,
} from "../db/schema.js";
import { decryptApiKey } from "./crypto.service.js";
import { fileStoreService } from "./fileStore.service.js";
import { wsHub } from "../ws/hub.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type { ChatMode, ToolCallExecution } from "../types/index.js";

export interface StreamChatOptions {
  projectId: string;
  userId: string;
  message: string;
  sessionId?: string;
  providerId?: string;
  model?: string;
  mode?: ChatMode;
  onChunk?: (token: string) => void;
  onToolCall?: (toolCall: ToolCallExecution) => void;
}

/**
 * Normalizes user-specified model names and aliases, preventing 404s and handling cross-provider overrides.
 */
export function normalizeModelName(
  provider: string,
  rawModel?: string,
  fallbackDefault?: string
): string {
  const defaultByProvider: Record<string, string> = {
    google: "gemini-2.5-pro",
    openai: "gpt-4o",
    anthropic: "claude-3-7-sonnet-20250219",
    custom: "deepseek-chat",
  };

  const fallback = fallbackDefault || defaultByProvider[provider] || "gpt-4o";

  if (!rawModel || !rawModel.trim()) {
    return fallback;
  }

  const m = rawModel.trim();

  if (provider === "google") {
    // If user passed a model from another provider (e.g. gpt-4o, claude-3-5)
    if (
      m.startsWith("gpt-") ||
      m.startsWith("o1") ||
      m.startsWith("o3") ||
      m.startsWith("o4") ||
      m.startsWith("claude-")
    ) {
      return fallback.startsWith("gemini-") ? fallback : "gemini-2.5-pro";
    }

    const googleAliases: Record<string, string> = {
      "gemini-2.5-pro-latest": "gemini-2.5-pro",
      "gemini-2.5-flash-latest": "gemini-2.5-flash",
      "gemini-2.0-flash-latest": "gemini-2.0-flash",
      "gemini-2.0-pro-latest": "gemini-2.0-pro-exp-02-05",
      "gemini-1.5-pro-latest": "gemini-1.5-pro",
      "gemini-1.5-flash-latest": "gemini-1.5-flash",
      "gemini-2.5": "gemini-2.5-pro",
      "gemini-2.0": "gemini-2.0-flash",
      "gemini-1.5": "gemini-1.5-pro",
      "gemini-pro": "gemini-2.5-pro",
      "gemini-flash": "gemini-2.5-flash",
    };
    return googleAliases[m] || m;
  }

  if (provider === "anthropic") {
    if (
      m.startsWith("gpt-") ||
      m.startsWith("gemini-") ||
      m.startsWith("o1") ||
      m.startsWith("o3") ||
      m.startsWith("o4")
    ) {
      return fallback.startsWith("claude-")
        ? fallback
        : "claude-3-7-sonnet-20250219";
    }

    const anthropicAliases: Record<string, string> = {
      "claude-3-7-sonnet": "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku": "claude-3-5-haiku-20241022",
      "claude-3-opus": "claude-3-opus-20240229",
      "claude-sonnet": "claude-3-7-sonnet-20250219",
      "claude-haiku": "claude-3-5-haiku-20241022",
      "claude-3.7-sonnet": "claude-3-7-sonnet-20250219",
      "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
    };
    return anthropicAliases[m] || m;
  }

  if (provider === "openai") {
    if (m.startsWith("gemini-") || m.startsWith("claude-")) {
      return fallback.startsWith("gpt-") || fallback.startsWith("o")
        ? fallback
        : "gpt-4o";
    }

    const openaiAliases: Record<string, string> = {
      "gpt-4o-latest": "chatgpt-4o-latest",
      "o3": "o3-mini",
      "o1": "o1-mini",
      "gpt4o": "gpt-4o",
      "gpt-4": "gpt-4o",
    };
    return openaiAliases[m] || m;
  }

  return m;
}

export class AiService {
  /**
   * Resolves the AI model instance for the user/project based on BYOK configuration
   */
  async resolveModel(
    userId: string,
    projectId: string,
    providerIdOverride?: string,
    modelOverride?: string
  ) {
    let providerRecord = null;

    if (providerIdOverride) {
      [providerRecord] = await db
        .select()
        .from(aiProviders)
        .where(
          and(
            eq(aiProviders.id, providerIdOverride),
            eq(aiProviders.userId, userId)
          )
        )
        .limit(1);
    }

    if (!providerRecord) {
      // Check project's associated provider
      const [project] = await db
        .select({ aiProviderId: projects.aiProviderId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (project?.aiProviderId) {
        [providerRecord] = await db
          .select()
          .from(aiProviders)
          .where(
            and(
              eq(aiProviders.id, project.aiProviderId),
              eq(aiProviders.userId, userId)
            )
          )
          .limit(1);
      }
    }

    if (!providerRecord) {
      // Check user's default provider
      [providerRecord] = await db
        .select()
        .from(aiProviders)
        .where(
          and(
            eq(aiProviders.userId, userId),
            eq(aiProviders.isDefault, true)
          )
        )
        .limit(1);
    }

    if (!providerRecord) {
      // Fallback to any provider user has added
      [providerRecord] = await db
        .select()
        .from(aiProviders)
        .where(eq(aiProviders.userId, userId))
        .orderBy(desc(aiProviders.createdAt))
        .limit(1);
    }

    if (!providerRecord) {
      throw new BadRequestError(
        "No AI provider configured. Please add an API key under AI Providers (BYOK) first."
      );
    }

    // Decrypt key strictly in memory
    const apiKey = decryptApiKey(providerRecord.encryptedKey);
    const targetModel = normalizeModelName(
      providerRecord.provider,
      modelOverride,
      providerRecord.modelDefault
    );

    switch (providerRecord.provider) {
      case "openai": {
        const openai = createOpenAI({
          apiKey,
          baseURL: providerRecord.baseUrl || undefined,
        });
        return {
          model: openai(targetModel),
          providerName: "openai",
          modelName: targetModel,
        };
      }

      case "anthropic": {
        const anthropic = createAnthropic({
          apiKey,
          baseURL: providerRecord.baseUrl || undefined,
        });
        return {
          model: anthropic(targetModel),
          providerName: "anthropic",
          modelName: targetModel,
        };
      }

      case "google": {
        const google = createGoogleGenerativeAI({
          apiKey,
          baseURL: providerRecord.baseUrl || undefined,
        });
        return {
          model: google(targetModel),
          providerName: "google",
          modelName: targetModel,
        };
      }

      case "custom": {
        const customOpenAi = createOpenAI({
          apiKey,
          baseURL: providerRecord.baseUrl || "http://localhost:11434/v1",
        });
        return {
          model: customOpenAi(targetModel),
          providerName: "custom",
          modelName: targetModel,
        };
      }

      default:
        throw new BadRequestError(
          `Unsupported provider type: ${providerRecord.provider}`
        );
    }
  }

  /**
   * Constructs the rich system prompt with workspace tree, file contents, framework, and rules
   */
  async buildSystemPrompt(projectId: string): Promise<string> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    // 1. Fetch file tree
    const tree = await fileStoreService.listTree(projectId);
    const treeString = JSON.stringify(tree, null, 2);

    // 2. Fetch all workspace files content (up to max context budget)
    const files = await fileStoreService.getAllWorkspaceFiles(projectId);
    let filesContext = "";
    for (const f of files) {
      filesContext += `\n--- File: ${f.path} ---\n${f.content}\n`;
    }

    return `You are Forge AI, an elite AI backend engineer pair-programming inside the Forge IDE.
You are directly modifying backend code running inside an isolated sandbox container.

PROJECT CONTEXT:
- Name: ${project.name}
- Language: ${project.language}
- Framework: ${project.framework}
- Status: ${project.status}

WORKSPACE FILE TREE:
\`\`\`json
${treeString}
\`\`\`

CURRENT WORKSPACE FILES:
${filesContext || "(Workspace is currently empty)"}

CORE INSTRUCTIONS & CONSTRAINTS:
1. You are actively editing files in this project workspace.
2. When you write or update code, ALWAYS return structured tool calls (e.g. writeFile, deleteFile).
3. NEVER fabricate file contents in conversational prose or ask the user to copy-paste.
4. When you call writeFile, the host filesystem immediately receives the changes, hot-reloading triggers in the running container, the OpenAPI specification automatically syncs, and the API tester updates in real-time. This is the magic loop — preserve it!
5. Follow best idiomatic practices for ${project.framework} and ${project.language}.
6. Keep endpoints well-documented with OpenAPI / Swagger annotations and type validations.
7. If the user asks for a feature, implement complete, runnable code. Do not leave placeholder comments or stubs.`;
  }

  /**
   * Main streaming chat method
   */
  async streamChat(options: StreamChatOptions) {
    const { projectId, userId, message, mode = "edit" } = options;

    // 1. Resolve or create chat session
    let sessionId = options.sessionId;
    if (!sessionId) {
      const title =
        message.length > 50 ? `${message.slice(0, 47)}...` : message;
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          projectId,
          title,
        })
        .returning();
      sessionId = newSession.id;
    }

    // 2. Persist user message in chat_messages
    await db.insert(chatMessages).values({
      sessionId,
      role: "user",
      content: message,
    });

    // 3. Load historical messages for context
    const historyRows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    const coreMessages: CoreMessage[] = historyRows.map((row) => ({
      role: row.role as "user" | "assistant" | "system",
      content: row.content,
    }));

    // 4. Resolve BYOK Model & System Prompt
    const { model, modelName, providerName } = await this.resolveModel(
      userId,
      projectId,
      options.providerId,
      options.model
    );

    const systemPrompt = await this.buildSystemPrompt(projectId);

    // 5. Build Tools
    const tools = {
      writeFile: tool({
        description:
          "Write, create, or update the content of a file at the specified workspace path.",
        parameters: z.object({
          path: z
            .string()
            .describe("Relative file path inside the workspace (e.g. 'main.py' or 'src/routes/users.ts')"),
          content: z.string().describe("The complete file contents to write"),
        }),
        execute: async ({ path: filePath, content }) => {
          logger.info({ projectId, filePath }, "AI tool executing: writeFile");
          const result = await fileStoreService.writeFile(
            projectId,
            filePath,
            content
          );
          return {
            success: true,
            path: result.path,
            bytesWritten: result.size,
          };
        },
      }),

      readFile: tool({
        description: "Read the current contents of a file in the workspace.",
        parameters: z.object({
          path: z.string().describe("Relative file path inside workspace"),
        }),
        execute: async ({ path: filePath }) => {
          logger.info({ projectId, filePath }, "AI tool executing: readFile");
          try {
            const result = await fileStoreService.readFile(projectId, filePath);
            return {
              success: true,
              path: result.path,
              content: result.content,
            };
          } catch (err: any) {
            return {
              success: false,
              path: filePath,
              error: err.message,
            };
          }
        },
      }),

      deleteFile: tool({
        description: "Delete a file or directory from the workspace.",
        parameters: z.object({
          path: z.string().describe("Relative file or folder path to delete"),
        }),
        execute: async ({ path: filePath }) => {
          logger.info({ projectId, filePath }, "AI tool executing: deleteFile");
          try {
            await fileStoreService.deleteFile(projectId, filePath);
            return {
              success: true,
              path: filePath,
            };
          } catch (err: any) {
            return {
              success: false,
              path: filePath,
              error: err.message,
            };
          }
        },
      }),

      runCommand: tool({
        description:
          "Run a safe build or package management command inside the container environment.",
        parameters: z.object({
          cmd: z.string().describe("Command to run, e.g. 'pip install requests' or 'npm install axios'"),
        }),
        execute: async ({ cmd }) => {
          logger.info({ projectId, cmd }, "AI tool executing: runCommand");
          // Restricted allowlist check
          const allowedPrefixes = [
            "npm install",
            "npm i ",
            "pip install",
            "pip list",
            "bun add",
            "python -m pip install",
            "pytest",
            "go get",
            "cargo add",
          ];

          const isAllowed = allowedPrefixes.some((p) =>
            cmd.trim().startsWith(p)
          );

          if (!isAllowed) {
            return {
              success: false,
              cmd,
              error:
                "Command rejected: Only package installation and test runners from the safe allowlist are permitted.",
            };
          }

          return {
            success: true,
            cmd,
            message: `Command '${cmd}' scheduled for execution in container sandbox.`,
          };
        },
      }),
    };

    // 6. Execute streamText with Vercel AI SDK
    const result = streamText({
      model,
      system: systemPrompt,
      messages: coreMessages,
      tools: mode === "chat" ? undefined : tools,
      maxSteps: mode === "agent" ? 5 : 2,
    });

    const executedTools: ToolCallExecution[] = [];

    // Tee the text stream so both the SSE route consumer and the background persistence promise
    // can read concurrently without stream locking conflicts.
    const [routeStream, internalStream] = result.textStream.tee();

    // Background consumer for streaming tokens & persisting message
    const streamPromise = (async () => {
      try {
        let accumulatedText = "";

        for await (const delta of internalStream) {
          accumulatedText += delta;
          // Broadcast token via WebSocket
          wsHub.broadcastAiToken(projectId, delta);
          if (options.onChunk) {
            options.onChunk(delta);
          }
        }

        // Check tool calls
        let toolCalls: any[] = [];
        try {
          toolCalls = (await result.toolCalls) || [];
        } catch (tcErr: any) {
          logger.warn({ tcErr: tcErr.message }, "Error reading tool calls");
        }

        if (toolCalls && toolCalls.length > 0) {
          for (const tc of toolCalls) {
            executedTools.push({
              toolCallId: tc.toolCallId,
              toolName: tc.toolName as any,
              args: tc.args as Record<string, unknown>,
            });
          }
        }

        // Persist assistant message in DB
        const [savedMessage] = await db
          .insert(chatMessages)
          .values({
            sessionId,
            role: "assistant",
            content: accumulatedText,
            toolCalls: executedTools.length > 0 ? executedTools : null,
          })
          .returning();

        // Broadcast ai.done via WebSocket
        wsHub.broadcastAiDone(projectId, savedMessage.id);

        return {
          messageId: savedMessage.id,
          sessionId,
          content: accumulatedText,
          toolCalls: executedTools,
        };
      } catch (err: any) {
        logger.error(
          { err: err.message, stack: err.stack, projectId, sessionId },
          "Error in streamChat streamPromise"
        );
        throw err;
      }
    })();

    return {
      sessionId,
      textStream: routeStream,
      fullStream: result.fullStream,
      toDataStreamResponse: () => result.toDataStreamResponse(),
      finishPromise: streamPromise,
    };
  }

  /**
   * Pings an AI provider with a tiny request to verify API key validity and latency
   */
  async testProvider(
    providerType: string,
    apiKey: string,
    baseUrl?: string | null,
    modelName?: string | null
  ): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    try {
      const targetModel = normalizeModelName(providerType, modelName || undefined);
      let model;
      if (providerType === "openai") {
        const client = createOpenAI({ apiKey, baseURL: baseUrl || undefined });
        model = client(targetModel);
      } else if (providerType === "anthropic") {
        const client = createAnthropic({ apiKey, baseURL: baseUrl || undefined });
        model = client(targetModel);
      } else if (providerType === "google") {
        const client = createGoogleGenerativeAI({
          apiKey,
          baseURL: baseUrl || undefined,
        });
        model = client(targetModel);
      } else {
        const client = createOpenAI({
          apiKey,
          baseURL: baseUrl || "http://localhost:11434/v1",
        });
        model = client(targetModel);
      }

      const testResult = await streamText({
        model,
        prompt: "ping",
        maxTokens: 5,
      });

      // Read at least one chunk to verify connection
      for await (const _ of testResult.textStream) {
        break;
      }

      const latencyMs = Date.now() - startTime;
      return { ok: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      logger.warn(
        { providerType, err: err.message },
        "AI provider test ping failed"
      );
      return {
        ok: false,
        latencyMs,
        error: err.message || "Failed to connect to AI provider",
      };
    }
  }
}

export const aiService = new AiService();

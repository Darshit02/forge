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
import { executionService } from "./execution/index.js";
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
    google: "gemini-2.0-flash",
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
      return fallback.startsWith("gemini-") ? fallback : "gemini-2.0-flash";
    }

    const googleAliases: Record<string, string> = {
      "gemini-2.5-pro": "gemini-2.0-flash",
      "gemini-2.5-flash": "gemini-2.0-flash",
      "gemini-2.5-pro-latest": "gemini-2.0-flash",
      "gemini-2.5-flash-latest": "gemini-2.0-flash",
      "gemini-2.0-flash-latest": "gemini-2.0-flash",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
      "gemini-2.0-pro-exp-02-05": "gemini-2.0-pro-exp-02-05",
      "gemini-2.0-pro-latest": "gemini-2.0-pro-exp-02-05",
      "gemini-1.5-pro-latest": "gemini-1.5-pro",
      "gemini-1.5-pro": "gemini-1.5-pro",
      "gemini-1.5-flash-latest": "gemini-1.5-flash",
      "gemini-1.5-flash": "gemini-1.5-flash",
      "gemini-2.5": "gemini-2.0-flash",
      "gemini-2.0": "gemini-2.0-flash",
      "gemini-1.5": "gemini-1.5-pro",
      "gemini-pro": "gemini-2.0-flash",
      "gemini-flash": "gemini-2.0-flash",
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

          try {
            const res = await executionService.executeCommand(projectId, cmd);
            return {
              success: res.exitCode === 0,
              cmd,
              exitCode: res.exitCode,
              stdout: res.stdout,
              stderr: res.stderr,
              message:
                res.exitCode === 0
                  ? `Executed '${cmd}' successfully.`
                  : `Command failed with exit code ${res.exitCode}: ${res.stderr || res.stdout}`,
            };
          } catch (err: any) {
            return {
              success: false,
              cmd,
              error: `Execution error: ${err.message}`,
            };
          }
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
    let accumulatedText = "";

    type StreamEvent =
      | { type: "token"; delta: string }
      | { type: "tool-call"; toolCallId: string; toolName: string; args: any }
      | { type: "tool-result"; toolCallId: string; toolName: string; result: any };

    const queue: StreamEvent[] = [];
    let notifyResolver: (() => void) | null = null;
    let isStreamDone = false;
    let streamError: Error | null = null;

    // Background consumer for streaming tokens & persisting message
    const streamPromise = (async () => {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            accumulatedText += part.textDelta;
            wsHub.broadcastAiToken(projectId, part.textDelta);
            if (options.onChunk) {
              options.onChunk(part.textDelta);
            }
            queue.push({ type: "token", delta: part.textDelta });
          } else if (part.type === "tool-call") {
            const tc: ToolCallExecution = {
              toolCallId: part.toolCallId,
              toolName: part.toolName as any,
              args: part.args as Record<string, unknown>,
            };
            executedTools.push(tc);
            if (options.onToolCall) {
              options.onToolCall(tc);
            }
            queue.push({
              type: "tool-call",
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args: part.args,
            });
          } else if (part.type === "tool-result") {
            queue.push({
              type: "tool-result",
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              result: part.result,
            });
          }
          if (notifyResolver) {
            notifyResolver();
            notifyResolver = null;
          }
        }
      } catch (err: any) {
        streamError = err;
        logger.error({ err: err.message, stack: err.stack, projectId, sessionId }, "Error in streamChat fullStream loop");
      } finally {
        isStreamDone = true;
        if (notifyResolver) {
          notifyResolver();
          notifyResolver = null;
        }
      }

      if (streamError) {
        throw streamError;
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
    })();

    async function* eventStream(): AsyncGenerator<StreamEvent> {
      while (!isStreamDone || queue.length > 0) {
        while (queue.length > 0) {
          yield queue.shift()!;
        }
        if (isStreamDone) break;
        await new Promise<void>((resolve) => {
          notifyResolver = resolve;
        });
      }
      if (streamError) {
        throw streamError;
      }
    }

    const [routeTextStream] = result.textStream.tee();

    return {
      sessionId,
      eventStream: eventStream(),
      textStream: routeTextStream,
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

      const testResult = streamText({
        model,
        prompt: "Say hello",
        maxTokens: 5,
      });

      // Read at least one chunk to verify connection
      for await (const chunk of testResult.textStream) {
        if (chunk) break;
      }

      const latencyMs = Date.now() - startTime;
      return { ok: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const targetModel = normalizeModelName(providerType, modelName || undefined);
      logger.warn(
        { providerType, targetModel, err: err.message },
        "AI provider test ping failed"
      );

      let errorMsg = err.message || "Failed to connect to AI provider";
      if (err.statusCode === 401 || err.status === 401 || errorMsg.includes("API key not valid")) {
        errorMsg = "Invalid API key (401 Unauthorized). Please check your key.";
      } else if (err.statusCode === 404 || err.status === 404 || errorMsg.includes("not found")) {
        errorMsg = `Model '${targetModel}' not found (404). Please verify model name.`;
      } else if (err.statusCode === 429 || err.status === 429 || errorMsg.includes("quota")) {
        errorMsg = "API quota exceeded or rate limited (429). Check provider billing.";
      }

      return {
        ok: false,
        latencyMs,
        error: errorMsg,
      };
    }
  }
}

export const aiService = new AiService();

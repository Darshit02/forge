import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { streamSSE } from "hono/streaming";
import { eq, desc, asc } from "drizzle-orm";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { chatRateLimiter } from "../middleware/rateLimit.js";
import { aiService } from "../services/ai.service.js";
import { db } from "../db/client.js";
import { chatMessages, chatSessions } from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";

export const aiRoutes = new Hono();

aiRoutes.use("*", requireAuth);

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1, "Message cannot be empty"),
  providerId: z.string().uuid().optional(),
  model: z.string().optional(),
  mode: z.enum(["chat", "edit", "agent"]).default("edit"),
});

/**
 * POST /api/projects/:id/chat - SSE stream for AI code generation & chat
 */
aiRoutes.post(
  "/:id/chat",
  requireProjectOwner,
  chatRateLimiter,
  zValidator("json", chatRequestSchema),
  async (c) => {
    const projectId = c.req.param("id");
    const user = c.get("user");
    const body = c.req.valid("json");

    return streamSSE(c, async (stream) => {
      try {
        const chatResponse = await aiService.streamChat({
          projectId,
          userId: user.id,
          message: body.message,
          sessionId: body.sessionId,
          providerId: body.providerId,
          model: body.model,
          mode: body.mode,
        });

        // 1. Emit session metadata
        await stream.writeSSE({
          event: "session",
          data: JSON.stringify({ sessionId: chatResponse.sessionId }),
        });

        // 2. Stream tokens
        for await (const delta of chatResponse.textStream) {
          await stream.writeSSE({
            event: "token",
            data: JSON.stringify({ delta }),
          });
        }

        // 3. Await completion and emit done event
        const finished = await chatResponse.finishPromise;
        await stream.writeSSE({
          event: "done",
          data: JSON.stringify({
            messageId: finished.messageId,
            sessionId: finished.sessionId,
            toolCalls: finished.toolCalls,
          }),
        });
      } catch (err: any) {
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ error: err.message || "AI stream failed" }),
        });
      }
    });
  }
);

/**
 * GET /api/projects/:id/chat/sessions - List chat sessions for a project
 */
aiRoutes.get("/:id/chat/sessions", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id");

  const sessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.projectId, projectId))
    .orderBy(desc(chatSessions.createdAt));

  return c.json({ sessions });
});

/**
 * GET /api/projects/:id/chat/sessions/:sessionId/messages - List messages in a session
 */
aiRoutes.get(
  "/:id/chat/sessions/:sessionId/messages",
  requireProjectOwner,
  async (c) => {
    const sessionId = c.req.param("sessionId");

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundError("Chat session not found");
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    return c.json({ session, messages });
  }
);

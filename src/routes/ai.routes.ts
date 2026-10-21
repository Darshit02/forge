import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { streamSSE } from "hono/streaming";
import { eq, desc, asc, and } from "drizzle-orm";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { chatRateLimiter } from "../middleware/rateLimit.js";
import { aiService } from "../services/ai.service.js";
import { db } from "../db/client.js";
import { chatMessages, chatSessions } from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const aiRoutes = new Hono();

import { ChatRequestSchema } from "@forge/shared";

aiRoutes.use("*", requireAuth);

/**
 * POST /api/projects/:id/chat - SSE stream for AI code generation & chat
 */
aiRoutes.post(
  "/:id/chat",
  requireProjectOwner,
  chatRateLimiter,
  zValidator("json", ChatRequestSchema),
  async (c) => {
    const projectId = c.req.param("id")!;
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

        // 2. Stream tokens and live tool calls/results
        for await (const part of chatResponse.eventStream) {
          if (part.type === "token") {
            await stream.writeSSE({
              event: "token",
              data: JSON.stringify({ delta: part.delta }),
            });
          } else if (part.type === "tool-call") {
            await stream.writeSSE({
              event: "tool-call",
              data: JSON.stringify({
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                args: part.args,
              }),
            });
          } else if (part.type === "tool-result") {
            await stream.writeSSE({
              event: "tool-result",
              data: JSON.stringify({
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                result: part.result,
              }),
            });
          }
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
        let errorMsg = err.message || "AI stream failed";
        if (err.data?.error?.message) {
          errorMsg = err.data.error.message;
        } else if (err.cause?.message) {
          errorMsg = `${errorMsg} (${err.cause.message})`;
        }
        logger.error({ err: errorMsg, stack: err.stack, projectId }, "AI stream route error");
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ error: errorMsg }),
        });
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
  }
);

/**
 * GET /api/projects/:id/chat/sessions - List chat sessions for a project
 */
aiRoutes.get("/:id/chat/sessions", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;

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
    const sessionId = c.req.param("sessionId")!;

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

/**
 * DELETE /api/projects/:id/chat/sessions/:sessionId - Delete a chat session and cascade its messages
 */
aiRoutes.delete(
  "/:id/chat/sessions/:sessionId",
  requireProjectOwner,
  async (c) => {
    const projectId = c.req.param("id")!;
    const sessionId = c.req.param("sessionId")!;

    const [deleted] = await db
      .delete(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.projectId, projectId)
        )
      )
      .returning({ id: chatSessions.id });

    if (!deleted) {
      throw new NotFoundError("Chat session not found");
    }

    return c.json({ ok: true, sessionId: deleted.id });
  }
);

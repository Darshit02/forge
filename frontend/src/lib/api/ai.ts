import { apiClient } from "./client.js";
import { env } from "../env.js";
import type { ChatMessage, ChatSession, ToolCallExecution } from "../../types/api.js";

export const aiApi = {
  sessions: (projectId: string) =>
    apiClient<{ sessions: ChatSession[] }>(
      `/api/projects/${projectId}/chat/sessions`
    ),

  messages: (projectId: string, sessionId: string) =>
    apiClient<{ session: ChatSession; messages: ChatMessage[] }>(
      `/api/projects/${projectId}/chat/sessions/${sessionId}/messages`
    ),

  /**
   * SSE Stream for AI Chat with AbortController signal
   */
  async stream(
    projectId: string,
    data: {
      message: string;
      sessionId?: string;
      providerId?: string;
      model?: string;
      mode?: "chat" | "edit" | "agent";
    },
    callbacks: {
      onSession?: (sessionId: string) => void;
      onToken?: (delta: string) => void;
      onToolCall?: (toolCall: { toolCallId: string; toolName: string; args: any }) => void;
      onToolResult?: (result: { toolCallId: string; toolName: string; result: any }) => void;
      onDone?: (info: { messageId: string; sessionId?: string; toolCalls?: ToolCallExecution[] }) => void;
      onError?: (error: string) => void;
    },
    signal?: AbortSignal
  ) {
    const token = localStorage.getItem("forge_access_token");
    const url = `${env.VITE_API_URL}/api/projects/${projectId}/chat`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal,
        credentials: "include",
      });

      if (!response.ok) {
        let errorMsg = `Chat stream failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error || errJson?.message) {
            errorMsg = errJson.error || errJson.message;
          }
        } catch {
          // non-JSON response body
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("No readable response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const normalized = buffer.replace(/\r\n/g, "\n");
        const parts = normalized.split("\n\n");
        buffer = parts.pop() || "";

        for (const block of parts) {
          if (!block.trim()) continue;

          let event = "message";
          let dataStr = "";

          const lines = block.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr += (dataStr ? "\n" : "") + line.slice(5).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (event === "session" && callbacks.onSession) {
              callbacks.onSession(parsed.sessionId);
            } else if (event === "token" && callbacks.onToken) {
              callbacks.onToken(parsed.delta);
            } else if (event === "tool-call" && callbacks.onToolCall) {
              callbacks.onToolCall(parsed);
            } else if (event === "tool-result" && callbacks.onToolResult) {
              callbacks.onToolResult(parsed);
            } else if (event === "done" && callbacks.onDone) {
              callbacks.onDone(parsed);
            } else if (event === "error" && callbacks.onError) {
              callbacks.onError(parsed.error);
            }
          } catch {
            // non-JSON data
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // User cancelled
      }
      const message = err.message || "Failed to stream AI response";
      callbacks.onError?.(message);
    }
  },
};

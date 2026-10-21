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

  deleteSession: (projectId: string, sessionId: string) =>
    apiClient<{ ok: boolean; sessionId: string }>(
      `/api/projects/${projectId}/chat/sessions/${sessionId}`,
      { method: "DELETE" }
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
    let hasEmittedError = false;
    const emitError = (msg: string) => {
      if (!hasEmittedError) {
        hasEmittedError = true;
        callbacks.onError?.(msg);
      }
    };

    let token = localStorage.getItem("forge_access_token");
    const url = `${env.VITE_API_URL}/api/projects/${projectId}/chat`;

    try {
      let response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal,
        credentials: "include",
      });

      // Handle 401 Unauthorized with automatic token refresh
      if (response.status === 401) {
        try {
          const refreshRes = await fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            token = refreshData.accessToken;
            if (token) {
              localStorage.setItem("forge_access_token", token);
              // Retry stream request with refreshed access token
              response = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
                signal,
                credentials: "include",
              });
            }
          }
        } catch {
          // Token refresh failed, continue to standard error handling
        }
      }

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
              return;
            } else if (event === "error") {
              emitError(parsed.error || "AI provider request failed");
              return;
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

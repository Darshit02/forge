import { useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { aiApi } from "../lib/api/ai.js";
import { useChatStore } from "../stores/chat.store.js";
import { analytics } from "../lib/analytics.js";
import { toast } from "sonner";

export function useChatStream(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    activeSessionId,
    isStreaming,
    selectedModel,
    selectedProviderId,
    chatMode,
    lastFailedPrompt,
    appendUserMessage,
    startAssistantStream,
    appendToken,
    addLiveToolCall,
    updateLiveToolResult,
    finishStream,
    cancelStream,
    setError,
    clearLastFailedPrompt,
    setActiveSessionId,
  } = useChatStore();

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!projectId || !messageText.trim() || isStreaming) return;

      abortControllerRef.current = new AbortController();

      // 1. Optimistic user bubble
      appendUserMessage(messageText);

      // 2. Start streaming state
      startAssistantStream(messageText);

      analytics.aiMessageSent({ mode: chatMode, model: selectedModel });

      try {
        await aiApi.stream(
          projectId,
          {
            message: messageText,
            sessionId: activeSessionId || undefined,
            providerId: selectedProviderId || undefined,
            model: selectedModel,
            mode: chatMode,
          },
          {
            onSession: (sessionId) => {
              setActiveSessionId(sessionId);
            },
            onToken: (token) => {
              appendToken(token);
            },
            onToolCall: (tc) => {
              addLiveToolCall({
                toolCallId: tc.toolCallId,
                toolName: tc.toolName as any,
                args: tc.args,
              });
            },
            onToolResult: (res) => {
              updateLiveToolResult(res.toolCallId, res.result);
            },
            onDone: (info) => {
              finishStream({
                messageId: info.messageId,
                toolCalls: info.toolCalls,
              });

              if (info.toolCalls && info.toolCalls.length > 0) {
                const files = info.toolCalls
                  .filter((tc) => tc.toolName === "writeFile")
                  .map((tc) => (tc.args as any)?.path)
                  .filter(Boolean);

                if (files.length > 0) {
                  analytics.aiCodeGenerated(files);
                  toast.success(`AI updated ${files.length} file(s)`, {
                    description: files.slice(0, 3).join(", ") + (files.length > 3 ? "..." : ""),
                  });
                }
              }

              queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] });
              queryClient.invalidateQueries({ queryKey: ["files", projectId] });
            },
            onError: (errMsg) => {
              setError(errMsg || "Chat request failed");
              toast.error(errMsg || "Chat request failed", {
                duration: 6000,
              });
            },
          },
          abortControllerRef.current.signal
        );
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const errMsg = err.message || "Failed to communicate with AI service";
          setError(errMsg);
          toast.error(errMsg, { duration: 6000 });
        }
      }
    },
    [
      projectId,
      isStreaming,
      activeSessionId,
      selectedProviderId,
      selectedModel,
      chatMode,
      appendUserMessage,
      startAssistantStream,
      appendToken,
      addLiveToolCall,
      updateLiveToolResult,
      finishStream,
      cancelStream,
      setError,
      setActiveSessionId,
      queryClient,
    ]
  );

  const retry = useCallback(() => {
    if (lastFailedPrompt && !isStreaming) {
      clearLastFailedPrompt();
      sendMessage(lastFailedPrompt);
    }
  }, [lastFailedPrompt, isStreaming, clearLastFailedPrompt, sendMessage]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelStream();
  }, [cancelStream]);

  return {
    sendMessage,
    retry,
    cancel,
    isStreaming,
    hasFailedPrompt: Boolean(lastFailedPrompt),
  };
}

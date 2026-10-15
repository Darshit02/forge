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
    appendUserMessage,
    startAssistantStream,
    appendToken,
    finishStream,
    cancelStream,
    setActiveSessionId,
  } = useChatStore();

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!projectId || !messageText.trim() || isStreaming) return;

      abortControllerRef.current = new AbortController();

      // 1. Optimistic user bubble
      appendUserMessage(messageText);

      // 2. Start streaming state
      startAssistantStream();

      analytics.aiMessageSent({ mode: chatMode, model: selectedModel });

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
          onDone: (info) => {
            finishStream({
              messageId: info.messageId,
              toolCalls: info.toolCalls,
            });

            if (info.toolCalls && info.toolCalls.length > 0) {
              const files = info.toolCalls
                .filter((tc) => tc.toolName === "writeFile")
                .map((tc) => (tc.args as any).path);

              if (files.length > 0) {
                analytics.aiCodeGenerated(files);
                toast.success(`AI updated ${files.length} file(s)`, {
                  description: files.join(", "),
                });
              }
            }

            queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] });
            queryClient.invalidateQueries({ queryKey: ["files", projectId] });
          },
          onError: (errMsg) => {
            cancelStream();
            toast.error(errMsg || "Chat request failed");
          },
        },
        abortControllerRef.current.signal
      );
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
      finishStream,
      cancelStream,
      setActiveSessionId,
      queryClient,
    ]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelStream();
  }, [cancelStream]);

  return {
    sendMessage,
    cancel,
    isStreaming,
  };
}

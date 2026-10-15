import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { projectSocket } from "./socket.js";
import { useUIStore } from "../../stores/ui.store.js";
import { useChatStore } from "../../stores/chat.store.js";
import { useTesterStore } from "../../stores/tester.store.js";
import { useEditorStore } from "../../stores/editor.store.js";
import { toast } from "sonner";
import type { WSServerMessage } from "../../types/api.js";

export function useProjectSocket(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const setContainerStatus = useUIStore((s) => s.setContainerStatus);
  const appendConsoleLog = useUIStore((s) => s.appendConsoleLog);
  const setReconnecting = useUIStore((s) => s.setReconnecting);

  const appendToken = useChatStore((s) => s.appendToken);
  const finishStream = useChatStore((s) => s.finishStream);

  const setActiveResponse = useTesterStore((s) => s.setActiveResponse);
  const addHistoryItem = useTesterStore((s) => s.addHistoryItem);

  const markDirty = useEditorStore((s) => s.markDirty);

  useEffect(() => {
    if (!projectId) return;

    // Connect to WebSocket
    projectSocket.connect(projectId);

    // Register reconnect handler to refresh status & spec
    const unsubReconnect = projectSocket.onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ["spec", projectId] });
      queryClient.invalidateQueries({ queryKey: ["container-status", projectId] });
    });

    const unsubConn = projectSocket.subscribe(
      "connection.state",
      ({ connected }: { connected: boolean }) => {
        setReconnecting(!connected);
      }
    );

    const unsubStatus = projectSocket.subscribe(
      "container.status",
      (msg: { status: any }) => {
        setContainerStatus(msg.status);
      }
    );

    const unsubLog = projectSocket.subscribe(
      "container.log",
      (msg: { line: string }) => {
        appendConsoleLog(msg.line);
      }
    );

    const unsubSpec = projectSocket.subscribe(
      "spec.updated",
      (_msg: { spec: any }) => {
        queryClient.invalidateQueries({ queryKey: ["spec", projectId] });
        queryClient.invalidateQueries({ queryKey: ["collections", projectId] });
        toast.info("OpenAPI specification synchronized", {
          description: "New endpoints detected and tester panel updated.",
        });
      }
    );

    const unsubFile = projectSocket.subscribe(
      "file.changed",
      (msg: { path: string; content?: string }) => {
        queryClient.invalidateQueries({ queryKey: ["files", projectId] });
        // If file is open, signal change
        const openFiles = useEditorStore.getState().openFiles;
        const matching = openFiles.find((f) => f.path === msg.path);
        if (matching && msg.content && matching.content !== msg.content) {
          // If user hasn't edited locally, auto-sync content
          if (!matching.dirty) {
            useEditorStore.getState().updateContent(msg.path, msg.content);
            useEditorStore.getState().markClean(msg.path);
          } else {
            markDirty(msg.path);
          }
        }
      }
    );

    const unsubAiToken = projectSocket.subscribe(
      "ai.token",
      (msg: { delta: string }) => {
        appendToken(msg.delta);
      }
    );

    const unsubAiDone = projectSocket.subscribe(
      "ai.done",
      (msg: { messageId: string }) => {
        finishStream({ messageId: msg.messageId });
        queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
        queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] });
      }
    );

    const unsubTest = projectSocket.subscribe(
      "test.result",
      (msg: { requestId?: string; response: any }) => {
        setActiveResponse(msg.response);
        queryClient.invalidateQueries({ queryKey: ["test-history", projectId] });
      }
    );

    return () => {
      unsubReconnect();
      unsubConn();
      unsubStatus();
      unsubLog();
      unsubSpec();
      unsubFile();
      unsubAiToken();
      unsubAiDone();
      unsubTest();
      projectSocket.disconnect();
    };
  }, [
    projectId,
    queryClient,
    setContainerStatus,
    appendConsoleLog,
    setReconnecting,
    appendToken,
    finishStream,
    setActiveResponse,
    addHistoryItem,
    markDirty,
  ]);
}

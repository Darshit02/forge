import { create } from "zustand";
import type { ChatMessage, ChatMode, ToolCallExecution } from "../types/api.js";

interface ChatState {
  activeSessionId: string | null;
  messages: ChatMessage[];
  streamingBuffer: string;
  isStreaming: boolean;
  selectedModel: string;
  selectedProviderId: string | null;
  chatMode: ChatMode;
  liveToolCalls: ToolCallExecution[];
  lastFailedPrompt: string | null;

  setActiveSessionId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendUserMessage: (content: string) => void;
  startAssistantStream: (prompt?: string) => void;
  appendToken: (token: string) => void;
  addLiveToolCall: (toolCall: ToolCallExecution) => void;
  updateLiveToolResult: (toolCallId: string, result: any) => void;
  finishStream: (info: {
    messageId?: string;
    content?: string;
    toolCalls?: ToolCallExecution[] | null;
  }) => void;
  cancelStream: () => void;
  setError: (error: string) => void;
  clearLastFailedPrompt: () => void;
  setSelectedModel: (model: string) => void;
  setSelectedProviderId: (id: string | null) => void;
  setChatMode: (mode: ChatMode) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeSessionId: null,
  messages: [],
  streamingBuffer: "",
  isStreaming: false,
  selectedModel: "gemini-3.5-flash",
  selectedProviderId: null,
  chatMode: "edit",
  liveToolCalls: [],
  lastFailedPrompt: null,

  setActiveSessionId: (id) => set({ activeSessionId: id }),

  setMessages: (messages) => set({ messages }),

  appendUserMessage: (content) => {
    const { messages } = get();
    const tempMessage: ChatMessage = {
      id: "temp-user-" + Date.now(),
      sessionId: get().activeSessionId || "",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    set({ messages: [...messages, tempMessage] });
  },

  startAssistantStream: (prompt?: string) => {
    set({
      isStreaming: true,
      streamingBuffer: "",
      liveToolCalls: [],
      lastFailedPrompt: prompt || null,
    });
  },

  appendToken: (delta) => {
    set((state) => ({
      streamingBuffer: state.streamingBuffer + delta,
    }));
  },

  addLiveToolCall: (toolCall) => {
    set((state) => ({
      liveToolCalls: [...state.liveToolCalls, toolCall],
    }));
  },

  updateLiveToolResult: (toolCallId, result) => {
    set((state) => ({
      liveToolCalls: state.liveToolCalls.map((tc) =>
        tc.toolCallId === toolCallId ? { ...tc, result } : tc
      ),
    }));
  },

  finishStream: ({ messageId, content, toolCalls }) => {
    const { messages, streamingBuffer, activeSessionId, liveToolCalls } = get();
    const finalContent = content ?? streamingBuffer;
    const finalTools =
      toolCalls && toolCalls.length > 0
        ? toolCalls
        : liveToolCalls.length > 0
        ? liveToolCalls
        : null;

    const newAssistantMessage: ChatMessage = {
      id: messageId || "msg-" + Date.now(),
      sessionId: activeSessionId || "",
      role: "assistant",
      content: finalContent,
      toolCalls: finalTools,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, newAssistantMessage],
      isStreaming: false,
      streamingBuffer: "",
      liveToolCalls: [],
      lastFailedPrompt: null,
    });
  },

  cancelStream: () => {
    set({ isStreaming: false, liveToolCalls: [] });
  },

  setError: (error: string) => {
    const { messages, streamingBuffer, activeSessionId } = get();
    const isAuth =
      error.toLowerCase().includes("access token") ||
      error.toLowerCase().includes("unauthorized") ||
      error.toLowerCase().includes("session expired");

    const footer = isAuth
      ? `*Your login session has expired. Please [log in again](/login).*`
      : `*Check your API key and model selection in **Settings > AI Providers (BYOK)**.*`;

    const errorContent = streamingBuffer
      ? `${streamingBuffer}\n\n---\n⚠️ **AI Stream Interrupted**: ${error}`
      : `⚠️ **AI Response Failed**\n\n${error}\n\n${footer}`;

    const errorMessage: ChatMessage = {
      id: "err-" + Date.now(),
      sessionId: activeSessionId || "",
      role: "assistant",
      content: errorContent,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, errorMessage],
      isStreaming: false,
      streamingBuffer: "",
      liveToolCalls: [],
    });
  },

  clearLastFailedPrompt: () => set({ lastFailedPrompt: null }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
  setChatMode: (chatMode) => set({ chatMode }),
}));

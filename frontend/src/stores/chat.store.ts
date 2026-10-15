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

  setActiveSessionId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendUserMessage: (content: string) => void;
  startAssistantStream: () => void;
  appendToken: (token: string) => void;
  finishStream: (info: {
    messageId?: string;
    content?: string;
    toolCalls?: ToolCallExecution[] | null;
  }) => void;
  cancelStream: () => void;
  setSelectedModel: (model: string) => void;
  setSelectedProviderId: (id: string | null) => void;
  setChatMode: (mode: ChatMode) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeSessionId: null,
  messages: [],
  streamingBuffer: "",
  isStreaming: false,
  selectedModel: "gpt-4o",
  selectedProviderId: null,
  chatMode: "edit",

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

  startAssistantStream: () => {
    set({
      isStreaming: true,
      streamingBuffer: "",
    });
  },

  appendToken: (delta) => {
    set((state) => ({
      streamingBuffer: state.streamingBuffer + delta,
    }));
  },

  finishStream: ({ messageId, content, toolCalls }) => {
    const { messages, streamingBuffer, activeSessionId } = get();
    const finalContent = content ?? streamingBuffer;

    const newAssistantMessage: ChatMessage = {
      id: messageId || "msg-" + Date.now(),
      sessionId: activeSessionId || "",
      role: "assistant",
      content: finalContent,
      toolCalls: toolCalls || null,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, newAssistantMessage],
      isStreaming: false,
      streamingBuffer: "",
    });
  },

  cancelStream: () => {
    set({ isStreaming: false });
  },

  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
  setChatMode: (chatMode) => set({ chatMode }),
}));

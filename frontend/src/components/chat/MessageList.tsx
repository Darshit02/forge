import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble.js";
import { useChatStore } from "../../stores/chat.store.js";
import { Bot } from "lucide-react";
import type { ChatMessage } from "../../types/api.js";

interface MessageListProps {
  messages: ChatMessage[];
  projectId?: string;
}

export function MessageList({ messages, projectId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isStreaming, streamingBuffer } = useChatStore();

  // Auto-scroll to bottom on token append
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingBuffer, isStreaming]);

  // Cap visible history to 100 messages for render performance
  const displayMessages = messages.slice(-100);

  if (displayMessages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-ash">
        <div className="w-10 h-10 rounded-2xl  bg-bone flex items-center justify-center mb-3">
          <Bot className="w-5 h-5 text-ash" />
        </div>
        <h4 className="text-sm font-normal text-ink">
          Forge AI Assistant
        </h4>
        <p className="mt-1 text-xs text-ash max-w-xs">
          Ask to generate endpoints, refactor code, install dependencies, or debug errors.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar"
    >
      {displayMessages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} projectId={projectId} />
      ))}

      {/* Live streaming assistant message */}
      {isStreaming && (
        <MessageBubble
          message={{
            id: "live-stream",
            sessionId: "",
            role: "assistant",
            content: streamingBuffer,
            createdAt: new Date().toISOString(),
          }}
          isStreaming={true}
          projectId={projectId}
        />
      )}
    </div>
  );
}

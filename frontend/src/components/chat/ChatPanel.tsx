import { SessionList } from "./SessionList.js";
import { MessageList } from "./MessageList.js";
import { ChatInput } from "./ChatInput.js";
import { useChatStore } from "../../stores/chat.store.js";
import { useChatStream } from "../../hooks/useChatStream.js";

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const messages = useChatStore((s) => s.messages);
  const { sendMessage, cancel, isStreaming } = useChatStream(projectId);

  return (
    <div className="flex flex-col h-full bg-paper dark:bg-card">
      <SessionList projectId={projectId} />
      <MessageList messages={messages} projectId={projectId} />
      <ChatInput
        projectId={projectId}
        onSend={sendMessage}
        onCancel={cancel}
        isStreaming={isStreaming}
      />
    </div>
  );
}

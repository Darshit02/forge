import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble.js";
import { useChatStore } from "../../stores/chat.store.js";
import { getMascotAvatar } from "../../lib/mascot.js";
import type { ChatMessage } from "../../types/api.js";
import { Code2, ShieldCheck, Activity, Terminal, Sparkles, ArrowRight } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  projectId?: string;
  onPromptSelect?: (prompt: string) => void;
  onRetry?: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />,
    title: "Scaffold REST Endpoints",
    desc: "Create CRUD API routes with validation schemas and error handling",
    prompt: "Create a complete set of CRUD REST endpoints with request validation schemas and proper HTTP error responses.",
  },
  {
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
    title: "Add JWT Authentication",
    desc: "Implement user signup, login, password hashing, and auth middleware",
    prompt: "Implement JWT authentication with user registration, login route, password hashing, and a protected route middleware.",
  },
  {
    icon: <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
    title: "Health & Observability",
    desc: "Add /healthz readiness probes and uptime diagnostics",
    prompt: "Add a /healthz and /readyz probe endpoint with uptime and system diagnostic checks.",
  },
  {
    icon: <Terminal className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
    title: "Automated Unit Tests",
    desc: "Write unit and integration tests with realistic mock fixtures",
    prompt: "Write a comprehensive suite of unit tests for the current endpoints with sample test fixtures.",
  },
];

export function MessageList({
  messages,
  projectId,
  onPromptSelect,
  onRetry,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const { isStreaming, streamingBuffer, liveToolCalls } = useChatStore();

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserScrolledUp(!isAtBottom);
  };

  // Auto-scroll to bottom unless user scrolled up
  useEffect(() => {
    if (scrollRef.current && !userScrolledUp) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingBuffer, liveToolCalls, isStreaming, userScrolledUp]);

  // Cap visible history to 100 messages for render performance
  const displayMessages = messages.slice(-100);

  if (displayMessages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto no-scrollbar">
        <div className="w-12 h-12 rounded-2xl overflow-hidden mb-3 border border-hairline/60 bg-paper shadow-sm select-none">
          <img
            src={getMascotAvatar("bot")}
            alt="Forge AI Mascot"
            className="w-full h-full object-cover"
          />
        </div>
        <h4 className="text-sm font-normal text-ink flex items-center gap-1.5 justify-center">
          Forge AI Assistant
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bone text-ash border border-hairline font-mono">
            BYOK Pair Programmer
          </span>
        </h4>
        <p className="mt-1 text-xs text-ash max-w-sm font-normal">
          I can inspect workspace files, scaffold microservice boilerplate, install packages, and edit code in real-time.
        </p>

        {/* Example Prompt Starters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full text-left">
          {EXAMPLE_PROMPTS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onPromptSelect?.(item.prompt)}
              className="p-2.5 rounded-xl border border-hairline bg-paper hover:bg-bone transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {item.icon}
                <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-ash line-clamp-2 leading-tight font-normal">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar"
    >
      {displayMessages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          projectId={projectId}
          onRetry={msg.id.startsWith("err-") ? onRetry : undefined}
        />
      ))}

      {/* Live streaming assistant message with real-time tool calls */}
      {isStreaming && (
        <MessageBubble
          message={{
            id: "live-stream",
            sessionId: "",
            role: "assistant",
            content: streamingBuffer,
            toolCalls: liveToolCalls.length > 0 ? liveToolCalls : null,
            createdAt: new Date().toISOString(),
          }}
          isStreaming={true}
          projectId={projectId}
        />
      )}
    </div>
  );
}

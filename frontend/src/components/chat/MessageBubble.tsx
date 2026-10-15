import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Bot, User } from "lucide-react";
import { StreamingCursor } from "./StreamingCursor.js";
import { ToolCallCard } from "./ToolCallCard.js";
import { cn } from "../../lib/utils.js";
import type { ChatMessage } from "../../types/api.js";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  projectId?: string;
}

export function MessageBubble({
  message,
  isStreaming = false,
  projectId,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="flex gap-2 max-w-[85%]">
          <div className="rounded-2xl rounded-tr-xs bg-bone border border-hairline px-3.5 py-2.5 text-xs text-ink font-sans font-normal">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div className="w-6 h-6 rounded-[6px] bg-paper border border-hairline flex items-center justify-center shrink-0 text-ash mt-1">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start my-3">
      <div className="flex gap-2.5 max-w-[95%]">
        <div className="w-6 h-6 rounded-[6px] bg-primary flex items-center justify-center shrink-0 text-ink font-normal text-xs mt-0.5">
          <Bot className="w-3.5 h-3.5 text-ink" />
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="space-y-1 mb-2">
              {message.toolCalls.map((tc, idx) => (
                <ToolCallCard
                  key={tc.toolCallId || idx}
                  toolCall={tc}
                  projectId={projectId}
                />
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-sm max-w-none text-xs font-sans text-ink leading-relaxed font-normal">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !String(children).includes("\n");

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded-[4px] bg-bone font-mono text-[11px] text-ink font-normal"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  const codeText = String(children).replace(/\n$/, "");
                  const blockId = Math.random().toString(36).slice(2, 7);

                  return (
                    <div className="relative my-2 rounded-xl border border-hairline bg-paper overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1 border-b border-hairline bg-bone text-[10px] uppercase font-mono tracking-[0.018em] text-ash">
                        <span>{match ? match[1] : "code"}</span>
                        <button
                          onClick={() => copyToClipboard(codeText, blockId)}
                          className="flex items-center gap-1 hover:text-ink transition-colors font-mono text-[10px]"
                        >
                          {copiedCodeId === blockId ? (
                            <>
                              <Check className="w-3 h-3 text-ink" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 font-mono text-[11px] overflow-x-auto text-ink m-0 bg-paper">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {isStreaming && <StreamingCursor />}
          </div>
        </div>
      </div>
    </div>
  );
}

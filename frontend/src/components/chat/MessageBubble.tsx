import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { StreamingCursor } from "./StreamingCursor.js";
import { ToolCallCard } from "./ToolCallCard.js";
import { cn } from "../../lib/utils.js";
import type { ChatMessage } from "../../types/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getMascotAvatar, getMascotInfo } from "../../lib/mascot.js";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  projectId?: string;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  isStreaming = false,
  projectId,
  onRetry,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isUser = message.role === "user";
  const isError = message.id.startsWith("err-");

  const userSeed = user?.id || user?.email || user?.name || "forge-developer";
  const userMascotUrl = getMascotAvatar(userSeed);
  const userMascotInfo = getMascotInfo(userSeed);

  const botMascotUrl = getMascotAvatar("bot");
  const botMascotInfo = getMascotInfo("bot");

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
          <div className="rounded-2xl rounded-tr-xs bg-bone px-3.5 py-2.5 text-xs text-ink font-sans font-normal border border-hairline/60">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div
            className="w-7 h-7 rounded-[10px] overflow-hidden shrink-0 mt-0.5 border border-hairline/60 bg-paper shadow-sm select-none"
            title={`${user?.name || "Developer"} (${userMascotInfo.name})`}
          >
            <img
              src={userMascotUrl}
              alt={userMascotInfo.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  }

  // Error Card Bubble
  if (isError) {
    return (
      <div className="flex justify-start my-3">
        <div className="flex gap-2.5 max-w-[95%]">
          <div
            className="w-7 h-7 rounded-[10px] overflow-hidden shrink-0 mt-0.5 border border-destructive/40 bg-destructive/10 select-none flex items-center justify-center"
            title="AI Request Error"
          >
            <span className="text-xs">⚠️</span>
          </div>

          <div className="flex-1 rounded-2xl rounded-tl-xs border border-destructive/30 bg-destructive/5 p-3.5 text-xs font-sans space-y-2">
            <div className="prose prose-sm max-w-none text-xs text-ink font-normal leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

            {onRetry && (
              <div className="pt-2 border-t border-destructive/20 flex items-center justify-between">
                <span className="text-[11px] text-ash">
                  Check your API key in Settings &gt; AI Providers (BYOK)
                </span>
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-2.5 py-1 rounded-[8px] bg-paper border border-hairline hover:bg-bone text-[11px] font-medium text-ink transition-colors"
                >
                  Retry Prompt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isThinking = isStreaming && (!message.content || message.content === "*Thinking...*");

  return (
    <div className="flex justify-start my-3">
      <div className="flex gap-2.5 max-w-[95%]">
        <div
          className="w-7 h-7 rounded-[10px] overflow-hidden shrink-0 mt-0.5 border border-hairline/60 bg-paper shadow-sm select-none"
          title={`Forge AI (${botMascotInfo.name})`}
        >
          <img
            src={botMascotUrl}
            alt={botMascotInfo.name}
            className="w-full h-full object-cover"
          />
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

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-ash py-1.5 px-3 rounded-xl bg-bone/70 border border-hairline/60 w-fit">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
              </div>
              <span className="font-sans text-[11px] text-ink">
                Planning architecture and writing files...
              </span>
            </div>
          )}

          {/* Markdown Content */}
          {!isThinking && (
            <div className="prose prose-sm max-w-none text-xs font-sans text-ink leading-relaxed font-normal">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !String(children).includes("\n");

                      if (isInline) {
                        return (
                          <code
                            className="px-1.5 py-0.5 rounded-[4px] bg-bone text-[11px] text-ink font-mono font-normal"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      const codeText = String(children).replace(/\n$/, "");
                      const blockId = Math.random().toString(36).slice(2, 7);

                      return (
                        <div className="relative my-2 rounded-xl bg-paper border border-hairline overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-1 border-b border-hairline bg-bone text-[10px] uppercase tracking-[0.018em] text-ash font-mono">
                            <span>{match ? match[1] : "code"}</span>
                            <button
                              onClick={() => copyToClipboard(codeText, blockId)}
                              className="flex items-center gap-1 hover:text-ink transition-colors text-[10px]"
                            >
                              {copiedCodeId === blockId ? (
                                <>
                                  <Check className="w-3 h-3 text-primary" />
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
                          <pre className="p-3 text-[11px] font-mono overflow-x-auto text-ink m-0 bg-paper">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (!message.toolCalls || message.toolCalls.length === 0) ? (
                <p className="text-ash italic text-xs">No response content was received for this turn.</p>
              ) : null}

              {isStreaming && <StreamingCursor />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../../lib/api/providers.js";
import { filesApi } from "../../lib/api/files.js";
import { useChatStore } from "../../stores/chat.store.js";
import { Button } from "../ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover.js";
import {
  Send,
  StopCircle,
  Paperclip,
  Sparkles,
  ChevronDown,
  FileCode,
  Check,
} from "lucide-react";
import { cn } from "../../lib/utils.js";
import type { ChatMode } from "../../types/api.js";

const POPULAR_MODELS_BY_PROVIDER: Record<string, string[]> = {
  google: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ],
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "o3-mini",
    "o1",
  ],
  anthropic: [
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
  ],
  custom: [
    "deepseek-chat",
    "deepseek-coder",
    "llama3.3",
    "qwen2.5-coder",
  ],
};

interface ChatInputProps {
  projectId: string;
  onSend: (message: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
}

export function ChatInput({
  projectId,
  onSend,
  onCancel,
  isStreaming,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [filePickerOpen, setFilePickerOpen] = useState(false);

  const {
    selectedModel,
    setSelectedModel,
    selectedProviderId,
    setSelectedProviderId,
    chatMode,
    setChatMode,
  } = useChatStore();

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await providersApi.list();
      return res.providers;
    },
  });

  const filesQuery = useQuery({
    queryKey: ["files", projectId],
    queryFn: async () => {
      const res = await filesApi.tree(projectId);
      return res.tree;
    },
    enabled: filePickerOpen,
  });

  const providers = providersQuery.data || [];

  // Auto-sync provider and model when providers load
  useEffect(() => {
    if (providers.length > 0) {
      const currentProvider = providers.find((p) => p.id === selectedProviderId);
      if (!currentProvider) {
        const defaultProvider = providers.find((p) => p.isDefault) || providers[0];
        setSelectedProviderId(defaultProvider.id);
        setSelectedModel(defaultProvider.modelDefault);
      }
    }
  }, [providers, selectedProviderId, setSelectedProviderId, setSelectedModel]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleAttachFile = (filePath: string) => {
    setText((prev) => `${prev} @${filePath} `);
    setFilePickerOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-3 border-t border-hairline bg-paper">
      {/* Controls Strip: Mode Toggle + Model Picker + File Context */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-[10px]  bg-bone text-[11px] font-sans">
            {(["edit", "chat", "agent"] as ChatMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setChatMode(mode)}
                className={cn(
                  "px-2 py-0.5 rounded-[4px] capitalize transition-colors font-normal",
                  chatMode === mode
                    ? "bg-paper text-ink font-normal "
                    : "text-ash hover:text-ink"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Model Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[11px] text-ink hover:bg-bone font-sans font-normal border border-hairline/60"
              >
                <Sparkles className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate max-w-[130px] font-mono text-[11px]">{selectedModel}</span>
                <ChevronDown className="w-3 h-3 text-ash shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="rounded-xl bg-paper text-xs font-sans w-64 max-h-80 overflow-y-auto p-1.5 border border-hairline shadow-md"
            >
              {providers.length > 0 ? (
                providers.map((p, idx) => {
                  const suggested = POPULAR_MODELS_BY_PROVIDER[p.provider] || [];
                  const allModels = Array.from(new Set([p.modelDefault, ...suggested]));
                  return (
                    <div key={p.id} className={idx > 0 ? "pt-1.5 mt-1.5 border-t border-hairline/60" : ""}>
                      <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase tracking-[0.018em] text-ash font-medium">
                        <span className="truncate">{p.label}</span>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-bone font-mono text-ash/80 lowercase">
                          {p.provider}
                        </span>
                      </div>
                      {allModels.map((m) => {
                        const isSelected = selectedProviderId === p.id && selectedModel === m;
                        return (
                          <DropdownMenuItem
                            key={m}
                            className={cn(
                              "cursor-pointer text-xs font-normal flex items-center justify-between rounded-[6px] px-2 py-1.5 font-mono text-[11px]",
                              isSelected ? "bg-bone text-ink font-medium" : "text-ash hover:text-ink"
                            )}
                            onClick={() => {
                              setSelectedProviderId(p.id);
                              setSelectedModel(m);
                            }}
                          >
                            <span className="truncate">{m}</span>
                            {isSelected && <Check className="w-3 h-3 text-primary shrink-0 ml-1" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-ash font-normal text-center space-y-2">
                  <p>No AI providers registered yet.</p>
                  <a
                    href="/settings"
                    className="inline-block text-[11px] text-primary hover:underline font-medium"
                  >
                    Go to Settings &rarr;
                  </a>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Attach File Popover */}
        <Popover open={filePickerOpen} onOpenChange={setFilePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon-xs"
              variant="ghost"
              title="Attach File Context"
              className="rounded-[10px]  text-ash hover:text-ink"
            >
              <Paperclip className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-56 p-1.5 rounded-xl  bg-paper text-xs font-sans"
          >
            <div className="px-2 py-1 text-[10px] uppercase tracking-[0.018em] text-ash  font-normal">
              Attach File to Prompt
            </div>
            <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
              {filesQuery.data && filesQuery.data.length > 0 ? (
                filesQuery.data.map((node) => (
                  <button
                    key={node.path}
                    onClick={() => handleAttachFile(node.path)}
                    className="w-full text-left px-2 py-1 rounded-[4px] hover:bg-bone text-xs truncate flex items-center gap-1.5 text-ink font-normal"
                  >
                    <FileCode className="w-3 h-3 text-ash shrink-0" />
                    <span className="truncate">{node.path}</span>
                  </button>
                ))
              ) : (
                <div className="p-2 text-xs text-ash font-normal">No files found</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Input Textarea & Send / Cancel Button */}
      <div className="relative rounded-[10px]  bg-paper focus-within:border-primary transition-colors p-2">
        <textarea
          ref={textareaRef}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe backend features, endpoints, or ask for refactors (⌘+Enter)..."
          className="w-full resize-none border-0 bg-transparent text-xs text-ink placeholder:text-ash outline-none font-sans font-normal"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-ash font-sans font-normal">
            ⌘+Enter to send
          </span>

          {isStreaming ? (
            <Button
              size="xs"
              variant="outline"
              onClick={onCancel}
              className="rounded-[10px] border-hairline text-destructive hover:bg-bone font-normal"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="xs"
              disabled={!text.trim()}
              onClick={handleSend}
              className="rounded-[10px] bg-primary text-ink hover:bg-primary/90 font-normal px-2.5"
            >
              <Send className="w-3 h-3 mr-1" />
              Send
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

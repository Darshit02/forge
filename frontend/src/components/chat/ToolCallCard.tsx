import { useState } from "react";
import {
  FileEdit,
  Trash2,
  FileSearch,
  Terminal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEditorStore } from "../../stores/editor.store.js";
import { filesApi } from "../../lib/api/files.js";
import { Button } from "../ui/button.js";
import type { ToolCallExecution } from "../../types/api.js";

interface ToolCallCardProps {
  toolCall: ToolCallExecution;
  projectId?: string;
}

export function ToolCallCard({ toolCall, projectId }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openFile } = useEditorStore();

  const filePath = (toolCall.args.path as string) || (toolCall.args.filePath as string) || undefined;
  const content = (toolCall.args.content as string) || undefined;
  const cmd = (toolCall.args.cmd as string) || undefined;

  const getToolMeta = () => {
    switch (toolCall.toolName) {
      case "writeFile":
        return {
          icon: <FileEdit className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
          action: "Write File",
          target: filePath || "file",
        };
      case "deleteFile":
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-destructive shrink-0" />,
          action: "Delete File",
          target: filePath || "file",
        };
      case "readFile":
        return {
          icon: <FileSearch className="w-3.5 h-3.5 text-ash shrink-0" />,
          action: "Read File",
          target: filePath || "file",
        };
      case "runCommand":
        return {
          icon: <Terminal className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
          action: "Run Command",
          target: cmd || "command",
        };
      default:
        return {
          icon: <FileEdit className="w-3.5 h-3.5 text-ash shrink-0" />,
          action: toolCall.toolName,
          target: filePath || cmd || "",
        };
    }
  };

  const meta = getToolMeta();

  const handleOpenInEditor = async () => {
    if (!projectId || !filePath) return;
    try {
      const res = await filesApi.read(projectId, filePath);
      openFile(filePath, res.file.content);
    } catch {
      if (content) {
        openFile(filePath, content);
      }
    }
  };

  const handleCopyContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasResult = toolCall.result !== undefined;
  const isSuccess = hasResult ? (toolCall.result as any)?.success !== false : true;

  return (
    <div className="my-1.5 rounded-xl border border-hairline/80 bg-paper overflow-hidden text-xs font-sans shadow-xs">
      <div
        onClick={() => (content || cmd) && setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-bone transition-colors"
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {meta.icon}
          <span className="text-[11px] font-medium text-ash uppercase tracking-wider">
            {meta.action}:
          </span>
          <span className="text-ink font-mono text-[11px] truncate font-normal">
            {meta.target}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Execution Status Badge */}
          {hasResult ? (
            isSuccess ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                <Check className="w-3 h-3" />
                Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-mono">
                <AlertCircle className="w-3 h-3" />
                Failed
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-ash font-mono">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Running
            </span>
          )}

          {filePath && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Open in editor"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInEditor();
              }}
              className="text-ash hover:text-ink rounded-[4px] h-6 w-6"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}

          {content && (
            <button
              type="button"
              className="text-ash hover:text-ink p-0.5 transition-colors"
              title={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && content && (
        <div className="border-t border-hairline p-2.5 bg-bone/40">
          <div className="flex items-center justify-between pb-1.5 text-[10px] text-ash font-mono">
            <span>{filePath}</span>
            <button
              onClick={handleCopyContent}
              className="flex items-center gap-1 hover:text-ink transition-colors"
            >
              {copied ? (
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
          <pre className="p-2.5 rounded-lg bg-paper border border-hairline text-[11px] font-mono overflow-x-auto max-h-56 text-ink leading-relaxed">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { FileEdit, Trash2, FileSearch, Terminal, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
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
  const { openFile } = useEditorStore();

  const getToolMeta = () => {
    switch (toolCall.toolName) {
      case "writeFile":
        return {
          icon: <FileEdit className="w-3.5 h-3.5 text-emerald-500" />,
          label: `Wrote ${(toolCall.args.path as string) || "file"}`,
          badge: "write",
        };
      case "deleteFile":
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-destructive" />,
          label: `Deleted ${(toolCall.args.path as string) || "file"}`,
          badge: "delete",
        };
      case "readFile":
        return {
          icon: <FileSearch className="w-3.5 h-3.5 text-ash" />,
          label: `Read ${(toolCall.args.path as string) || "file"}`,
          badge: "read",
        };
      case "runCommand":
        return {
          icon: <Terminal className="w-3.5 h-3.5 text-amber-500" />,
          label: `Ran ${(toolCall.args.cmd as string) || "command"}`,
          badge: "command",
        };
      default:
        return {
          icon: <FileEdit className="w-3.5 h-3.5 text-ash" />,
          label: toolCall.toolName,
          badge: "tool",
        };
    }
  };

  const meta = getToolMeta();
  const filePath = toolCall.args.path as string | undefined;
  const content = toolCall.args.content as string | undefined;

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

  return (
    <div className="my-2 border border-hairline rounded-xl bg-wash dark:bg-muted/40 overflow-hidden text-xs font-sans">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-hairline/40 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          {meta.icon}
          <span className="font-mono text-ink dark:text-paper font-medium truncate">
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {filePath && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Open in editor"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInEditor();
              }}
              className="text-ash hover:text-ink dark:hover:text-paper"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}

          {content && (
            <button className="text-ash p-0.5">
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
        <div className="border-t border-hairline p-2 bg-paper dark:bg-card">
          <pre className="p-2 rounded bg-bone dark:bg-muted/60 font-mono text-[11px] overflow-x-auto max-h-48 text-ink dark:text-paper">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

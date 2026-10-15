import { DiffEditor } from "@monaco-editor/react";
import { useUIStore } from "../../stores/ui.store.js";
import { Button } from "../ui/button.js";
import { X, Check } from "lucide-react";

interface DiffViewerProps {
  original: string;
  modified: string;
  filePath: string;
  language?: string;
  onApply?: () => void;
  onDiscard?: () => void;
}

export function DiffViewer({
  original,
  modified,
  filePath,
  language = "typescript",
  onApply,
  onDiscard,
}: DiffViewerProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <div className="flex flex-col h-full bg-paper  rounded-xl overflow-hidden">
      <div className="h-9 px-3 border-b border-hairline bg-bone flex items-center justify-between text-xs select-none">
        <span className=" text-ink font-normal">
          Diff: {filePath}
        </span>
        <div className="flex items-center gap-2">
          {onDiscard && (
            <Button
              size="xs"
              variant="outline"
              onClick={onDiscard}
              className="rounded-[6px] border-hairline font-normal"
            >
              <X className="w-3 h-3 mr-1" />
              Discard
            </Button>
          )}
          {onApply && (
            <Button
              size="xs"
              onClick={onApply}
              className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal"
            >
              <Check className="w-3 h-3 mr-1" />
              Apply Changes
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <DiffEditor
          height="100%"
          original={original}
          modified={modified}
          language={language}
          theme="light"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      </div>
    </div>
  );
}

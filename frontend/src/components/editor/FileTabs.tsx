import { X, FileCode2, FileText } from "lucide-react";
import { useEditorStore } from "../../stores/editor.store.js";
import { cn } from "../../lib/utils.js";

export function FileTabs() {
  const { openFiles, activeFile, setActiveFile, closeFile } = useEditorStore();

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center h-9 border-b border-hairline bg-paper dark:bg-card overflow-x-auto select-none no-scrollbar">
      {openFiles.map((file) => {
        const isActive = file.path === activeFile;
        const fileName = file.path.split("/").pop() || file.path;

        return (
          <div
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={cn(
              "group flex items-center h-full px-3 gap-2 border-r border-hairline text-xs cursor-pointer transition-colors shrink-0",
              isActive
                ? "bg-bone dark:bg-muted text-ink dark:text-paper border-b-2 border-b-primary font-medium"
                : "text-ash hover:bg-wash dark:hover:bg-muted/50 hover:text-ink dark:hover:text-paper"
            )}
          >
            {file.language === "python" || file.language === "typescript" || file.language === "javascript" ? (
              <FileCode2 className="w-3.5 h-3.5 text-ash" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-ash" />
            )}

            <span className="truncate max-w-[120px]">{fileName}</span>

            {/* Dirty indicator */}
            {file.dirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}

            {/* Close tab */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="p-0.5 rounded hover:bg-hairline text-ash hover:text-ink dark:hover:text-paper opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

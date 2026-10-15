import { useEffect, useRef, useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useEditorStore } from "../../stores/editor.store.js";
import { useUIStore } from "../../stores/ui.store.js";
import { filesApi } from "../../lib/api/files.js";
import { toast } from "sonner";
import { Code2, Save, FileCode } from "lucide-react";

interface CodeEditorProps {
  projectId: string;
}

export function CodeEditor({ projectId }: CodeEditorProps) {
  const { openFiles, activeFile, updateContent, markClean } = useEditorStore();
  const theme = useUIStore((s) => s.theme);
  const autoSaveTimerRef = useRef<number | null>(null);

  const currentFile = openFiles.find((f) => f.path === activeFile);

  // Save active file handler
  const handleSave = useCallback(
    async (filePath: string, content: string) => {
      try {
        await filesApi.write(projectId, filePath, content);
        markClean(filePath);
        toast.success(`Saved ${filePath}`, { duration: 1500 });
      } catch (err: any) {
        toast.error(err.message || `Failed to save ${filePath}`);
      }
    },
    [projectId, markClean]
  );

  // Auto-save debounced 2 seconds after edit
  useEffect(() => {
    if (!currentFile || !currentFile.dirty) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      handleSave(currentFile.path, currentFile.content);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentFile, handleSave]);

  // Keyboard shortcut Cmd/Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (currentFile) {
          handleSave(currentFile.path, currentFile.content);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, handleSave]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Configure editor settings
    editor.updateOptions({
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "'JetBrains Mono', Menlo, Monaco, monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      renderLineHighlight: "all",
      tabSize: 2,
    });

    // Add Cmd+S action inside monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (currentFile) {
        handleSave(currentFile.path, editor.getValue());
      }
    });
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-paper dark:bg-card select-none">
        <div className="w-12 h-12 rounded-2xl border border-hairline bg-bone dark:bg-muted/40 flex items-center justify-center mb-4 text-ash">
          <Code2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-normal text-ink dark:text-paper">
          No file is currently open
        </h3>
        <p className="mt-1 text-sm text-ash max-w-sm">
          Select a file from the explorer on the left or prompt the AI pair
          programmer to generate endpoints.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-paper dark:bg-card">
      {/* Editor Sub-Header / Breadcrumb */}
      <div className="h-7 px-3 border-b border-hairline bg-paper dark:bg-card flex items-center justify-between text-[11px] text-ash select-none shrink-0 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <FileCode className="w-3.5 h-3.5 text-ash" />
          <span className="truncate">{currentFile.path}</span>
        </div>
        <div className="flex items-center gap-3">
          {currentFile.dirty ? (
            <button
              onClick={() => handleSave(currentFile.path, currentFile.content)}
              className="flex items-center gap-1 text-[11px] text-primary-foreground bg-primary px-1.5 py-0.2 rounded hover:opacity-90 font-sans"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          ) : (
            <span className="text-[10px] text-ash">Saved</span>
          )}
          <span className="uppercase text-[10px]">{currentFile.language}</span>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full h-full min-h-0">
        <Editor
          height="100%"
          path={currentFile.path}
          language={currentFile.language}
          value={currentFile.content}
          theme={theme === "dark" ? "vs-dark" : "light"}
          onChange={(value) => {
            if (value !== undefined) {
              updateContent(currentFile.path, value);
            }
          }}
          onMount={handleEditorMount}
          options={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

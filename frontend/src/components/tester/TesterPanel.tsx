import { useState, useEffect } from "react";
import { CollectionSidebar } from "./CollectionSidebar.js";
import { RequestBuilder } from "./RequestBuilder.js";
import { ResponseViewer } from "./ResponseViewer.js";
import { useTestRunner } from "../../hooks/useTestRunner.js";

interface TesterPanelProps {
  projectId: string;
}

export function TesterPanel({ projectId }: TesterPanelProps) {
  const { runTest, isSending, activeResponse } = useTestRunner(projectId);
  const [showCollections, setShowCollections] = useState(false);

  // Keyboard shortcut Cmd/Ctrl+Enter to run request
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runTest();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runTest]);

  return (
    <div className="flex h-full bg-paper overflow-hidden relative">
      {/* Collapsible Collections Sidebar */}
      {showCollections && (
        <div className="w-56 h-full shrink-0 border-r border-hairline overflow-hidden">
          <CollectionSidebar projectId={projectId} />
        </div>
      )}

      {/* Main Request Builder & Response Viewer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <div className="flex items-center justify-between px-3 h-7 bg-bone/50 border-b border-hairline text-[11px] text-ash shrink-0 select-none">
          <button
            type="button"
            onClick={() => setShowCollections((s) => !s)}
            className="flex items-center gap-1.5 hover:text-ink transition-colors font-sans"
          >
            <span className="w-2 h-2 rounded-full border border-ash/40" />
            <span>{showCollections ? "Hide Collections" : "Show Collections"}</span>
          </button>
          <span className="font-mono text-[10px]">Cmd+Enter to send</span>
        </div>
        <RequestBuilder onSend={runTest} isSending={isSending} />
        <ResponseViewer response={activeResponse} isSending={isSending} />
      </div>
    </div>
  );
}

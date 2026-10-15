import { useEffect } from "react";
import { CollectionSidebar } from "./CollectionSidebar.js";
import { RequestBuilder } from "./RequestBuilder.js";
import { ResponseViewer } from "./ResponseViewer.js";
import { useTestRunner } from "../../hooks/useTestRunner.js";

interface TesterPanelProps {
  projectId: string;
}

export function TesterPanel({ projectId }: TesterPanelProps) {
  const { runTest, isSending, activeResponse } = useTestRunner(projectId);

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
    <div className="flex h-full bg-paper dark:bg-card overflow-hidden">
      {/* Collections & Saved Endpoints */}
      <CollectionSidebar projectId={projectId} />

      {/* Main Request Builder & Response Viewer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <RequestBuilder onSend={runTest} isSending={isSending} />
        <ResponseViewer response={activeResponse} isSending={isSending} />
      </div>
    </div>
  );
}

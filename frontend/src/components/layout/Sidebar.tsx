import { useState } from "react";
import { FileTree } from "../editor/FileTree.js";
import { CollectionSidebar } from "../tester/CollectionSidebar.js";
import { EnvironmentEditor } from "../environments/EnvironmentEditor.js";
import { Files, Layers, SlidersHorizontal } from "lucide-react";

interface SidebarProps {
  projectId: string;
}

type SidebarTab = "files" | "collections" | "environments";

export function Sidebar({ projectId }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("files");

  return (
    <div className="h-full flex flex-col bg-paper dark:bg-card border-r border-hairline overflow-hidden">
      {/* Sidebar Header Tabs */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-hairline bg-bone/40 dark:bg-muted/20 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
              activeTab === "files"
                ? "bg-paper dark:bg-card text-ink dark:text-paper font-medium border border-hairline"
                : "text-ash hover:text-ink"
            }`}
          >
            <Files className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("collections")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
              activeTab === "collections"
                ? "bg-paper dark:bg-card text-ink dark:text-paper font-medium border border-hairline"
                : "text-ash hover:text-ink"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>APIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("environments")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
              activeTab === "environments"
                ? "bg-paper dark:bg-card text-ink dark:text-paper font-medium border border-hairline"
                : "text-ash hover:text-ink"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Envs</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "files" && (
          <div className="h-full overflow-hidden">
            <FileTree projectId={projectId} />
          </div>
        )}

        {activeTab === "collections" && (
          <div className="h-full overflow-hidden">
            <CollectionSidebar projectId={projectId} />
          </div>
        )}

        {activeTab === "environments" && (
          <div className="h-full overflow-y-auto p-4">
            <EnvironmentEditor projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}

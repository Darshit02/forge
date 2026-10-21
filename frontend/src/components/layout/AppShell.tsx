import { useEffect, useRef } from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { TopBar } from "./TopBar.js";
import { Sidebar } from "./Sidebar.js";
import { FileTabs } from "../editor/FileTabs.js";
import { CodeEditor } from "../editor/CodeEditor.js";
import { ChatPanel } from "../chat/ChatPanel.js";
import { TesterPanel } from "../tester/TesterPanel.js";
import { ConsolePanel } from "../console/ConsolePanel.js";
import { CommandPalette } from "./CommandPalette.js";
import { useUIStore } from "../../stores/ui.store.js";
import { useProjectSocket } from "../../lib/ws/hooks.js";
import { cn } from "../../lib/utils.js";
import { MessageSquare, Send, Terminal, PanelLeftClose, PanelLeft } from "lucide-react";
import type { Project } from "../../types/api.js";

interface AppShellProps {
  project: Project;
}

export function AppShell({ project }: AppShellProps) {
  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    rightPanelTab,
    setRightPanelTab,
  } = useUIStore();

  const sidebarRef = useRef<ImperativePanelHandle>(null);

  // Sync imperative panel collapse state with store state
  useEffect(() => {
    const panel = sidebarRef.current;
    if (!panel) return;
    if (sidebarOpen && panel.isCollapsed()) {
      panel.expand();
    } else if (!sidebarOpen && !panel.isCollapsed()) {
      panel.collapse();
    }
  }, [sidebarOpen]);

  // Establish project-scoped WebSocket connection (logs, spec sync, AI tokens, etc.)
  useProjectSocket(project.id);

  // Global keyboard shortcut for toggling sidebar Cmd+B / Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        setRightPanelTab("chat");
      }
      if (e.altKey && e.key === "2") {
        e.preventDefault();
        setRightPanelTab("tester");
      }
      if (e.altKey && e.key === "3") {
        e.preventDefault();
        setRightPanelTab("console");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, setRightPanelTab]);

  return (
    <div className="h-screen w-screen flex flex-col bg-bone overflow-hidden text-ink">
      {/* Top Navigation Bar */}
      <TopBar currentProject={project} />

      {/* Main IDE Workspace */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <PanelGroup
          direction="horizontal"
          autoSaveId={`forge-workspace-v2-${project.id}`}
          className="h-full w-full"
        >
          {/* Left Panel: Project Explorer */}
          <Panel
            ref={sidebarRef}
            id="sidebar"
            order={1}
            defaultSize={18}
            minSize={12}
            maxSize={35}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setSidebarOpen(false)}
            onExpand={() => setSidebarOpen(true)}
            className="h-full overflow-hidden"
          >
            <div className={`h-full overflow-hidden ${!sidebarOpen ? "invisible pointer-events-none" : ""}`}>
              <Sidebar projectId={project.id} />
            </div>
          </Panel>

          {/* Left Resize Handle */}
          <PanelResizeHandle
            disabled={!sidebarOpen}
            hitAreaMargins={{ fine: 10, coarse: 18 }}
            className={cn(
              "group relative flex w-2 items-center justify-center cursor-col-resize select-none touch-none",
              "hover:bg-bone/80 transition-colors z-10",
              "data-[resize-handle-state=drag]:bg-primary/20",
              !sidebarOpen && "hidden cursor-default pointer-events-none"
            )}
          >
            <div className="w-[1px] h-full bg-hairline group-hover:bg-ash/70 group-data-[resize-handle-state=drag]:bg-primary group-data-[resize-handle-state=drag]:w-[2px] transition-all" />
          </PanelResizeHandle>

          {/* Center Panel: Code Editor */}
          <Panel
            id="editor"
            order={2}
            defaultSize={50}
            minSize={25}
            className="h-full overflow-hidden"
          >
            <div className="h-full flex flex-col bg-paper overflow-hidden">
              <div className="flex items-center justify-between border-b border-hairline bg-bone h-9">
                <div className="flex items-center flex-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    title={sidebarOpen ? "Collapse Sidebar (⌘B)" : "Open Sidebar (⌘B)"}
                    className="h-9 px-2.5 text-ash hover:text-ink border-r border-hairline flex items-center justify-center transition-colors"
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    ) : (
                      <PanelLeft className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <FileTabs />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <CodeEditor projectId={project.id} />
              </div>
            </div>
          </Panel>

          {/* Right Resize Handle */}
          <PanelResizeHandle
            hitAreaMargins={{ fine: 10, coarse: 18 }}
            className={cn(
              "group relative flex w-2 items-center justify-center cursor-col-resize select-none touch-none",
              "hover:bg-bone/80 transition-colors z-10",
              "data-[resize-handle-state=drag]:bg-primary/20"
            )}
          >
            <div className="w-[1px] h-full bg-hairline group-hover:bg-ash/70 group-data-[resize-handle-state=drag]:bg-primary group-data-[resize-handle-state=drag]:w-[2px] transition-all" />
          </PanelResizeHandle>

          {/* Right Panel: AI Chat / API Tester / Console */}
          <Panel
            id="tools"
            order={3}
            defaultSize={32}
            minSize={20}
            maxSize={60}
            className="h-full overflow-hidden"
          >
            <div className="h-full flex flex-col bg-paper border-l border-hairline overflow-hidden">
              {/* Tab Selector Header */}
              <div className="flex items-center justify-between px-3 h-9 border-b border-hairline bg-bone shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRightPanelTab("chat")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs  transition-colors font-normal ${rightPanelTab === "chat"
                        ? "bg-paper text-ink border-b-2 border-primary"
                        : "text-ash hover:text-ink"
                      }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>AI Assistant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightPanelTab("tester")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs  transition-colors font-normal ${rightPanelTab === "tester"
                        ? "bg-paper text-ink border-b-2 border-primary"
                        : "text-ash hover:text-ink"
                      }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>API Tester</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightPanelTab("console")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs  transition-colors font-normal ${rightPanelTab === "console"
                        ? "bg-paper text-ink border-b-2 border-primary"
                        : "text-ash hover:text-ink"
                      }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Console</span>
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelTab === "chat" && <ChatPanel projectId={project.id} />}
                {rightPanelTab === "tester" && <TesterPanel projectId={project.id} />}
                {rightPanelTab === "console" && <ConsolePanel projectId={project.id} />}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Global Command Palette */}
      <CommandPalette projectId={project.id} />
    </div>
  );
}

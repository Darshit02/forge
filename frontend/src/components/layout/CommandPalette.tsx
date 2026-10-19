import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../../stores/ui.store.js";
import { useEditorStore } from "../../stores/editor.store.js";
import { useContainer } from "../../hooks/useContainer.js";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "../ui/command.js";
import {
  Play,
  Square,
  RotateCw,
  MessageSquare,
  Send,
  Terminal,
  FileCode,
  LayoutDashboard,
  Settings,
  FolderTree,
} from "lucide-react";

interface CommandPaletteProps {
  projectId?: string;
}

export function CommandPalette({ projectId }: CommandPaletteProps) {
  const navigate = useNavigate();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setRightPanelTab,
    toggleSidebar,
  } = useUIStore();

  const { openFiles, setActiveFile } = useEditorStore();
  const { start, stop, restart, isStarting, isStopping } = useContainer(projectId);

  // Global shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const runCommand = (action: () => void) => {
    setCommandPaletteOpen(false);
    action();
  };

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      className="rounded-2xl  bg-paper shadow-none max-w-xl"
    >
      <CommandInput
        placeholder="Type a command or search open files..."
        className=" text-xs h-12"
      />
      <CommandList className="max-h-80 overflow-y-auto p-2">
        <CommandEmpty className="text-xs text-ash py-6 text-center ">
          No results found.
        </CommandEmpty>

        {/* Currently Open Files */}
        {openFiles.length > 0 && (
          <CommandGroup heading="Open Editors">
            {openFiles.map((file) => (
              <CommandItem
                key={file.path}
                onSelect={() => runCommand(() => setActiveFile(file.path))}
                className="gap-2 text-xs  rounded-[10px] cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-ash" />
                <span className="truncate">{file.path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Workspace Actions */}
        {projectId && (
          <CommandGroup heading="Container & Execution">
            <CommandItem
              onSelect={() => runCommand(() => { start(); })}
              disabled={isStarting}
              className="gap-2 text-xs  rounded-[10px] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-ink" />
              <span>Start Backend Container</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => { restart(); })}
              className="gap-2 text-xs  rounded-[10px] cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-ink" />
              <span>Restart Container</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => { stop(); })}
              disabled={isStopping}
              className="gap-2 text-xs  rounded-[10px] cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-ink" />
              <span>Stop Container</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Panels */}
        <CommandGroup heading="Panels & Views">
          <CommandItem
            onSelect={() => runCommand(() => setRightPanelTab("chat"))}
            className="gap-2 text-xs  rounded-[10px] cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-ash" />
            <span>Open AI Chat Assistant</span>
            <CommandShortcut className="text-[10px]">⌥1</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setRightPanelTab("tester"))}
            className="gap-2 text-xs  rounded-[10px] cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-ash" />
            <span>Open API Tester</span>
            <CommandShortcut className="text-[10px]">⌥2</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setRightPanelTab("console"))}
            className="gap-2 text-xs  rounded-[10px] cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-ash" />
            <span>Open Container Logs Console</span>
            <CommandShortcut className="text-[10px]">⌥3</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toggleSidebar())}
            className="gap-2 text-xs  rounded-[10px] cursor-pointer"
          >
            <FolderTree className="w-3.5 h-3.5 text-ash" />
            <span>Toggle Left Sidebar</span>
            <CommandShortcut className="text-[10px]">⌘B</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1 border-hairline" />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/dashboard"))}
            className="gap-2 text-xs  rounded-[10px] cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-ash" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate("/settings"))}
            className="gap-2 text-xs  rounded-[10px] cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-ash" />
            <span>Settings & BYOK Keys</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Command,
  LayoutDashboard,
  LogOut,
  Settings,
  FolderOpen,
  WifiOff,
} from "lucide-react";
import { Button } from "../ui/button.js";
import { ContainerControls } from "../containers/ContainerControls.js";
import { EnvironmentSelector } from "../environments/EnvironmentSelector.js";
import { ThemeToggle } from "./ThemeToggle.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.js";
import { Avatar, AvatarFallback } from "../ui/avatar.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useUIStore } from "../../stores/ui.store.js";
import { useProjects } from "../../hooks/useProject.js";
import type { Project } from "../../types/api.js";

interface TopBarProps {
  currentProject?: Project;
}

export function TopBar({ currentProject }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleCommandPalette, reconnecting } = useUIStore();
  const { projects } = useProjects();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-12 bg-paper px-10   flex items-center justify-between shrink-0 select-none [box-shadow:rgba(255,255,255,0.6)_0_0_2px_0_inset] sticky top-0 z-40">
      {/* Left side: Logo & Project Switcher */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-ink hover:opacity-85 transition-opacity"
        >

          <span className="font-normal tracking-tight text-sm text-ink">
            Forge
          </span>
        </Link>

        {currentProject && (
          <>
            <span className="text-hairline">/</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs text-ink px-2 py-1 rounded-[6px] hover:bg-bone transition-colors font-sans">
                  <span className="truncate max-w-[140px] font-normal">
                    {currentProject.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ash" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 rounded-xl border border-hairline bg-paper"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.018em] text-ash font-normal">
                  Switch Project
                </DropdownMenuLabel>
                {projects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    className="text-xs cursor-pointer text-ink font-normal"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-2 text-ash" />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-[10px] text-ash uppercase ">
                      {p.framework}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-hairline" />
                <DropdownMenuItem
                  className="text-xs cursor-pointer text-ink font-normal"
                  onClick={() => navigate("/dashboard")}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2 text-ash" />
                  All Projects
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <EnvironmentSelector projectId={currentProject.id} />
          </>
        )}
      </div>

      {/* Center: Container Controls */}
      {currentProject && (
        <div className="flex items-center justify-center">
          <ContainerControls projectId={currentProject.id} />
        </div>
      )}

      {/* Right side: Reconnecting pill, Cmd+K, Theme, User Profile */}
      <div className="flex items-center gap-2">
        {reconnecting && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px]  bg-bone text-ash text-[10px] uppercase  tracking-[0.018em]">
            <WifiOff className="w-3 h-3 animate-pulse" />
            <span>Reconnecting</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={toggleCommandPalette}
          className="h-7 text-xs border-hairline rounded-[6px] px-2 gap-1.5 text-ash hover:text-ink font-sans font-normal"
        >
          <Command className="w-3 h-3" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded-[4px]  bg-bone text-[10px] ">
            ⌘K
          </kbd>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Avatar className="w-7 h-7  rounded-[6px]">
                <AvatarFallback className="bg-bone text-ink text-[11px]  font-normal">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl border border-hairline bg-paper"
          >
            <div className="px-2 py-1.5">
              <p className="text-xs font-normal text-ink truncate">
                {user?.name || "Developer"}
              </p>
              <p className="text-[11px] text-ash truncate font-normal">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-hairline" />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-ink font-normal"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-2 text-ash" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer text-ink font-normal"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-3.5 h-3.5 mr-2 text-ash" />
              Settings & BYOK
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-hairline" />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-ink hover:text-ink focus:bg-bone font-normal"
              onClick={() => logout()}
            >
              <LogOut className="w-3.5 h-3.5 mr-2 text-ash" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

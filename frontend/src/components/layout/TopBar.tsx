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
    <header className="h-12 border-b border-hairline bg-paper dark:bg-card px-3 flex items-center justify-between shrink-0 select-none">
      {/* Left side: Logo & Project Switcher */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-ink dark:text-paper hover:opacity-80 transition-opacity"
        >
          {/* Highlighter accent mark representing Forge */}
          <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center font-bold text-ink text-xs leading-none">
            F
          </div>
          <span className="font-normal tracking-tight text-sm text-ink dark:text-paper">
            Forge
          </span>
        </Link>

        {currentProject && (
          <>
            <span className="text-hairline">/</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs text-ink dark:text-paper px-2 py-1 rounded-md hover:bg-wash dark:hover:bg-muted transition-colors font-sans">
                  <span className="truncate max-w-[140px] font-medium">
                    {currentProject.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ash" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 rounded-xl border border-hairline bg-paper dark:bg-card"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.018em] text-ash">
                  Switch Project
                </DropdownMenuLabel>
                {projects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    className="text-xs cursor-pointer text-ink dark:text-paper"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-2 text-ash" />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-[10px] text-ash uppercase">
                      {p.framework}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-hairline" />
                <DropdownMenuItem
                  className="text-xs cursor-pointer text-ink dark:text-paper"
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
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[11px]">
            <WifiOff className="w-3 h-3 animate-pulse" />
            <span>Reconnecting...</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={toggleCommandPalette}
          className="h-7 text-xs border-hairline rounded-md px-2 gap-1.5 text-ash hover:text-ink dark:hover:text-paper font-sans"
        >
          <Command className="w-3 h-3" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded border border-hairline bg-wash dark:bg-muted text-[10px]">
            ⌘K
          </kbd>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Avatar className="w-7 h-7 border border-hairline">
                <AvatarFallback className="bg-wash text-ink dark:text-paper text-[11px] font-sans">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl border border-hairline bg-paper dark:bg-card"
          >
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-ink dark:text-paper truncate">
                {user?.name || "Developer"}
              </p>
              <p className="text-[11px] text-ash truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-hairline" />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-ink dark:text-paper"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-2 text-ash" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer text-ink dark:text-paper"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-3.5 h-3.5 mr-2 text-ash" />
              Settings & BYOK
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-hairline" />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useUIStore } from "../../stores/ui.store.js";
import { ForgeAppIcon } from "../common/ForgeLogo.js";
import { getMascotAvatar, getMascotInfo } from "../../lib/mascot.js";
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

  const userSeed = user?.id || user?.email || user?.name || "forge-developer";
  const mascotUrl = getMascotAvatar(userSeed);
  const mascotInfo = getMascotInfo(userSeed);

  return (
    <header className="h-12 bg-paper px-10   flex items-center justify-between shrink-0 select-none [box-shadow:rgba(255,255,255,0.6)_0_0_2px_0_inset] sticky top-0 z-40">
      {/* Left side: Logo & Project Switcher */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-ink hover:opacity-85 transition-opacity"
        >
          <ForgeAppIcon size="sm" />
          <span className="font-normal tracking-tight text-sm text-ink">
            Forge
          </span>
        </Link>

        {currentProject && (
          <>
            <span className="text-hairline">/</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs text-ink px-2 py-1 rounded-[10px] hover:bg-bone transition-colors font-sans">
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
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[10px]  bg-bone text-ash text-[10px] uppercase  tracking-[0.018em]">
            <WifiOff className="w-3 h-3 animate-pulse" />
            <span>Reconnecting</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={toggleCommandPalette}
          className="h-7 text-xs border-hairline rounded-[10px] px-2 gap-1.5 text-ash hover:text-ink font-sans font-normal"
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
            <button
              className="flex items-center rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform active:scale-95"
              title={`${user?.name || "Developer"} (${mascotInfo.name})`}
            >
              <Avatar className="w-7 h-7 rounded-[10px] border border-hairline/60">
                <AvatarImage src={mascotUrl} alt={mascotInfo.name} />
                <AvatarFallback className="bg-bone text-ink text-[11px] font-normal">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border border-hairline bg-paper"
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <Avatar className="w-8 h-8 rounded-[6px] border border-hairline/60 shrink-0">
                <AvatarImage src={mascotUrl} alt={mascotInfo.name} />
                <AvatarFallback className="bg-bone text-ink text-xs font-normal">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink truncate">
                  {user?.name || "Developer"}
                </p>
                <p className="text-[10px] text-ash truncate font-normal">
                  {mascotInfo.name} • {user?.email || "developer@forge.dev"}
                </p>
              </div>
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

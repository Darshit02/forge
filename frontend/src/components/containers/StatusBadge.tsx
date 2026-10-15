import { cn } from "../../lib/utils.js";
import type { ProjectStatus } from "../../types/api.js";

interface StatusBadgeProps {
  status: ProjectStatus;
  port?: number | null;
  className?: string;
}

export function StatusBadge({ status, port, className }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "running":
        return {
          dotClass: "bg-emerald-500 animate-pulse",
          textClass: "text-emerald-700 dark:text-emerald-400",
          borderClass: "border-emerald-200 dark:border-emerald-900/50",
          bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
          label: port ? `Running :${port}` : "Running",
        };
      case "starting":
      case "building":
        return {
          dotClass: "bg-amber-500 animate-pulse",
          textClass: "text-amber-700 dark:text-amber-400",
          borderClass: "border-amber-200 dark:border-amber-900/50",
          bgClass: "bg-amber-50/50 dark:bg-amber-950/20",
          label: "Starting...",
        };
      case "error":
        return {
          dotClass: "bg-destructive",
          textClass: "text-destructive",
          borderClass: "border-destructive/30",
          bgClass: "bg-destructive/10",
          label: "Container Error",
        };
      case "stopped":
      default:
        return {
          dotClass: "bg-ash",
          textClass: "text-ash",
          borderClass: "border-hairline",
          bgClass: "bg-wash dark:bg-muted/40",
          label: "Stopped",
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-sans tracking-wide",
        badge.borderClass,
        badge.bgClass,
        badge.textClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", badge.dotClass)} />
      <span>{badge.label}</span>
    </div>
  );
}

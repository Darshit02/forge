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
          dotClass: "bg-primary",
          textClass: "text-ink",
          borderClass: "border-hairline",
          bgClass: "bg-bone",
          label: port ? `Running :${port}` : "Running",
        };
      case "starting":
      case "building":
        return {
          dotClass: "bg-ink animate-pulse",
          textClass: "text-ink",
          borderClass: "border-hairline",
          bgClass: "bg-bone",
          label: "Starting...",
        };
      case "error":
        return {
          dotClass: "bg-destructive",
          textClass: "text-destructive",
          borderClass: "border-hairline",
          bgClass: "bg-bone",
          label: "Container Error",
        };
      case "stopped":
      default:
        return {
          dotClass: "bg-ash/50",
          textClass: "text-ash",
          borderClass: "border-hairline",
          bgClass: "bg-bone",
          label: "Stopped",
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[10px] border text-[10px] uppercase  tracking-[0.018em] font-normal",
        badge.borderClass,
        badge.bgClass,
        badge.textClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", badge.dotClass)} />
      <span>{badge.label}</span>
    </div>
  );
}

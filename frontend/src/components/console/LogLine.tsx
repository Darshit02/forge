import { cn } from "../../lib/utils.js";

interface LogLineProps {
  line: string;
}

export function LogLine({ line }: LogLineProps) {
  const getLineStyle = () => {
    const lower = line.toLowerCase();
    if (lower.includes("error") || lower.includes("exception") || lower.includes("failed")) {
      return "text-destructive";
    }
    if (lower.includes("warn")) {
      return "text-amber-500";
    }
    if (lower.includes("info")) {
      return "text-ink dark:text-paper";
    }
    return "text-ash";
  };

  return (
    <div
      className={cn(
        "font-mono text-xs leading-5 hover:bg-wash dark:hover:bg-muted/40 px-2 py-0.5 whitespace-pre-wrap break-all select-text",
        getLineStyle()
      )}
    >
      {line}
    </div>
  );
}

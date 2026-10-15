import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils.js";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  label?: string;
}

export function LoadingSpinner({
  className,
  size = 18,
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-ash", className)}>
      <Loader2 className="animate-spin text-ink" size={size} />
      {label && <span className="text-sm font-sans font-normal">{label}</span>}
    </div>
  );
}

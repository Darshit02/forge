import React from "react";
import { cn } from "../../lib/utils.js";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-paper",
        className
      )}
    >
      {icon && <div className="mb-3 text-ash">{icon}</div>}
      <h3 className="text-base font-normal text-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-ash max-w-sm font-normal">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

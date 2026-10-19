import * as React from "react";
import { cn } from "../../lib/utils.js";

export interface ForgeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  anvilColor?: string;
  sparkColor?: string;
}

/**
 * Modern Forge brand mark — sculpted Anvil with an energetic AI Spark.
 */
export function ForgeIcon({
  size = 24,
  className,
  anvilColor = "currentColor",
  sparkColor = "#e4f222",
  ...props
}: ForgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      {/* Precision Forged Anvil Body */}
      <path
        d="M 5 12 C 7 11.5, 9 10.5, 11 10.5 H 25.5 A 1.5 1.5 0 0 1 27 12 V 13 C 25 14, 21 14.5, 20 17 V 18 C 21 21, 24 23, 26 24 A 1 1 0 0 1 25.2 25.5 H 6.8 A 1 1 0 0 1 6 24 C 8 23, 11 21, 12 18 V 17 C 11 14.5, 7 13.8, 5 12.8 A 0.5 0.5 0 0 1 5 12 Z"
        fill={anvilColor}
      />
      {/* Glowing AI Creation Spark */}
      <path
        d="M 19 2 Q 19 5.5 22.5 5.5 Q 19 5.5 19 9 Q 19 5.5 15.5 5.5 Q 19 5.5 19 2 Z"
        fill={sparkColor}
      />
      {/* Secondary micro-spark */}
      <circle cx="23.5" cy="3.5" r="0.8" fill={sparkColor} />
    </svg>
  );
}

export interface ForgeAppIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "h-7 w-7 rounded-[8px]",
    iconSize: 16,
  },
  md: {
    container: "h-9 w-9 rounded-[10px]",
    iconSize: 20,
  },
  lg: {
    container: "h-12 w-12 rounded-xl shadow-xs",
    iconSize: 26,
  },
  xl: {
    container: "h-16 w-16 rounded-2xl shadow-sm",
    iconSize: 36,
  },
};

/**
 * App Icon badge for Forge, styled in obsidian dark background with the signature highlighter yellow spark.
 */
export function ForgeAppIcon({ size = "md", className }: ForgeAppIconProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-ink text-[#f4f2f0] border border-white/10 shrink-0 select-none",
        config.container,
        className
      )}
      aria-label="Forge logo"
    >
      <ForgeIcon size={config.iconSize} anvilColor="#f4f2f0" sparkColor="#e4f222" />
    </div>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

export interface MetricItemProps {
  label: string;
  value: string;
  subValue?: string;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "danger" | "info" | "purple";
  icon?: React.ReactNode;
  accentColor?: "sky" | "emerald" | "amber" | "rose" | "purple" | "indigo";
}

export function MetricItem({
  label,
  value,
  subValue,
  badgeText,
  badgeVariant = "info",
  icon,
  accentColor = "sky",
}: MetricItemProps) {
  const accentBorders = {
    sky: "before:bg-gradient-to-r before:from-sky-500 before:to-cyan-400",
    emerald: "before:bg-gradient-to-r before:from-emerald-500 before:to-teal-400",
    amber: "before:bg-gradient-to-r before:from-amber-500 before:to-yellow-400",
    rose: "before:bg-gradient-to-r before:from-rose-500 before:to-red-400",
    purple: "before:bg-gradient-to-r before:from-purple-500 before:to-violet-400",
    indigo: "before:bg-gradient-to-r before:from-indigo-500 before:to-blue-400",
  };

  const badgeStyles = {
    success: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
    warning: "text-amber-400 bg-amber-950/60 border-amber-800/50",
    danger: "text-rose-400 bg-rose-950/60 border-rose-800/50",
    info: "text-sky-400 bg-sky-950/60 border-sky-800/50",
    purple: "text-purple-400 bg-purple-950/60 border-purple-800/50",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-800/80 bg-slate-900/90 p-4 transition-all duration-200 hover:border-slate-700/80",
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:rounded-t-xl",
        accentBorders[accentColor]
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && <span className="text-slate-400 opacity-80">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
        {badgeText && (
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              badgeStyles[badgeVariant]
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subValue && (
        <p className="mt-1.5 text-xs text-slate-400 truncate">
          {subValue}
        </p>
      )}
    </div>
  );
}

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
  badgeVariant = "success",
  icon,
  accentColor = "sky",
}: MetricItemProps) {
  const badgeStyles = {
    success: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
    warning: "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
    danger: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800",
    info: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800",
    purple: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800",
  };

  const accentBars = {
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
  };

  const iconContainers = {
    sky: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/60",
    emerald: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60",
    amber: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60",
    rose: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60",
    purple: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/60",
    indigo: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-5",
        "shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
      )}
    >
      {/* Top clean accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", accentBars[accentColor])} />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </span>
          {icon && (
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs", iconContainers[accentColor])}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {value}
          </span>
          {badgeText && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs",
                badgeStyles[badgeVariant]
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {subValue && (
        <p className="mt-3 pt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 truncate">
          {subValue}
        </p>
      )}
    </div>
  );
}

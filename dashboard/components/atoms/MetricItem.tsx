import React from "react";
import { cn } from "@/lib/utils";

export interface MetricItemProps {
  label: string;
  value: string;
  subValue?: string;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "danger" | "info" | "purple";
  icon?: React.ReactNode;
  accentColor?: "green" | "emerald" | "amber" | "rose" | "purple" | "sky";
}

export function MetricItem({
  label,
  value,
  subValue,
  badgeText,
  badgeVariant = "success",
  icon,
  accentColor = "green",
}: MetricItemProps) {
  const badgeStyles = {
    success: "text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700/60",
    warning: "text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700/60",
    danger: "text-rose-800 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700/60",
    info: "text-sky-800 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-950/80 border-sky-300 dark:border-sky-700/60",
    purple: "text-purple-800 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700/60",
  };

  const iconGradients = {
    green: "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/20",
    emerald: "bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-emerald-600/20",
    amber: "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-amber-500/20",
    rose: "bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-rose-500/20",
    purple: "bg-gradient-to-tr from-purple-500 to-indigo-400 text-white shadow-purple-500/20",
    sky: "bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-sky-500/20",
  };

  return (
    <div className="clay-card relative p-5 flex flex-col justify-between overflow-hidden">
      {/* Top subtle decorative strip */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 opacity-80" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-200/70">
            {label}
          </span>
          {icon && (
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shadow-md",
                iconGradients[accentColor]
              )}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50 font-mono">
            {value}
          </span>
          {badgeText && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm",
                badgeStyles[badgeVariant]
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {subValue && (
        <p className="mt-3 pt-2 text-xs text-emerald-800/60 dark:text-emerald-300/60 border-t border-emerald-100/80 dark:border-emerald-900/40 truncate">
          {subValue}
        </p>
      )}
    </div>
  );
}

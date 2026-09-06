import React from "react";
import { cn } from "@/lib/utils";

export interface MetricItemProps {
  label: string;
  value: string;
  subValue?: string;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "danger" | "info" | "purple";
  icon?: React.ReactNode;
  accentColor?: "sky" | "emerald" | "amber" | "rose" | "purple" | "indigo" | "teal";
  valueColor?: "emerald" | "amber" | "rose" | "sky" | "indigo" | "purple" | "teal" | "default";
}

export function MetricItem({
  label,
  value,
  subValue,
  badgeText,
  badgeVariant = "success",
  icon,
  accentColor = "teal",
  valueColor,
}: MetricItemProps) {
  const badgeStyles = {
    success:
      "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    warning:
      "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    danger:
      "text-[var(--color-error)] bg-[var(--color-error-container)] border-[var(--color-error)]/20",
    info:
      "text-[var(--color-on-secondary-container)] bg-[var(--color-secondary-container)] border-[var(--color-secondary)]/20",
    purple:
      "text-[var(--color-on-tertiary-container)] bg-[var(--color-tertiary-container)] border-[var(--color-tertiary)]/20",
  };

  const textColors = {
    default: "text-[var(--color-on-surface)]",
    teal: "text-[var(--color-primary)]",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-[var(--color-error)]",
    sky: "text-sky-600 dark:text-sky-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    purple: "text-[var(--color-tertiary)]",
  };

  const resolvedValueColor = valueColor
    ? textColors[valueColor]
    : accentColor === "emerald"
    ? textColors.emerald
    : accentColor === "rose"
    ? textColors.rose
    : accentColor === "amber"
    ? textColors.amber
    : accentColor === "teal"
    ? textColors.teal
    : textColors.default;

  return (
    <div
      className={cn(
        "clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)]",
        "flex flex-col justify-between transition-all duration-200 hover:-translate-y-1"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
            {label}
          </span>
          {icon && (
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center text-sm shadow-2xs">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap mt-1">
          <span className={cn("text-2xl lg:text-3xl font-black tracking-tight", resolvedValueColor)}>
            {value}
          </span>
          {badgeText && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-full)] border shadow-2xs",
                badgeStyles[badgeVariant]
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {subValue && (
        <p className="mt-3 pt-2 text-xs text-[var(--color-on-surface-variant)] border-t border-[var(--color-surface-variant)] truncate">
          {subValue}
        </p>
      )}
    </div>
  );
}

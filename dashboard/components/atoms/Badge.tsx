import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] border-[var(--color-outline)]/20",
    primary:
      "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)]/20",
    success:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    danger:
      "bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border-[var(--color-error)]/20",
    info:
      "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border-[var(--color-secondary)]/20",
    purple:
      "bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] border-[var(--color-tertiary)]/20",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-0.5",
    md: "text-xs px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-[var(--radius-full)] border shadow-xs transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

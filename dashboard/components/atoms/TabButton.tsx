import React from "react";
import { cn } from "@/lib/utils";

export interface TabButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  icon?: React.ReactNode;
  badgeCount?: number;
}

export function TabButton({
  active,
  icon,
  badgeCount,
  children,
  className,
  ...props
}: TabButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-[var(--radius-full)] text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap select-none",
        active
          ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-semibold shadow-xs"
          : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-on-surface)]",
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      <span>{children}</span>
      {typeof badgeCount === "number" && (
        <span
          className={cn(
            "ml-1 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold",
            active
              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
              : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]"
          )}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}

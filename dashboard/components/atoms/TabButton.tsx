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
        "relative flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wide rounded-2xl transition-all duration-200 cursor-pointer whitespace-nowrap",
        active
          ? "bg-emerald-600 text-white shadow-[0_6px_16px_rgba(16,185,129,0.35),inset_1px_1px_2px_rgba(255,255,255,0.4)] border-2 border-emerald-400/40 transform -translate-y-0.5"
          : "bg-white/80 dark:bg-emerald-950/40 text-emerald-900/80 dark:text-emerald-200/80 hover:bg-white dark:hover:bg-emerald-900/60 shadow-[3px_3px_8px_rgba(16,76,52,0.06),-2px_-2px_6px_#ffffff] dark:shadow-none border-2 border-emerald-100 dark:border-emerald-800/40",
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span>{children}</span>
      {typeof badgeCount === "number" && (
        <span
          className={cn(
            "ml-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold",
            active
              ? "bg-white/25 text-white"
              : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300"
          )}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}

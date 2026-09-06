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
        "relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide rounded-xl transition-all duration-150 cursor-pointer whitespace-nowrap select-none",
        active
          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50",
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      <span>{children}</span>
      {typeof badgeCount === "number" && (
        <span
          className={cn(
            "ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
            active
              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
          )}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}

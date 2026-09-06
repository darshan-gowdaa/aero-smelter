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
        "relative flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap",
        active
          ? "text-sky-400 border-b-2 border-sky-400 bg-sky-950/20"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-b-2 border-transparent",
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span>{children}</span>
      {typeof badgeCount === "number" && (
        <span
          className={cn(
            "ml-1 text-[10px] px-1.5 py-0.2 rounded-full",
            active
              ? "bg-sky-500/20 text-sky-300 font-mono"
              : "bg-slate-800 text-slate-400 font-mono"
          )}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}

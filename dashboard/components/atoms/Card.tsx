import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "blue" | "emerald" | "amber" | "rose" | "purple";
  noPadding?: boolean;
}

export function Card({
  className,
  glow = "none",
  noPadding = false,
  children,
  ...props
}: CardProps) {
  const glowStyles = {
    none: "border-slate-800/80 bg-slate-900/90",
    blue: "border-sky-800/40 bg-slate-900/90 shadow-[0_0_15px_-3px_rgba(56,189,248,0.1)]",
    emerald: "border-emerald-800/40 bg-slate-900/90 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]",
    amber: "border-amber-800/40 bg-slate-900/90 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]",
    rose: "border-rose-800/40 bg-slate-900/90 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]",
    purple: "border-purple-800/40 bg-slate-900/90 shadow-[0_0_15px_-3px_rgba(168,85,247,0.1)]",
  };

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-md transition-all duration-200",
        glowStyles[glow],
        !noPadding && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between gap-2 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold tracking-wide text-slate-200 uppercase flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-400 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

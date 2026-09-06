import React from "react";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  badgeVariant = "info",
  icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 mb-5", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              {title}
            </h2>
            {badge && <Badge variant={badgeVariant} size="sm">{badge}</Badge>}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

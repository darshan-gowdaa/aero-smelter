import React from "react";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "purple";
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
          <div className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border border-[var(--color-primary)]/20 shadow-2xs">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--color-on-surface)] tracking-tight">
              {title}
            </h2>
            {badge && <Badge variant={badgeVariant} size="sm">{badge}</Badge>}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

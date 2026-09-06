import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({
  className,
  noPadding = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "clay rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-surface-variant)]",
        "transition-all duration-200",
        !noPadding && "p-6 sm:p-7",
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
    <div className={cn("flex flex-wrap items-center justify-between gap-3 mb-5", className)} {...props}>
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
        "text-base font-bold tracking-tight text-[var(--color-on-surface)] flex items-center gap-2.5",
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
    <p className={cn("text-xs text-[var(--color-on-surface-variant)] font-normal mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

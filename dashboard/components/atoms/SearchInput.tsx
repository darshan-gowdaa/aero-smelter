import React from "react";
import { RiSearchLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({ className, value, onChange, placeholder = "Search...", ...props }: SearchInputProps) {
  return (
    <div className="relative flex items-center w-full max-w-xs">
      <RiSearchLine className="absolute left-3.5 w-4 h-4 text-[var(--color-on-surface-variant)] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 pl-10 pr-3.5 rounded-[var(--radius-full)] border border-[var(--color-outline)]/30 bg-[var(--color-surface)] text-xs text-[var(--color-on-surface)]",
          "placeholder:text-[var(--color-on-surface-variant)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
          "shadow-2xs transition-all duration-150",
          className
        )}
        {...props}
      />
    </div>
  );
}

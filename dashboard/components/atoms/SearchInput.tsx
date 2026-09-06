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
      <RiSearchLine className="absolute left-3.5 w-4 h-4 text-emerald-600/60 dark:text-emerald-400/60 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 pl-10 pr-3.5 rounded-2xl border-2 border-emerald-200/80 dark:border-emerald-800/60 bg-white dark:bg-emerald-950/60 text-xs text-emerald-950 dark:text-emerald-100",
          "placeholder:text-emerald-800/40 dark:placeholder:text-emerald-400/40 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20",
          "shadow-[inset_2px_2px_5px_rgba(16,76,52,0.06)] transition-all duration-200",
          className
        )}
        {...props}
      />
    </div>
  );
}

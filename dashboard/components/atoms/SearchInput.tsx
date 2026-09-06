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
      <RiSearchLine className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100",
          "placeholder:text-slate-400 focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20",
          "shadow-2xs transition-all duration-150",
          className
        )}
        {...props}
      />
    </div>
  );
}

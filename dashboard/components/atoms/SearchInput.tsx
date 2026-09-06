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
      <RiSearchLine className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200",
          "placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500",
          "transition-all duration-150",
          className
        )}
        {...props}
      />
    </div>
  );
}

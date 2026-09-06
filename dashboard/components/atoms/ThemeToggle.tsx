"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-[var(--radius-full)] bg-[var(--color-surface-variant)] animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 rounded-[var(--radius-full)] border border-[var(--color-outline)]/30 
                 bg-[var(--color-surface-variant)]/30 text-[var(--color-on-surface-variant)]
                 hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-on-surface)]
                 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden"
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${
          isDark ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <i className="ri-moon-clear-fill text-[17px]"></i>
      </div>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${
          isDark ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <i className="ri-sun-fill text-[17px]"></i>
      </div>
    </button>
  );
}

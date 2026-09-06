"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useTheme() {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return {
    theme: (resolvedTheme as "light" | "dark") || "light",
    isDark,
    toggleTheme,
    setTheme: (t: "light" | "dark") => setTheme(t),
  };
}

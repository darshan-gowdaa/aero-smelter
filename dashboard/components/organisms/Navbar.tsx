"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/atoms/Badge";
import { useTheme } from "@/lib/theme";
import {
  RiFlightTakeoffLine,
  RiCheckDoubleLine,
  RiTimeLine,
  RiDatabase2Line,
  RiSunLine,
  RiMoonLine,
} from "@remixicon/react";

export function Navbar() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "medium",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-emerald-100/80 dark:border-emerald-900/50 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-md transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 border-2 border-white/50">
            <RiFlightTakeoffLine className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-emerald-950 dark:text-emerald-50 tracking-tight">
                ASG Airlines
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 font-bold tracking-wide">
                FLIGHT OPS
              </span>
            </div>
            <p className="text-xs text-emerald-800/60 dark:text-emerald-300/60 font-medium">
              Claymorphism Emerald Analytics Suite • Star Schema Gold Layer
            </p>
          </div>
        </div>

        {/* Status Badges + Theme Switcher */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle Switch Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="clay-btn relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-900 dark:text-emerald-100 border-2 border-emerald-200/80 dark:border-emerald-700/50 transition-all cursor-pointer select-none"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              {theme === "light" ? (
                <RiSunLine className="w-3.5 h-3.5 text-amber-100" />
              ) : (
                <RiMoonLine className="w-3.5 h-3.5 text-emerald-100" />
              )}
            </div>
            <span className="hidden sm:inline capitalize">
              {theme === "light" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <Badge variant="success" size="md" className="hidden md:inline-flex">
            <RiCheckDoubleLine className="w-4 h-4" />
            <span>Pipeline: 1.02s</span>
          </Badge>

          <Badge variant="default" size="md" className="hidden lg:inline-flex">
            <RiDatabase2Line className="w-4 h-4" />
            <span>18 Gold Tables</span>
          </Badge>

          {currentTime && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800/80 dark:text-emerald-200/80 font-mono bg-emerald-50 dark:bg-emerald-900/50 px-3 py-1.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50">
              <RiTimeLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

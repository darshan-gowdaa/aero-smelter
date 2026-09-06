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
  const { theme, isDark, toggleTheme } = useTheme();

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
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-sm">
            <RiFlightTakeoffLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                ASG Airlines
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono font-bold tracking-wider uppercase">
                Flight Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Executive Power BI & Medallion Star Schema Analytics Suite
            </p>
          </div>
        </div>

        {/* Controls and Status */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle Switch Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer select-none shadow-2xs"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          >
            {isDark ? (
              <>
                <RiSunLine className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <RiMoonLine className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          <Badge variant="success" size="md" className="hidden md:inline-flex">
            <RiCheckDoubleLine className="w-4 h-4" />
            <span>Pipeline: 1.02s</span>
          </Badge>

          <Badge variant="info" size="md" className="hidden lg:inline-flex">
            <RiDatabase2Line className="w-4 h-4" />
            <span>18 Gold Tables</span>
          </Badge>

          {currentTime && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <RiTimeLine className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

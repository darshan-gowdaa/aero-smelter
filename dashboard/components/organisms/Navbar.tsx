"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/atoms/Badge";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import {
  RiCheckDoubleLine,
  RiDatabase2Line,
  RiTimeLine,
  RiCloudLine,
} from "@remixicon/react";

export function Navbar() {
  const [currentTime, setCurrentTime] = useState<string>("");

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
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] border-b border-[var(--color-surface-variant)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)] font-bold text-lg leading-none select-none group-hover:scale-105 transition-transform shadow-sm">
            ✈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-on-surface)] text-lg tracking-tight">
                ASG<span className="text-[var(--color-primary)]">Airlines</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-mono font-bold tracking-wider uppercase">
                Ops Lakehouse
              </span>
            </div>
          </div>
        </div>

        {/* Controls and Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Badge variant="primary" size="sm" className="hidden md:inline-flex">
            <RiCloudLine className="w-3.5 h-3.5" />
            <span>Azure Medallion</span>
          </Badge>

          <Badge variant="success" size="sm" className="hidden sm:inline-flex">
            <RiCheckDoubleLine className="w-3.5 h-3.5" />
            <span>Pipeline: 1.02s</span>
          </Badge>

          <Badge variant="purple" size="sm" className="hidden lg:inline-flex">
            <RiDatabase2Line className="w-3.5 h-3.5" />
            <span>18 Gold Tables</span>
          </Badge>

          {currentTime && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)] font-mono bg-[var(--color-surface-variant)]/40 px-3 py-1.5 rounded-[var(--radius-full)] border border-[var(--color-outline)]/20">
              <RiTimeLine className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>{currentTime}</span>
            </div>
          )}

          <div className="w-px h-6 bg-[var(--color-outline)] opacity-30 mx-1 hidden sm:block shrink-0"></div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

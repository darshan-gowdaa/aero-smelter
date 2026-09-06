"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/atoms/Badge";
import {
  RiFlightTakeoffLine,
  RiCheckDoubleLine,
  RiTimeLine,
  RiDatabase2Line,
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
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-950/50">
            <RiFlightTakeoffLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                ASG Airlines
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/50 font-mono font-semibold">
                FLIGHT OPS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Executive Power BI & Medallion Star Schema Analytics Suite
            </p>
          </div>
        </div>

        {/* Operational Status Badges */}
        <div className="flex items-center gap-3">
          <Badge variant="success" size="md">
            <RiCheckDoubleLine className="w-4 h-4" />
            <span>Pipeline: 1.02s (100% Valid)</span>
          </Badge>

          <Badge variant="info" size="md">
            <RiDatabase2Line className="w-4 h-4" />
            <span>Gold Layer: 18 Tables</span>
          </Badge>

          {currentTime && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
              <RiTimeLine className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

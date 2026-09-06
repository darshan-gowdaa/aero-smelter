import React from "react";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { RiAlertLine, RiMoonLine } from "@remixicon/react";

export function OvernightAuditCard() {
  return (
    <Card className="border-2 border-amber-200/80 dark:border-amber-800/40 bg-white dark:bg-emerald-950/60">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 border-2 border-amber-200 dark:border-amber-700/50 shadow-md">
            <RiMoonLine className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-950 dark:text-emerald-50 text-base">
              Overnight Anomaly Repair: Flight SJ192 (HYD → BOM)
            </h4>
            <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70 font-medium">
              Cross-midnight timestamp mismatch rectified via automated date-boundary compensation
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          Fixed & Validated
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
        <div className="bg-emerald-50/70 dark:bg-emerald-900/30 p-3.5 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50">
          <span className="text-[10px] uppercase font-bold text-emerald-800/70 dark:text-emerald-300/70 block mb-1">
            Raw Departure
          </span>
          <span className="font-mono text-xs font-bold text-emerald-950 dark:text-emerald-100">
            2026-04-19 18:45:42
          </span>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/40 p-3.5 rounded-2xl border-2 border-rose-200 dark:border-rose-800/60 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block mb-1">
            Raw Arrival (Corrupt -1 Day)
          </span>
          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-300">
            2026-04-18 23:45:42
          </span>
        </div>

        <div className="bg-emerald-100/70 dark:bg-emerald-900/50 p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700/60 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
            Repaired Arrival (+1 Day)
          </span>
          <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
            2026-04-20 23:45:42
          </span>
        </div>

        <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3.5 rounded-2xl border-2 border-teal-200 dark:border-teal-800/60 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block mb-1">
            Corrected Duration
          </span>
          <span className="font-mono text-xs font-extrabold text-teal-700 dark:text-teal-300">
            300.0 min (5.00 hrs)
          </span>
        </div>
      </div>

      <div className="text-xs text-emerald-900 dark:text-emerald-200 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
        <RiAlertLine className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-900 dark:text-amber-300 font-bold">Engineering Action: </strong>
          Identified arrival earlier than departure caused by midnight date rollover in operational logs. 
          Applied <code className="bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-amber-200">arrival_time += timedelta(days=1)</code>. 
          Duration corrected from negative to valid 300 minutes. 
          Flagged with <code className="bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-emerald-200">is_overnight = true</code> and 
          <code className="bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-emerald-200">is_duration_outlier = true</code> in Gold star schema.
        </div>
      </div>
    </Card>
  );
}

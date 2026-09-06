import React from "react";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { RiAlertLine, RiMoonLine } from "@remixicon/react";

export function OvernightAuditCard() {
  return (
    <Card className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <RiMoonLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Overnight Anomaly Repair: Flight SJ192 (HYD → BOM)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cross-midnight timestamp mismatch rectified via automated date-boundary compensation
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          Fixed & Validated
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
            Raw Departure
          </span>
          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
            2026-04-19 18:45:42
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-1">
            Raw Arrival (Corrupt -1 Day)
          </span>
          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
            2026-04-18 23:45:42
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
            Repaired Arrival (+1 Day)
          </span>
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            2026-04-20 23:45:42
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-sky-200 dark:border-sky-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block mb-1">
            Corrected Duration
          </span>
          <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
            300.0 min (5.00 hrs)
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-start gap-2.5">
        <RiAlertLine className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-800 dark:text-amber-300 font-semibold">Engineering Action: </strong>
          Identified arrival earlier than departure caused by midnight date rollover in operational logs. 
          Applied <code className="bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded font-mono text-[11px]">arrival_time += timedelta(days=1)</code>. 
          Duration corrected from negative to valid 300 minutes. 
          Flagged with <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded font-mono text-[11px]">is_overnight = true</code> and 
          <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded font-mono text-[11px]">is_duration_outlier = true</code> in Gold star schema.
        </div>
      </div>
    </Card>
  );
}

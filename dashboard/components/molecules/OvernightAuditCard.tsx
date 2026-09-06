import React from "react";
import { Badge } from "@/components/atoms/Badge";
import { RiAlertLine, RiMoonLine } from "@remixicon/react";

export function OvernightAuditCard() {
  return (
    <div className="clay p-6 sm:p-7 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] border border-amber-300/60 dark:border-amber-900/60">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[var(--radius-md)] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <RiMoonLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--color-on-surface)] text-sm">
              Overnight Anomaly Repair: Flight SJ192 (HYD → BOM)
            </h4>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Cross-midnight timestamp mismatch rectified via automated date-boundary compensation
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          Fixed & Validated
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[var(--color-on-surface-variant)] block mb-1">
            Raw Departure
          </span>
          <span className="font-mono text-xs font-semibold text-[var(--color-on-surface)]">
            2026-04-19 18:45:42
          </span>
        </div>

        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-error)]/30 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[var(--color-error)] block mb-1">
            Raw Arrival (Corrupt -1 Day)
          </span>
          <span className="font-mono text-xs font-bold text-[var(--color-error)]">
            2026-04-18 23:45:42
          </span>
        </div>

        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-emerald-300 dark:border-emerald-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
            Repaired Arrival (+1 Day)
          </span>
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            2026-04-20 23:45:42
          </span>
        </div>

        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[var(--color-primary)] block mb-1">
            Corrected Duration
          </span>
          <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
            300.0 min (5.00 hrs)
          </span>
        </div>
      </div>

      <div className="text-xs text-[var(--color-on-surface)] bg-[var(--color-surface)] border border-amber-300 dark:border-amber-900/60 rounded-[var(--radius-md)] p-3.5 flex items-start gap-2.5">
        <RiAlertLine className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-800 dark:text-amber-300 font-semibold">Engineering Action: </strong>
          Identified arrival earlier than departure caused by midnight date rollover in operational logs. 
          Applied <code className="bg-[var(--color-surface-variant)] text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded-[var(--radius-xs)] font-mono text-[11px]">arrival_time += timedelta(days=1)</code>. 
          Duration corrected from negative to valid 300 minutes. 
          Flagged with <code className="bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] px-1 py-0.5 rounded-[var(--radius-xs)] font-mono text-[11px]">is_overnight = true</code> and 
          <code className="bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] px-1 py-0.5 rounded-[var(--radius-xs)] font-mono text-[11px]">is_duration_outlier = true</code> in Gold star schema.
        </div>
      </div>
    </div>
  );
}

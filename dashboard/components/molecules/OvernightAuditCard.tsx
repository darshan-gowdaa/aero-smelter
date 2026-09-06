import React from "react";
import { Badge } from "@/components/atoms/Badge";
import { RiAlertLine, RiMoonLine, RiArrowRightLine } from "@remixicon/react";

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
            1. Raw Departure
          </span>
          <span className="font-mono text-xs font-semibold text-[var(--color-on-surface)]">
            2026-04-19 18:45:42
          </span>
          <span className="text-[10px] text-[var(--color-on-surface-variant)] block mt-0.5">
            Hyderabad (HYD)
          </span>
        </div>

        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-error)]/30 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[var(--color-error)] block mb-1">
            2. Raw Operational Log (Glitch)
          </span>
          <span className="font-mono text-xs font-bold text-[var(--color-error)]">
            -1,370.0 min (-22.8 hrs)
          </span>
          <span className="text-[10px] text-[var(--color-error)]/80 block mt-0.5">
            Naive midnight subtraction
          </span>
        </div>

        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-amber-300 dark:border-amber-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mb-1">
            3. Automated Pipeline Fix
          </span>
          <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
            +1,440 min (+24h Rollover)
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
            Modulo date boundary check
          </span>
        </div>

        <div className="bg-[var(--color-surface)] p-3.5 rounded-[var(--radius-lg)] border border-emerald-300 dark:border-emerald-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
            4. True Operational Duration
          </span>
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            300.0 min (5.00 hrs)
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
            Mumbai (BOM) arrival
          </span>
        </div>
      </div>

      {/* Visual Waterfall Progression Bar */}
      <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-surface-variant)] my-3">
        <span className="text-[10px] uppercase font-bold text-[var(--color-on-surface-variant)] block mb-2">
          Timestamp Compensation Timeline:
        </span>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 p-2 rounded-[var(--radius-sm)] border border-red-300 dark:border-red-900 text-center">
            <span className="block font-bold">Corrupt Duration</span>
            <span className="font-mono text-[11px]">-1,370 min</span>
          </div>
          <RiArrowRightLine className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
          <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 p-2 rounded-[var(--radius-sm)] border border-amber-300 dark:border-amber-900 text-center">
            <span className="block font-bold">+24h Adjustment</span>
            <span className="font-mono text-[11px]">+1,440 min</span>
          </div>
          <RiArrowRightLine className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
          <div className="flex-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 p-2 rounded-[var(--radius-sm)] border border-emerald-300 dark:border-emerald-900 text-center">
            <span className="block font-bold">Repaired Flight Time</span>
            <span className="font-mono text-[11px]">+300 min (5.0h)</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-[var(--color-on-surface)] bg-[var(--color-surface)] border border-amber-300 dark:border-amber-900/60 rounded-[var(--radius-md)] p-3.5 flex items-start gap-2.5">
        <RiAlertLine className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-800 dark:text-amber-300 font-semibold">Operational Analysis: </strong>
          Flight departed Hyderabad in the evening and arrived Mumbai late at night crossing midnight. 
          The data engineering pipeline automatically repaired the ticket from negative time to valid 300 minutes. 
          Because HYD→BOM typically takes ~155 minutes, this 5-hour duration represents a genuine operational delay 
          (holding pattern or tarmac congestion), flagged for airline operations review.
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { RiAlertLine, RiCheckLine, RiMoonLine } from "@remixicon/react";

export function OvernightAuditCard() {
  return (
    <Card glow="amber" className="border-amber-900/40">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/40">
            <RiMoonLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">
              Overnight Anomaly Repair: Flight SJ192 (HYD → BOM)
            </h4>
            <p className="text-xs text-slate-400">
              Cross-midnight timestamp mismatch rectified via automated date-boundary compensation
            </p>
          </div>
        </div>
        <Badge variant="warning" size="sm">Fixed & Logged</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
            Raw Departure
          </span>
          <span className="font-mono text-xs text-slate-200">
            2026-04-19 18:45:42
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-rose-900/50">
          <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-1">
            Raw Arrival (Corrupt -1 Day)
          </span>
          <span className="font-mono text-xs text-rose-400">
            2026-04-18 23:45:42
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-900/50">
          <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-1">
            Repaired Arrival (+1 Day)
          </span>
          <span className="font-mono text-xs text-emerald-400">
            2026-04-20 23:45:42
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-sky-900/50">
          <span className="text-[10px] uppercase font-semibold text-sky-400 block mb-1">
            Corrected Duration
          </span>
          <span className="font-mono text-xs text-sky-300 font-bold">
            300.0 min (5.00 hrs)
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-300 bg-amber-950/20 border border-amber-900/30 rounded-lg p-3 flex items-start gap-2">
        <RiAlertLine className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold">Engineering Action: </strong>
          Identified arrival earlier than departure caused by midnight date rollover in operational logs. 
          Applied <code className="bg-slate-900 text-amber-300 px-1 py-0.5 rounded font-mono text-[11px]">arrival_time += timedelta(days=1)</code>. 
          Duration corrected from negative to valid 300 minutes. 
          Flagged with <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono text-[11px]">is_overnight = true</code> and 
          <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono text-[11px]">is_duration_outlier = true</code> in Gold star schema.
        </div>
      </div>
    </Card>
  );
}

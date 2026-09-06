import React from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface AirlineScorecardProps {
  airlineName: string;
  airlineCode: string;
  flightCount: number;
  marketSharePct: number;
  avgDurationMin: number;
  minDurationMin: number;
  maxDurationMin: number;
  revenue: number;
  avgFare: number;
  accentColor: string;
}

export function AirlineScorecard({
  airlineName,
  airlineCode,
  flightCount,
  marketSharePct,
  avgDurationMin,
  minDurationMin,
  maxDurationMin,
  revenue,
  avgFare,
  accentColor,
}: AirlineScorecardProps) {
  return (
    <div className="clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] relative overflow-hidden transition-all duration-200 hover:-translate-y-1">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between mb-4 mt-1">
        <div>
          <h4 className="font-bold text-[var(--color-on-surface)] text-sm tracking-tight">{airlineName}</h4>
          <span className="font-mono text-[10px] font-bold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-variant)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--color-outline)]/20 mt-1 inline-block">
            {airlineCode}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl font-black font-mono text-[var(--color-on-surface)]">
            {marketSharePct.toFixed(1)}%
          </span>
          <p className="text-[10px] text-[var(--color-on-surface-variant)] font-semibold uppercase tracking-wider">
            Market Share
          </p>
        </div>
      </div>

      <div className="space-y-2.5 text-xs border-t border-[var(--color-surface-variant)] pt-3">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-on-surface-variant)]">Total Flights</span>
          <span className="font-mono font-semibold text-[var(--color-on-surface)]">{formatNumber(flightCount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-on-surface-variant)]">Avg Duration</span>
          <span className="font-mono font-semibold text-[var(--color-on-surface)]">{avgDurationMin.toFixed(1)} min</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-on-surface-variant)]">Range (Min - Max)</span>
          <span className="font-mono text-[var(--color-on-surface-variant)]">
            {minDurationMin}m - {maxDurationMin}m
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-on-surface-variant)]">Attributed Revenue</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(revenue)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-on-surface-variant)]">Avg Fare / Booking</span>
          <span className="font-mono font-semibold text-[var(--color-on-surface)]">{formatCurrency(avgFare)}</span>
        </div>
      </div>
    </div>
  );
}

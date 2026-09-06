import React from "react";
import { Card } from "@/components/atoms/Card";
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
    <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{airlineName}</h4>
          <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 mt-1 inline-block">
            {airlineCode}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {marketSharePct.toFixed(1)}%
          </span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
            Market Share
          </p>
        </div>
      </div>

      <div className="space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Total Flights</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatNumber(flightCount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Avg Duration</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{avgDurationMin.toFixed(1)} min</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Range (Min - Max)</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {minDurationMin}m - {maxDurationMin}m
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Attributed Revenue</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(revenue)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Avg Fare / Booking</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(avgFare)}</span>
        </div>
      </div>
    </Card>
  );
}

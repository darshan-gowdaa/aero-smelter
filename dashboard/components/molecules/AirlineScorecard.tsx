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
    <Card className="relative overflow-hidden border-2 border-emerald-100/90 dark:border-emerald-800/50">
      {/* Top soft accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-extrabold text-emerald-950 dark:text-emerald-100 text-sm">{airlineName}</h4>
          <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-700/60 mt-1 inline-block">
            {airlineCode}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl font-extrabold font-mono text-emerald-950 dark:text-emerald-100">
            {marketSharePct.toFixed(1)}%
          </span>
          <p className="text-[10px] text-emerald-800/60 dark:text-emerald-300/60 font-semibold uppercase">
            Market Share
          </p>
        </div>
      </div>

      <div className="space-y-2.5 text-xs border-t border-emerald-100 dark:border-emerald-900/60 pt-3">
        <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
          <span className="text-emerald-800/70 dark:text-emerald-300/70 font-medium">Total Flights</span>
          <span className="font-mono font-bold">{formatNumber(flightCount)}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
          <span className="text-emerald-800/70 dark:text-emerald-300/70 font-medium">Avg Duration</span>
          <span className="font-mono font-bold">{avgDurationMin.toFixed(1)} min</span>
        </div>
        <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
          <span className="text-emerald-800/70 dark:text-emerald-300/70 font-medium">Flight Range</span>
          <span className="font-mono font-medium text-emerald-700 dark:text-emerald-300">
            {minDurationMin}m - {maxDurationMin}m
          </span>
        </div>
        <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
          <span className="text-emerald-800/70 dark:text-emerald-300/70 font-medium">Attributed Revenue</span>
          <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(revenue)}
          </span>
        </div>
        <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
          <span className="text-emerald-800/70 dark:text-emerald-300/70 font-medium">Avg Fare</span>
          <span className="font-mono font-bold">{formatCurrency(avgFare)}</span>
        </div>
      </div>
    </Card>
  );
}

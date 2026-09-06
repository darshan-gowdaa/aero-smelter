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
    <Card className="relative overflow-hidden border-slate-800">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-100 text-sm">{airlineName}</h4>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {airlineCode}
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold font-mono text-white">
            {marketSharePct.toFixed(1)}%
          </span>
          <p className="text-[10px] text-slate-400">Market Share</p>
        </div>
      </div>

      <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Total Flights</span>
          <span className="font-mono font-medium">{formatNumber(flightCount)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Avg Duration</span>
          <span className="font-mono font-medium">{avgDurationMin.toFixed(1)} min</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Range (Min - Max)</span>
          <span className="font-mono font-medium">{minDurationMin} - {maxDurationMin} min</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Attributed Revenue</span>
          <span className="font-mono font-semibold text-emerald-400">
            {formatCurrency(revenue)}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Avg Fare / Booking</span>
          <span className="font-mono font-medium">{formatCurrency(avgFare)}</span>
        </div>
      </div>
    </Card>
  );
}

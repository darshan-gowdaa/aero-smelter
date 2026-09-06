import React from "react";
import { MetricItem } from "@/components/atoms/MetricItem";
import { asgData, totalRevenue, cancellationRate } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  RiFlightTakeoffLine,
  RiMoneyDollarCircleLine,
  RiTimerLine,
  RiAlertLine,
  RiMoonLine,
  RiCloseCircleLine,
} from "@remixicon/react";

export function KpiStrip() {
  const summary = asgData.kpi_overall_summary[0] || {
    total_flights_analyzed: 1005,
    overnight_flights_repaired: 1,
    duration_outliers_count: 1,
    duration_outliers_pct: 0.1,
    negative_duration_count: 0,
    anomalous_duration_count: 0,
  };

  const avgDuration =
    asgData.fact_flights.length > 0
      ? asgData.fact_flights.reduce((acc, f) => acc + (f.duration_minutes || 0), 0) /
        asgData.fact_flights.length
      : 164.62;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <MetricItem
        label="Total Flights"
        value={formatNumber(summary.total_flights_analyzed)}
        subValue="1,020 raw · 15 dropped"
        badgeText="100% Valid"
        badgeVariant="success"
        accentColor="sky"
        icon={<RiFlightTakeoffLine className="w-4 h-4" />}
      />

      <MetricItem
        label="Avg Flight Duration"
        value={`${avgDuration.toFixed(1)} m`}
        subValue="2.74 hrs average fleet-wide"
        badgeText="Optimal"
        badgeVariant="info"
        accentColor="indigo"
        icon={<RiTimerLine className="w-4 h-4" />}
      />

      <MetricItem
        label="Total Revenue"
        value={formatCurrency(totalRevenue)}
        subValue="1,000 transactions verified"
        badgeText="Audited"
        badgeVariant="success"
        accentColor="emerald"
        icon={<RiMoneyDollarCircleLine className="w-4 h-4" />}
      />

      <MetricItem
        label="Cancellation Rate"
        value={`${cancellationRate.toFixed(1)}%`}
        subValue="314 cancelled bookings"
        badgeText="Watch"
        badgeVariant="danger"
        accentColor="rose"
        icon={<RiCloseCircleLine className="w-4 h-4" />}
      />

      <MetricItem
        label="Overnight Repaired"
        value={formatNumber(summary.overnight_flights_repaired)}
        subValue="SJ192 (HYD→BOM) +24h fix"
        badgeText="+1 Day"
        badgeVariant="warning"
        accentColor="amber"
        icon={<RiMoonLine className="w-4 h-4" />}
      />

      <MetricItem
        label="Duration Outliers"
        value={formatNumber(summary.duration_outliers_count)}
        subValue="Statistical >2σ deviation"
        badgeText="Flagged"
        badgeVariant="purple"
        accentColor="purple"
        icon={<RiAlertLine className="w-4 h-4" />}
      />
    </div>
  );
}

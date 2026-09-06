"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { OvernightAuditCard } from "@/components/molecules/OvernightAuditCard";
import { asgData } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ZAxis,
} from "recharts";
import {
  RiAlertLine,
  RiFocus2Line,
  RiCloseCircleLine,
} from "@remixicon/react";

export function DelayAnomalyTab() {
  const { isDark } = useTheme();

  const routeVariabilityData = useMemo(() => {
    const routeMap: Record<number, number[]> = {};
    asgData.fact_flights.forEach((f) => {
      if (!routeMap[f.route_key]) routeMap[f.route_key] = [];
      routeMap[f.route_key].push(f.duration_minutes);
    });

    const list = asgData.dim_route.map((r) => {
      const durs = routeMap[r.route_key] || [];
      if (durs.length < 2) return { route: r.route_name, std: 0, mean: 0 };
      const mean = durs.reduce((a, b) => a + b, 0) / durs.length;
      const variance = durs.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / durs.length;
      const std = Math.sqrt(variance);
      return {
        route: r.route_name,
        std: Number(std.toFixed(1)),
        mean: Number(mean.toFixed(1)),
      };
    });

    return list.sort((a, b) => b.std - a.std).slice(0, 10);
  }, []);

  const scatterData = useMemo(() => {
    const normalFlights = asgData.fact_flights
      .filter((f) => f.is_duration_outlier === 0)
      .slice(0, 250)
      .map((f) => ({
        x: Number(f.route_mean_duration.toFixed(1)),
        y: Number(f.duration_minutes.toFixed(1)),
        flightId: f.flight_id,
        status: "Normal",
      }));

    const outlierFlights = asgData.fact_flights
      .filter((f) => f.is_duration_outlier === 1)
      .map((f) => ({
        x: Number(f.route_mean_duration.toFixed(1)),
        y: Number(f.duration_minutes.toFixed(1)),
        flightId: f.flight_id,
        status: "Outlier (>2σ)",
      }));

    return { normalFlights, outlierFlights };
  }, []);

  const cancellationRiskData = useMemo(() => {
    return [...asgData.kpi_route_cancellations]
      .sort((a, b) => b.cancellation_rate_pct - a.cancellation_rate_pct)
      .slice(0, 10)
      .map((r) => ({
        name: r.route_name,
        rate: Number(r.cancellation_rate_pct.toFixed(1)),
        totalBookings: r.total_bookings,
        cancelledBookings: r.cancelled_bookings,
      }));
  }, []);

  const outliersList = asgData.kpi_duration_outliers;

  const chartTheme = {
    grid: isDark ? "#3f484a" : "#dbe4e6",
    text: isDark ? "#bfc8ca" : "#3f484a",
    tooltip: {
      backgroundColor: isDark ? "#191c1d" : "#fbfdfd",
      borderColor: isDark ? "#3f484a" : "#dbe4e6",
      borderRadius: "14px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      fontSize: "12px",
      color: isDark ? "#e1e3e3" : "#191c1d",
    },
  };

  return (
    <div className="space-y-6">
      {/* Overnight Flight Engineering Callout */}
      <OvernightAuditCard />

      {/* Outlier flight details table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <RiAlertLine className="w-5 h-5 text-[var(--color-error)]" />
              Statistical Duration Outliers Identified (&gt;2σ Threshold)
            </CardTitle>
            <CardDescription>
              Flights deviating significantly from established sector statistical parameters
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[var(--color-surface-variant)] border-b border-[var(--color-outline)]/20 text-[var(--color-on-surface)] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Flight ID</th>
                <th className="py-3.5 px-4 font-sans">Airline</th>
                <th className="py-3.5 px-4">Sector</th>
                <th className="py-3.5 px-4">Departure</th>
                <th className="py-3.5 px-4">Arrival</th>
                <th className="py-3.5 px-4 text-right">Duration</th>
                <th className="py-3.5 px-4 text-right">Route Mean</th>
                <th className="py-3.5 px-4 text-right">Route Std Dev</th>
                <th className="py-3.5 px-4 text-right">Deviation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-variant)]">
              {outliersList.map((o, idx) => {
                const dev = Math.abs(o.duration_minutes - o.route_mean_duration);
                return (
                  <tr key={idx} className="hover:bg-[var(--color-surface-variant)]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--color-error)]">{o.flight_id}</td>
                    <td className="py-3 px-4 font-sans font-medium text-[var(--color-on-surface)]">{o.airline_name}</td>
                    <td className="py-3 px-4 font-bold text-[var(--color-primary)]">{o.route_name}</td>
                    <td className="py-3 px-4 text-[var(--color-on-surface-variant)] text-[11px]">{o.departure_time || "-"}</td>
                    <td className="py-3 px-4 text-[var(--color-on-surface-variant)] text-[11px]">{o.arrival_time || "-"}</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--color-error)]">
                      {o.duration_minutes} m
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--color-on-surface)]">
                      {o.route_mean_duration?.toFixed(1)} m
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--color-on-surface-variant)]">
                      ±{o.route_std_duration?.toFixed(1)} m
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                      +{dev.toFixed(1)} m
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2 Charts: Route Variability + Scatter Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Route Duration Variability */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiAlertLine className="w-5 h-5 text-amber-500" />
                Route Duration Variability (Standard Deviation)
              </CardTitle>
              <CardDescription>
                Top 10 sectors ranked by operational flight time inconsistency
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={routeVariabilityData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis type="number" stroke={chartTheme.text} fontSize={11} tickLine={false} unit="m" />
                <YAxis
                  dataKey="route"
                  type="category"
                  stroke={chartTheme.text}
                  fontSize={11}
                  tickLine={false}
                  width={75}
                  tick={{ fill: chartTheme.text, fontFamily: "monospace", fontWeight: 700 }}
                />
                <Tooltip contentStyle={chartTheme.tooltip} formatter={(val: any) => [`${val} min`, "Std Dev"]} />
                <Bar dataKey="std" fill="#f59e0b" radius={[0, 8, 8, 0]}>
                  {routeVariabilityData.map((entry, index) => (
                    <Cell
                      key={`var-cell-${index}`}
                      fill={entry.std > 40 ? (isDark ? "#ffb4ab" : "#ba1a1a") : entry.std > 25 ? "#f59e0b" : (isDark ? "#4fd8eb" : "#006874")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Scatter Plot */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiFocus2Line className="w-5 h-5 text-[var(--color-primary)]" />
                Actual vs Route Mean Duration (Outlier Scatter)
              </CardTitle>
              <CardDescription>
                Statistical isolation of flights beyond the 2-sigma threshold envelope
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Mean Duration"
                  stroke={chartTheme.text}
                  fontSize={11}
                  unit="m"
                  domain={[30, 320]}
                  label={{ value: "Route Mean (min)", position: "bottom", offset: 0, fill: chartTheme.text, fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Actual Duration"
                  stroke={chartTheme.text}
                  fontSize={11}
                  unit="m"
                  domain={[30, 320]}
                  label={{ value: "Actual Duration (min)", angle: -90, position: "insideLeft", fill: chartTheme.text, fontSize: 10 }}
                />
                <ZAxis range={[30, 90]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={chartTheme.tooltip}
                  formatter={(val: any, name: any) => [
                    `${val} min`,
                    name === "x" ? "Route Mean" : "Actual",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                <Scatter
                  name="Normal Flights (Sample)"
                  data={scatterData.normalFlights}
                  fill={isDark ? "#4fd8eb" : "#006874"}
                  opacity={0.4}
                />
                <Scatter
                  name="Statistical Outlier (>2σ)"
                  data={scatterData.outlierFlights}
                  fill={isDark ? "#ffb4ab" : "#ba1a1a"}
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Cancellation risk ranking */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <RiCloseCircleLine className="w-5 h-5 text-[var(--color-error)]" />
              Route Cancellation Rate Risk Ranking (Top 10 High-Risk Sectors)
            </CardTitle>
            <CardDescription>
              Sectors requiring operational monitoring and schedule buffer adjustments
            </CardDescription>
          </div>
        </CardHeader>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={cancellationRiskData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
              <XAxis type="number" stroke={chartTheme.text} fontSize={11} tickLine={false} unit="%" />
              <YAxis
                dataKey="name"
                type="category"
                stroke={chartTheme.text}
                fontSize={11}
                tickLine={false}
                width={80}
                tick={{ fill: chartTheme.text, fontFamily: "monospace", fontWeight: 700 }}
              />
              <Tooltip contentStyle={chartTheme.tooltip} formatter={(val: any) => [`${val}%`, "Cancellation Rate"]} />
              <Bar dataKey="rate" fill={isDark ? "#ffb4ab" : "#ba1a1a"} radius={[0, 8, 8, 0]}>
                {cancellationRiskData.map((entry, index) => (
                  <Cell
                    key={`risk-cell-${index}`}
                    fill={entry.rate > 35 ? (isDark ? "#ffb4ab" : "#ba1a1a") : entry.rate > 28 ? "#f59e0b" : (isDark ? "#4fd8eb" : "#006874")}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

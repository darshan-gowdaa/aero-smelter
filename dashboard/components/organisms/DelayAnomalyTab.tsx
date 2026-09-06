"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { OvernightAuditCard } from "@/components/molecules/OvernightAuditCard";
import { asgData } from "@/lib/data";
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
  RiTableLine,
} from "@remixicon/react";

export function DelayAnomalyTab() {
  const routeVariabilityData = useMemo(() => {
    // Calculate route std dev and mean duration
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
      .slice(0, 250) // Sample for snappy performance
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

  return (
    <div className="space-y-6">
      {/* Overnight Flight Engineering Callout */}
      <OvernightAuditCard />

      {/* Outlier flight details table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <RiAlertLine className="w-4 h-4 text-rose-400" />
              Statistical Duration Outliers Identified (&gt;2σ Threshold)
            </CardTitle>
            <CardDescription>
              Flights deviating significantly from established sector statistical parameters
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-950/95 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Flight ID</th>
                <th className="py-3 px-4">Airline</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">Departure</th>
                <th className="py-3 px-4">Arrival</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4 text-right">Route Mean</th>
                <th className="py-3 px-4 text-right">Route Std Dev</th>
                <th className="py-3 px-4 text-right">Deviation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {outliersList.map((o, idx) => {
                const dev = Math.abs(o.duration_minutes - o.route_mean_duration);
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-rose-400">{o.flight_id}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-200">{o.airline_name}</td>
                    <td className="py-2.5 px-4 text-sky-400">{o.route_name}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">{o.departure_time || "-"}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">{o.arrival_time || "-"}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-400">
                      {o.duration_minutes} m
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-300">
                      {o.route_mean_duration?.toFixed(1)} m
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400">
                      ±{o.route_std_duration?.toFixed(1)} m
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-400">
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
                <RiAlertLine className="w-4 h-4 text-amber-400" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} unit="m" />
                <YAxis
                  dataKey="route"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  width={75}
                  tick={{ fill: "#cbd5e1", fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val: any) => [`${val} min`, "Std Dev"]}
                />
                <Bar dataKey="std" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                  {routeVariabilityData.map((entry, index) => (
                    <Cell
                      key={`var-cell-${index}`}
                      fill={entry.std > 40 ? "#f43f5e" : entry.std > 25 ? "#f59e0b" : "#0284c7"}
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
                <RiFocus2Line className="w-4 h-4 text-sky-400" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Mean Duration"
                  stroke="#94a3b8"
                  fontSize={11}
                  unit="m"
                  domain={[30, 320]}
                  label={{ value: "Route Mean (min)", position: "bottom", offset: 0, fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Actual Duration"
                  stroke="#94a3b8"
                  fontSize={11}
                  unit="m"
                  domain={[30, 320]}
                  label={{ value: "Actual Duration (min)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10 }}
                />
                <ZAxis range={[20, 80]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} min`,
                    name === "x" ? "Route Mean" : "Actual",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                <Scatter
                  name="Normal Flights (Sample)"
                  data={scatterData.normalFlights}
                  fill="#38bdf8"
                  opacity={0.4}
                />
                <Scatter
                  name="Statistical Outlier (>2σ)"
                  data={scatterData.outlierFlights}
                  fill="#f43f5e"
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
              <RiCloseCircleLine className="w-4 h-4 text-rose-400" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={80}
                tick={{ fill: "#cbd5e1", fontFamily: "monospace" }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                formatter={(val: any) => [`${val}%`, "Cancellation Rate"]}
              />
              <Bar dataKey="rate" fill="#f43f5e" radius={[0, 4, 4, 0]}>
                {cancellationRiskData.map((entry, index) => (
                  <Cell
                    key={`risk-cell-${index}`}
                    fill={entry.rate > 35 ? "#f43f5e" : entry.rate > 28 ? "#f59e0b" : "#0284c7"}
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

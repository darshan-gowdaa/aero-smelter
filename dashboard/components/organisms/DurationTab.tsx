"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { SearchInput } from "@/components/atoms/SearchInput";
import { asgData } from "@/lib/data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import { RiTimerLine, RiBarChartGroupedLine, RiTimeLine, RiTableLine } from "@remixicon/react";

export function DurationTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const airlineDurationData = useMemo(() => {
    return asgData.kpi_airline_duration.map((item) => ({
      name: item.airline_name.replace("Air India", "Air India").split(" ")[0],
      fullName: item.airline_name,
      code: item.airline_code,
      Min: item.min_duration_min,
      Avg: Number(item.avg_duration_min.toFixed(1)),
      Max: item.max_duration_min,
    }));
  }, []);

  const topRoutesByDuration = useMemo(() => {
    return [...asgData.kpi_route_duration]
      .sort((a, b) => b.avg_duration_min - a.avg_duration_min)
      .slice(0, 10)
      .map((r) => ({
        name: r.route_name,
        fullName: r.route_full_name,
        avgDuration: Number(r.avg_duration_min.toFixed(1)),
        minDuration: r.min_duration_min,
        maxDuration: r.max_duration_min,
      }));
  }, []);

  const hourlyData = useMemo(() => {
    return [...asgData.kpi_hourly_traffic]
      .sort((a, b) => a.departure_hour - b.departure_hour)
      .map((h) => ({
        hour: `${String(h.departure_hour).padStart(2, "0")}:00`,
        flights: h.flights_count,
      }));
  }, []);

  const durationHistogram = useMemo(() => {
    const bins = 10;
    const min = 30;
    const max = 300;
    const step = (max - min) / bins;
    const counts = Array(bins).fill(0);

    asgData.fact_flights.forEach((f) => {
      const dur = f.duration_minutes;
      if (dur != null) {
        const binIdx = Math.min(Math.floor((dur - min) / step), bins - 1);
        if (binIdx >= 0) counts[binIdx]++;
      }
    });

    return counts.map((count, i) => ({
      range: `${Math.round(min + i * step)}-${Math.round(min + (i + 1) * step)}m`,
      flights: count,
    }));
  }, []);

  const filteredRoutes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return asgData.kpi_route_duration.filter(
      (r) =>
        r.route_name.toLowerCase().includes(term) ||
        r.route_full_name.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const maxHourlyFlights = Math.max(...hourlyData.map((d) => d.flights));

  const tooltipStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    border: "2px solid #A7F3D0",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15)",
    fontSize: "12px",
    color: "#065F46",
    fontWeight: 600,
  };

  return (
    <div className="space-y-6">
      {/* Top 2 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Airline duration profile */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiBarChartGroupedLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Airline Duration Profile (Min / Avg / Max)
              </CardTitle>
              <CardDescription>
                Comparison of minimum, average, and maximum flight duration per carrier
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={airlineDurationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
                <XAxis dataKey="name" stroke="#059669" fontSize={12} tickLine={false} />
                <YAxis stroke="#059669" fontSize={12} tickLine={false} unit="m" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="Min" fill="#34D399" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Avg" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Max" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top 10 routes by duration */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiTimerLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Top 10 Routes by Average Flight Duration
              </CardTitle>
              <CardDescription>
                Longest domestic sectors identified across national route network
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topRoutesByDuration}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
                <XAxis type="number" stroke="#059669" fontSize={12} tickLine={false} unit="m" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#059669"
                  fontSize={11}
                  tickLine={false}
                  width={80}
                  tick={{ fill: "#065F46", fontFamily: "monospace", fontWeight: 700 }}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val} min`, "Avg Duration"]} />
                <Bar dataKey="avgDuration" fill="#10B981" radius={[0, 8, 8, 0]}>
                  {topRoutesByDuration.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#F59E0B" : "#10B981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Hourly traffic + Duration distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly traffic */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div>
              <CardTitle>
                <RiTimeLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                24-Hour Flight Departure Traffic Heatmap
              </CardTitle>
              <CardDescription>
                Flight schedule intensity across departure hours (Peak at 15:00-18:00 IST)
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
                <XAxis dataKey="hour" stroke="#059669" fontSize={11} tickLine={false} />
                <YAxis stroke="#059669" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val} flights`, "Volume"]} />
                <Bar dataKey="flights" radius={[6, 6, 0, 0]}>
                  {hourlyData.map((entry, index) => {
                    const intensity = entry.flights / maxHourlyFlights;
                    const fill =
                      intensity > 0.85
                        ? "#F59E0B"
                        : intensity > 0.5
                        ? "#10B981"
                        : "#6EE7B7";
                    return <Cell key={`cell-hour-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Duration distribution histogram */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div>
              <CardTitle>
                <RiTimerLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Duration Frequency (Histogram)
              </CardTitle>
              <CardDescription>
                Distribution frequency across 10 duration brackets
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationHistogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
                <XAxis dataKey="range" stroke="#059669" fontSize={10} tickLine={false} angle={-25} textAnchor="end" height={40} />
                <YAxis stroke="#059669" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="flights" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 30-route table with search */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <RiTableLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Comprehensive Route Flight Duration Master (All 30 Routes)
            </CardTitle>
            <CardDescription>
              Filtered view of route frequencies, minimum/maximum parameters, and duration spread
            </CardDescription>
          </div>
          <SearchInput
            placeholder="Search route or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>

        <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-emerald-50 dark:bg-emerald-900/90 border-b-2 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Full Route Name</th>
                <th className="py-3.5 px-4 text-right">Flights</th>
                <th className="py-3.5 px-4 text-right">Avg Duration</th>
                <th className="py-3.5 px-4 text-right">Min Duration</th>
                <th className="py-3.5 px-4 text-right">Max Duration</th>
                <th className="py-3.5 px-4 text-right">Spread</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/40 font-mono">
              {filteredRoutes.map((r, i) => {
                const spread = r.max_duration_min - r.min_duration_min;
                return (
                  <tr key={i} className="hover:bg-emerald-50/60 dark:hover:bg-emerald-900/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-300">{r.route_name}</td>
                    <td className="py-3 px-4 font-sans font-medium text-emerald-950 dark:text-emerald-100">{r.route_full_name}</td>
                    <td className="py-3 px-4 text-right text-emerald-900 dark:text-emerald-200">{r.flight_count}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 font-bold">
                      {r.avg_duration_min.toFixed(1)} m
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800/70 dark:text-emerald-300/70">{r.min_duration_min} m</td>
                    <td className="py-3 px-4 text-right text-emerald-800/70 dark:text-emerald-300/70">{r.max_duration_min} m</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          spread > 150
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : spread > 80
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {spread} m
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { asgData, totalRevenue } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  RiMoneyDollarCircleLine,
  RiPieChart2Line,
  RiStackLine,
  RiUserFollowLine,
  RiTableLine,
} from "@remixicon/react";

const ROUTE_DISTINCT_COLORS = [
  "#006874",
  "#4fd8eb",
  "#4a6267",
  "#97f0ff",
  "#525e7d",
  "#dae2ff",
  "#f59e0b",
  "#ba1a1a",
];

const AGE_DISTINCT_COLORS: Record<string, string> = {
  "Youth (<18)": "#4fd8eb",
  "Young Adult (18-35)": "#006874",
  "Adult (36-50)": "#10b981",
  "Senior (51-65)": "#f59e0b",
  "Elderly (>65)": "#525e7d",
};

export function RoutePerformanceTab() {
  const { isDark } = useTheme();

  const top10RevenueRoutes = useMemo(() => {
    return [...asgData.kpi_route_revenue]
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10)
      .map((r) => ({
        name: r.route_name,
        fullName: r.route_full_name,
        revenueK: Math.round(r.total_revenue / 1000),
        totalRevenue: r.total_revenue,
        avgFare: r.avg_fare,
        transactions: r.total_transactions,
      }));
  }, []);

  const trafficShareData = useMemo(() => {
    const sorted = [...asgData.kpi_route_traffic].sort((a, b) => b.total_flights - a.total_flights);
    const top6 = sorted.slice(0, 6);
    const othersCount = sorted.slice(6).reduce((acc, cur) => acc + cur.total_flights, 0);

    const res = top6.map((r) => ({
      name: r.route_name,
      flights: r.total_flights,
    }));
    if (othersCount > 0) {
      res.push({ name: "Others (24 Routes)", flights: othersCount });
    }
    return res;
  }, []);

  const cancellationStackedData = useMemo(() => {
    return [...asgData.kpi_route_cancellations]
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 12)
      .map((r) => ({
        name: r.route_name,
        Confirmed: r.confirmed_bookings,
        Cancelled: r.cancelled_bookings,
        Pending: r.pending_bookings,
        cancellationRate: r.cancellation_rate_pct,
      }));
  }, []);

  const ageBandStackedData = useMemo(() => {
    const top5Routes = [...asgData.kpi_route_traffic]
      .sort((a, b) => b.total_flights - a.total_flights)
      .slice(0, 5)
      .map((r) => r.route_name);

    return top5Routes.map((routeName) => {
      const row: any = { routeName };
      asgData.kpi_age_band_by_route
        .filter((a) => a.route_name === routeName)
        .forEach((a) => {
          row[a.age_band] = a.passenger_count;
        });
      return row;
    });
  }, []);

  const maxRevenueVal = top10RevenueRoutes[0]?.totalRevenue || 1;

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
      {/* Top 2 charts: Revenue + Traffic Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue ranking */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>
                <RiMoneyDollarCircleLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Top 10 Routes by Total Revenue (INR Thousands)
              </CardTitle>
              <CardDescription>
                Financial yield across high-demand domestic corridors
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-[var(--radius-full)] border border-emerald-300 dark:border-emerald-800">
              Total: {formatCurrency(totalRevenue)}
            </span>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={top10RevenueRoutes}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis type="number" stroke={chartTheme.text} fontSize={11} tickLine={false} unit="K" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={chartTheme.text}
                  fontSize={11}
                  tickLine={false}
                  width={80}
                  tick={{ fill: chartTheme.text, fontFamily: "monospace", fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                  formatter={(val: any) => [`₹${(Number(val) * 1000).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Bar dataKey="revenueK" fill={isDark ? "#4fd8eb" : "#006874"} radius={[0, 8, 8, 0]}>
                  {top10RevenueRoutes.map((_, index) => (
                    <Cell
                      key={`rev-cell-${index}`}
                      fill={index === 0 ? "#10b981" : index < 3 ? (isDark ? "#4fd8eb" : "#006874") : (isDark ? "#004f58" : "#4a6267")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Traffic Share Donut */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>
                <RiPieChart2Line className="w-5 h-5 text-[var(--color-primary)]" />
                Route Traffic Share
              </CardTitle>
              <CardDescription>
                Proportion of flights operated on primary trunk routes
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficShareData}
                  dataKey="flights"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {trafficShareData.map((_, index) => (
                    <Cell
                      key={`pie-cell-${index}`}
                      fill={ROUTE_DISTINCT_COLORS[index % ROUTE_DISTINCT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                  formatter={(val: any) => [`${val} flights`, "Traffic"]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Booking Status Stacked + Age Band Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking status breakdown */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>
                <RiStackLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Booking Status Breakdown by Route (Top 12)
              </CardTitle>
              <CardDescription>
                Confirmed, cancelled, and pending reservations per sector
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cancellationStackedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis dataKey="name" stroke={chartTheme.text} fontSize={10} tickLine={false} angle={-25} textAnchor="end" height={35} />
                <YAxis stroke={chartTheme.text} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "4px" }} />
                <Bar dataKey="Confirmed" stackId="a" fill="#10b981" />
                <Bar dataKey="Cancelled" stackId="a" fill={isDark ? "#ffb4ab" : "#ba1a1a"} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Age Band Demographics */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>
                <RiUserFollowLine className="w-5 h-5 text-[var(--color-tertiary)]" />
                Passenger Age Band Demographics (Top 5 Routes)
              </CardTitle>
              <CardDescription>
                Segment distribution across top volume corridors
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageBandStackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis dataKey="routeName" stroke={chartTheme.text} fontSize={11} tickLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
                {Object.keys(AGE_DISTINCT_COLORS).map((band) => (
                  <Bar key={band} dataKey={band} stackId="age" fill={AGE_DISTINCT_COLORS[band]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Revenue table detail */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <RiTableLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Route Revenue Intelligence Scorecard
            </CardTitle>
            <CardDescription>
              Detailed transactional metrics, average fares, and percentage yield per destination
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="sticky top-0 bg-[var(--color-surface-variant)] border-b border-[var(--color-outline)]/20 text-[var(--color-on-surface)] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 font-sans">Full Sector</th>
                <th className="py-3 px-4 text-right">Transactions</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Avg Fare</th>
                <th className="py-3 px-4">Yield Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-variant)]">
              {top10RevenueRoutes.map((r, i) => {
                const pct = (r.totalRevenue / maxRevenueVal) * 100;
                return (
                  <tr key={i} className="hover:bg-[var(--color-surface-variant)]/40 transition-colors">
                    <td className="py-3 px-4 text-[var(--color-on-surface-variant)]">{i + 1}</td>
                    <td className="py-3 px-4 font-bold text-[var(--color-primary)]">{r.name}</td>
                    <td className="py-3 px-4 font-sans text-[var(--color-on-surface)] font-medium">{r.fullName}</td>
                    <td className="py-3 px-4 text-right text-[var(--color-on-surface-variant)]">{r.transactions}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--color-on-surface-variant)]">
                      {formatCurrency(r.avgFare)}
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="w-full bg-[var(--color-surface-variant)] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
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

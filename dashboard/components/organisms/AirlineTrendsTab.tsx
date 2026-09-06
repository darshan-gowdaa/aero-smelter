"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { AirlineScorecard } from "@/components/molecules/AirlineScorecard";
import { asgData } from "@/lib/data";
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
  ComposedChart,
  Line,
} from "recharts";
import {
  RiFlightLandLine,
  RiBankCardLine,
  RiPieChartLine,
  RiBarChart2Line,
  RiDashboardLine,
} from "@remixicon/react";

// Real-world carrier colors: IndiGo (Sky Blue), Air India (Red), SpiceJet (Orange), Vistara (Purple)
const CARRIER_COLORS: Record<string, string> = {
  "6F": "#0284C7",
  "6E": "#0284C7",
  "AI": "#DC2626",
  "SJ": "#EA580C",
  "UK": "#7C3AED",
};

export function AirlineTrendsTab() {
  const { isDark } = useTheme();

  const airlineRevenueMap = useMemo(() => {
    const map: Record<number, { revenue: number; count: number }> = {};
    asgData.fact_payments.forEach((p) => {
      const k = p.airline_key;
      if (!map[k]) map[k] = { revenue: 0, count: 0 };
      map[k].revenue += p.amount || 0;
      map[k].count++;
    });
    return map;
  }, []);

  const airlineData = useMemo(() => {
    return asgData.dim_airline.map((al) => {
      const dist = asgData.kpi_airline_distribution.find((d) => d.airline_code === al.airline_code);
      const dur = asgData.kpi_airline_duration.find((d) => d.airline_code === al.airline_code);
      const revInfo = airlineRevenueMap[al.airline_key] || { revenue: 0, count: 0 };
      const avgFare = revInfo.count > 0 ? revInfo.revenue / revInfo.count : 0;

      return {
        key: al.airline_key,
        name: al.airline_name,
        code: al.airline_code,
        shortName: al.airline_name.split(" ")[0],
        flights: dist?.total_flights || 0,
        sharePct: dist?.share_pct || 0,
        avgDuration: dur?.avg_duration_min || 0,
        minDuration: dur?.min_duration_min || 0,
        maxDuration: dur?.max_duration_min || 0,
        revenue: revInfo.revenue,
        avgFare: avgFare,
        revenueK: Math.round(revInfo.revenue / 1000),
        color: CARRIER_COLORS[al.airline_code] || "#0284C7",
      };
    }).sort((a, b) => b.flights - a.flights);
  }, [airlineRevenueMap]);

  const paymentMethodData = useMemo(() => {
    return asgData.kpi_fare_by_payment_method.map((p) => ({
      method: p.payment_method,
      transactions: p.transaction_count,
      avgAmount: Math.round(p.avg_amount),
      totalRevenueK: Math.round(p.total_amount / 1000),
    }));
  }, []);

  const chartTheme = {
    grid: isDark ? "#334155" : "#E2E8F0",
    text: isDark ? "#94A3B8" : "#475569",
    tooltip: {
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      borderColor: isDark ? "#334155" : "#CBD5E1",
      borderRadius: "12px",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
      fontSize: "12px",
      color: isDark ? "#F8FAFC" : "#0F172A",
    },
  };

  return (
    <div className="space-y-6">
      {/* 4 Airline Scorecards */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          <RiDashboardLine className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Carrier Fleet Operational Performance Scorecards
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {airlineData.map((al) => (
            <AirlineScorecard
              key={al.code}
              airlineName={al.name}
              airlineCode={al.code}
              flightCount={al.flights}
              marketSharePct={al.sharePct}
              avgDurationMin={al.avgDuration}
              minDurationMin={al.minDuration}
              maxDurationMin={al.maxDuration}
              revenue={al.revenue}
              avgFare={al.avgFare}
              accentColor={al.color}
            />
          ))}
        </div>
      </div>

      {/* Market Share Donut + Airline Revenue Composed Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fleet Market Share Donut */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div>
              <CardTitle>
                <RiPieChartLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Fleet Market Share (By Flights)
              </CardTitle>
              <CardDescription>
                Proportion of 1,005 valid flight departures per carrier
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={airlineData}
                  dataKey="flights"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {airlineData.map((al) => (
                    <Cell key={al.code} fill={al.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} flights (${item.payload.sharePct}%)`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue & Avg Fare Composed Chart */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div>
              <CardTitle>
                <RiBarChart2Line className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Revenue & Average Fare by Airline (Bar + Line)
              </CardTitle>
              <CardDescription>
                Gross revenue generation alongside average booking ticket size
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={airlineData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis dataKey="shortName" stroke={chartTheme.text} fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke={chartTheme.text}
                  fontSize={11}
                  tickLine={false}
                  unit="K"
                  label={{ value: "Revenue (INR K)", angle: -90, position: "insideLeft", fill: chartTheme.text, fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F59E0B"
                  fontSize={11}
                  tickLine={false}
                  unit="₹"
                  label={{ value: "Avg Fare", angle: 90, position: "insideRight", fill: "#F59E0B", fontSize: 10 }}
                />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar yAxisId="left" dataKey="revenueK" name="Total Revenue (INR K)" radius={[4, 4, 0, 0]}>
                  {airlineData.map((entry) => (
                    <Cell key={`bar-${entry.code}`} fill={entry.color} />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgFare"
                  name="Avg Fare (INR)"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#F59E0B" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Payment Method Analysis & Carrier Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Methods */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiBankCardLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Payment Method — Transaction Volume & Value
              </CardTitle>
              <CardDescription>
                Transaction breakdown across UPI, Card, and Netbanking rails
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis dataKey="method" stroke={chartTheme.text} fontSize={11} tickLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="transactions" name="Transactions Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalRevenueK" name="Revenue (INR K)" fill="#0284C7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carrier efficiency overview */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiFlightLandLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Carrier Duration & Operating Efficiency Summary
              </CardTitle>
              <CardDescription>
                Turnaround and sector duration benchmarks per operator
              </CardDescription>
            </div>
          </CardHeader>
          <div className="p-2 space-y-4">
            {airlineData.map((al) => (
              <div key={al.code} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: al.color }} />
                    <span className="font-bold text-slate-900 dark:text-white">{al.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">({al.code})</span>
                  </div>
                  <div className="font-mono text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">{al.avgDuration.toFixed(1)} m</span> avg
                    <span className="text-slate-500 ml-2">({al.minDuration}m - {al.maxDuration}m)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${(al.avgDuration / 300) * 100}%`,
                      backgroundColor: al.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
              * Note: SpiceJet (SJ) maximum duration includes Flight SJ192 (HYD → BOM), which was repaired from overnight date mismatch to 300.0 minutes.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

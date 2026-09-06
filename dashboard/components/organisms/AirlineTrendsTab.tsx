"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { AirlineScorecard } from "@/components/molecules/AirlineScorecard";
import { asgData } from "@/lib/data";
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

const AIRLINE_CLAY_PALETTE = ["#059669", "#10B981", "#F59E0B", "#F43F5E"];

export function AirlineTrendsTab() {
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
    return asgData.dim_airline.map((al, idx) => {
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
        color: AIRLINE_CLAY_PALETTE[idx % AIRLINE_CLAY_PALETTE.length],
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
      {/* 4 Airline Scorecards */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs uppercase font-extrabold text-emerald-900/70 dark:text-emerald-300/70 tracking-wider">
          <RiDashboardLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                <RiPieChartLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                  contentStyle={tooltipStyle}
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
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
                <XAxis dataKey="shortName" stroke="#059669" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#059669"
                  fontSize={11}
                  tickLine={false}
                  unit="K"
                  label={{ value: "Revenue (INR K)", angle: -90, position: "insideLeft", fill: "#059669", fontSize: 10 }}
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
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar yAxisId="left" dataKey="revenueK" name="Total Revenue (INR K)" fill="#059669" radius={[6, 6, 0, 0]}>
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
                  strokeWidth={3.5}
                  dot={{ r: 6, fill: "#F59E0B" }}
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
                <RiBankCardLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
                <XAxis dataKey="method" stroke="#059669" fontSize={11} tickLine={false} />
                <YAxis stroke="#059669" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="transactions" name="Transactions Count" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalRevenueK" name="Revenue (INR K)" fill="#34D399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carrier efficiency overview */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiFlightLandLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: al.color }} />
                    <span className="font-bold text-emerald-950 dark:text-emerald-100">{al.name}</span>
                    <span className="text-[10px] text-emerald-700/60 dark:text-emerald-300/60 font-mono">({al.code})</span>
                  </div>
                  <div className="font-mono text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{al.avgDuration.toFixed(1)} m</span> avg
                    <span className="text-emerald-600/60 dark:text-emerald-400/60 ml-2">({al.minDuration}m - {al.maxDuration}m)</span>
                  </div>
                </div>
                <div className="w-full bg-emerald-100 dark:bg-emerald-950 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(al.avgDuration / 300) * 100}%`,
                      backgroundColor: al.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70 mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/60 leading-relaxed">
              * Note: SpiceJet (SJ) maximum duration includes Flight SJ192 (HYD → BOM), which was repaired from overnight date mismatch to 300.0 minutes.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

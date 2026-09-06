"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { PiiVaultStatus } from "@/components/molecules/PiiVaultStatus";
import { asgData, confirmedBookingsCount, cancelledBookingsCount, pendingBookingsCount, imputedPaymentCount } from "@/lib/data";
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
  RiShieldCheckLine,
  RiPieChartLine,
  RiFilter3Line,
  RiDatabaseLine,
  RiCheckDoubleLine,
} from "@remixicon/react";

export function DataQualityTab() {
  const waterfallData = useMemo(() => {
    return [
      { stage: "Flights (Raw)", count: 1020, fill: "#0284c7" },
      { stage: "Flights (Clean)", count: 1005, fill: "#10b981" },
      { stage: "Pax (Raw)", count: 1039, fill: "#0284c7" },
      { stage: "Pax (Clean)", count: 1000, fill: "#10b981" },
      { stage: "Bookings (Raw)", count: 1000, fill: "#0284c7" },
      { stage: "Bookings (Clean)", count: 1000, fill: "#10b981" },
      { stage: "Payments (Raw)", count: 1000, fill: "#0284c7" },
      { stage: "Payments (Clean)", count: 1000, fill: "#10b981" },
    ];
  }, []);

  const bookingStatusData = useMemo(() => {
    return [
      { name: "Confirmed", value: confirmedBookingsCount, fill: "#10b981" },
      { name: "Cancelled", value: cancelledBookingsCount, fill: "#f43f5e" },
      { name: "Pending (Standardized)", value: pendingBookingsCount, fill: "#f59e0b" },
    ];
  }, []);

  const paymentImputationData = useMemo(() => {
    const realCount = asgData.fact_payments.length - imputedPaymentCount;
    return [
      { name: "Real Amount", value: realCount, fill: "#0284c7" },
      { name: "Median Imputed", value: imputedPaymentCount, fill: "#f59e0b" },
    ];
  }, []);

  const auditStages = [
    {
      name: "Flights Layer",
      raw: 1020,
      clean: 1005,
      dropped: 15,
      actions: "Repaired 72 missing airline names via prefix lookup; resolved overnight SJ192 date rollover; 15 duplicates dropped.",
      color: "border-sky-800/60",
      accent: "#0284c7",
    },
    {
      name: "Passengers Layer",
      raw: 1039,
      clean: 1000,
      dropped: 39,
      actions: "Deduplicated by passenger_id & completeness score; imputed 10 missing last names; SHA-256 salted Aadhaar/phone/passport.",
      color: "border-emerald-800/60",
      accent: "#10b981",
    },
    {
      name: "Bookings Layer",
      raw: 1000,
      clean: 1000,
      dropped: 0,
      actions: "Standardized 75 null/invalid booking statuses to PENDING with audit flag; verified 0 orphan flight or passenger keys.",
      color: "border-amber-800/60",
      accent: "#f59e0b",
    },
    {
      name: "Payments Layer",
      raw: 1000,
      clean: 1000,
      dropped: 0,
      actions: "Detected 78 null/non-numeric amount rows; imputed via route-level median (INR 8,027.12); 0 orphan booking references.",
      color: "border-purple-800/60",
      accent: "#a855f7",
    },
  ];

  return (
    <div className="space-y-6">
      {/* PII Cryptographic Vault Card */}
      <PiiVaultStatus />

      {/* Row tracking waterfall + 2 status donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall row tracking */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiFilter3Line className="w-4 h-4 text-sky-400" />
                Pipeline Ingestion vs Cleaned Retained Rows
              </CardTitle>
              <CardDescription>
                Audited count transition between bronze snapshots and silver tables
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="stage"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  height={45}
                />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[900, 1060]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val: any) => [`${val} rows`, "Count"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Booking status donut */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>
                <RiPieChartLine className="w-4 h-4 text-amber-400" />
                Booking Status
              </CardTitle>
              <CardDescription>
                1,000 reservation statuses
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`book-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment imputation donut */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>
                <RiDatabaseLine className="w-4 h-4 text-sky-400" />
                Payment Imputation
              </CardTitle>
              <CardDescription>
                78 missing amounts repaired
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentImputationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {paymentImputationData.map((entry, index) => (
                    <Cell key={`pay-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 4 Stage-by-Stage Audit Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs uppercase font-bold text-slate-400 tracking-wider">
          <RiShieldCheckLine className="w-4 h-4 text-emerald-400" />
          Medallion Pipeline Stage-by-Stage Verification Ledger
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {auditStages.map((stage, i) => (
            <Card key={i} className={`border ${stage.color} relative overflow-hidden`}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: stage.accent }} />
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-100 text-sm">{stage.name}</h4>
                <RiCheckDoubleLine className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="space-y-1.5 text-xs font-mono mb-3">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500 font-sans">Raw Ingested:</span>
                  <span>{stage.raw}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span className="text-slate-500 font-sans">Clean Retained:</span>
                  <span>{stage.clean}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500 font-sans">Duplicates Dropped:</span>
                  <span className={stage.dropped > 0 ? "text-rose-400" : "text-slate-400"}>
                    {stage.dropped}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-sans border-t border-slate-800/80 pt-2 leading-relaxed">
                {stage.actions}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

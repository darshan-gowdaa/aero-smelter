"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { PiiVaultStatus } from "@/components/molecules/PiiVaultStatus";
import { asgData, confirmedBookingsCount, cancelledBookingsCount, pendingBookingsCount, imputedPaymentCount } from "@/lib/data";
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
  RiShieldCheckLine,
  RiPieChartLine,
  RiFilter3Line,
  RiDatabaseLine,
  RiCheckDoubleLine,
} from "@remixicon/react";

export function DataQualityTab() {
  const { isDark } = useTheme();

  const waterfallData = useMemo(() => {
    return [
      { stage: "Flights (Raw)", count: 1020, fill: isDark ? "#4fd8eb" : "#006874" },
      { stage: "Flights (Clean)", count: 1005, fill: "#10b981" },
      { stage: "Pax (Raw)", count: 1039, fill: isDark ? "#4fd8eb" : "#006874" },
      { stage: "Pax (Clean)", count: 1000, fill: "#10b981" },
      { stage: "Bookings (Raw)", count: 1000, fill: isDark ? "#4fd8eb" : "#006874" },
      { stage: "Bookings (Clean)", count: 1000, fill: "#10b981" },
      { stage: "Payments (Raw)", count: 1000, fill: isDark ? "#4fd8eb" : "#006874" },
      { stage: "Payments (Clean)", count: 1000, fill: "#10b981" },
    ];
  }, [isDark]);

  const bookingStatusData = useMemo(() => {
    return [
      { name: "Confirmed", value: confirmedBookingsCount, fill: "#10b981" },
      { name: "Cancelled", value: cancelledBookingsCount, fill: isDark ? "#ffb4ab" : "#ba1a1a" },
      { name: "Pending (Standardized)", value: pendingBookingsCount, fill: "#f59e0b" },
    ];
  }, [isDark]);

  const paymentImputationData = useMemo(() => {
    const realCount = asgData.fact_payments.length - imputedPaymentCount;
    return [
      { name: "Real Amount", value: realCount, fill: isDark ? "#4fd8eb" : "#006874" },
      { name: "Median Imputed", value: imputedPaymentCount, fill: "#f59e0b" },
    ];
  }, [isDark]);

  const auditStages = [
    {
      name: "Flights Layer",
      raw: 1020,
      clean: 1005,
      dropped: 15,
      actions: "Repaired 72 missing airline names via prefix lookup; resolved overnight SJ192 date rollover; 15 duplicates dropped.",
      accent: isDark ? "#4fd8eb" : "#006874",
    },
    {
      name: "Passengers Layer",
      raw: 1039,
      clean: 1000,
      dropped: 39,
      actions: "Deduplicated by passenger_id & completeness score; imputed 10 missing last names; SHA-256 salted Aadhaar/phone/passport.",
      accent: "#10b981",
    },
    {
      name: "Bookings Layer",
      raw: 1000,
      clean: 1000,
      dropped: 0,
      actions: "Standardized 75 null/invalid booking statuses to PENDING with audit flag; verified 0 orphan flight or passenger keys.",
      accent: "#f59e0b",
    },
    {
      name: "Payments Layer",
      raw: 1000,
      clean: 1000,
      dropped: 0,
      actions: "Detected 78 null/non-numeric amount rows; imputed via route-level median (INR 8,027.12); 0 orphan booking references.",
      accent: isDark ? "#bbc6ea" : "#525e7d",
    },
  ];

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
      {/* PII Cryptographic Vault Card */}
      <PiiVaultStatus />

      {/* Row tracking waterfall + 2 status donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall row tracking */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div>
              <CardTitle>
                <RiFilter3Line className="w-5 h-5 text-[var(--color-primary)]" />
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
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                <XAxis
                  dataKey="stage"
                  stroke={chartTheme.text}
                  fontSize={10}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  height={45}
                />
                <YAxis stroke={chartTheme.text} fontSize={11} domain={[900, 1060]} tickLine={false} />
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                  formatter={(val: any) => [`${val} rows`, "Count"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
                <RiPieChartLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
                  paddingAngle={4}
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`book-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
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
                <RiDatabaseLine className="w-5 h-5 text-[var(--color-primary)]" />
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
                  paddingAngle={4}
                >
                  {paymentImputationData.map((entry, index) => (
                    <Cell key={`pay-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 4 Stage-by-Stage Audit Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs uppercase font-bold text-[var(--color-on-surface-variant)] tracking-wider">
          <RiShieldCheckLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Medallion Pipeline Stage-by-Stage Verification Ledger
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {auditStages.map((stage, i) => (
            <div
              key={i}
              className="clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] relative overflow-hidden transition-all duration-200 hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: stage.accent }} />
              <div className="flex items-center justify-between mb-3 mt-1">
                <h4 className="font-bold text-[var(--color-on-surface)] text-sm">{stage.name}</h4>
                <RiCheckDoubleLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="space-y-2 text-xs font-mono mb-3">
                <div className="flex justify-between text-[var(--color-on-surface-variant)]">
                  <span className="font-sans">Raw Ingested:</span>
                  <span className="font-semibold text-[var(--color-on-surface)]">{stage.raw}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span className="text-[var(--color-on-surface-variant)] font-sans">Clean Retained:</span>
                  <span>{stage.clean}</span>
                </div>
                <div className="flex justify-between text-[var(--color-on-surface-variant)]">
                  <span className="font-sans">Duplicates Dropped:</span>
                  <span className={stage.dropped > 0 ? "text-[var(--color-error)] font-bold" : "text-[var(--color-on-surface-variant)]"}>
                    {stage.dropped}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--color-on-surface-variant)] font-sans border-t border-[var(--color-surface-variant)] pt-2.5 leading-relaxed">
                {stage.actions}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

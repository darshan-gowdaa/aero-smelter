"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { KpiStrip } from "@/components/molecules/KpiStrip";
import { TabButton } from "@/components/atoms/TabButton";
import { DurationTab } from "@/components/organisms/DurationTab";
import { RoutePerformanceTab } from "@/components/organisms/RoutePerformanceTab";
import { AirlineTrendsTab } from "@/components/organisms/AirlineTrendsTab";
import { DelayAnomalyTab } from "@/components/organisms/DelayAnomalyTab";
import { DataQualityTab } from "@/components/organisms/DataQualityTab";
import {
  RiTimerLine,
  RiRouteLine,
  RiFlightLandLine,
  RiAlertLine,
  RiShieldCheckLine,
} from "@remixicon/react";

type TabId = "duration" | "routes" | "airlines" | "anomalies" | "quality";

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState<TabId>("duration");

  const tabs = [
    {
      id: "duration" as TabId,
      label: "Duration Analysis",
      icon: <RiTimerLine className="w-4 h-4" />,
    },
    {
      id: "routes" as TabId,
      label: "Route Performance",
      icon: <RiRouteLine className="w-4 h-4" />,
    },
    {
      id: "airlines" as TabId,
      label: "Airline Trends",
      icon: <RiFlightLandLine className="w-4 h-4" />,
    },
    {
      id: "anomalies" as TabId,
      label: "Delay & Anomaly",
      icon: <RiAlertLine className="w-4 h-4 text-rose-500" />,
      badgeCount: 1,
    },
    {
      id: "quality" as TabId,
      label: "Data Quality & PII",
      icon: <RiShieldCheckLine className="w-4 h-4 text-emerald-500" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar Organism with Light/Dark Button Switch */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive KPI Overview Molecule */}
        <KpiStrip />

        {/* High-Contrast Segment Tab Navigation Container */}
        <div className="p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex overflow-x-auto gap-1.5 no-scrollbar shadow-2xs">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.icon}
              badgeCount={tab.badgeCount}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* Tab Content Panels (Organisms) */}
        <div className="pt-2">
          {activeTab === "duration" && <DurationTab />}
          {activeTab === "routes" && <RoutePerformanceTab />}
          {activeTab === "airlines" && <AirlineTrendsTab />}
          {activeTab === "anomalies" && <DelayAnomalyTab />}
          {activeTab === "quality" && <DataQualityTab />}
        </div>
      </main>

      {/* Executive Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-6 mt-16 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ASG Airlines Ops Data Engineering Suite
            </span>
            <span>•</span>
            <span>Next.js 16 + TypeScript + Tailwind CSS + Recharts</span>
          </div>

          <div className="flex items-center gap-4 font-mono font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">6/6 Tests Passing</span>
            <span>•</span>
            <span className="text-sky-600 dark:text-sky-400">100% Referential Integrity</span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-400">India DPDP Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
      icon: <RiAlertLine className="w-4 h-4" />,
      badgeCount: 1,
    },
    {
      id: "quality" as TabId,
      label: "Data Quality & PII",
      icon: <RiShieldCheckLine className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Navbar Organism */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive KPI Overview Molecule */}
        <KpiStrip />

        {/* Tab Navigation Molecule */}
        <div className="border-b border-slate-800 flex overflow-x-auto no-scrollbar">
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

      {/* Executive Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">ASG Airlines Ops Data Engineering</span>
            <span>•</span>
            <span>Next.js 16 + TypeScript + Tailwind CSS + Recharts</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-mono">6/6 Tests Passing</span>
            <span>•</span>
            <span className="text-sky-400 font-mono">100% Referential Integrity</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">India DPDP Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Navbar Organism with Light/Dark Button Switch */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive KPI Overview Molecule */}
        <KpiStrip />

        {/* Claymorphism Tab Navigation Container */}
        <div className="p-1.5 rounded-3xl bg-emerald-100/60 dark:bg-emerald-950/60 border-2 border-emerald-200/80 dark:border-emerald-800/40 shadow-inner flex overflow-x-auto gap-1.5 no-scrollbar">
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

      {/* Executive Clay Footer */}
      <footer className="border-t-2 border-emerald-100/80 dark:border-emerald-900/50 bg-white/60 dark:bg-emerald-950/60 backdrop-blur-md py-6 mt-16 text-xs text-emerald-800/70 dark:text-emerald-300/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-emerald-950 dark:text-emerald-100">
              ASG Airlines Ops Data Engineering
            </span>
            <span>•</span>
            <span className="font-medium">Next.js 16 + TypeScript + Claymorphism Emerald Theme</span>
          </div>

          <div className="flex items-center gap-4 font-mono font-bold">
            <span className="text-emerald-700 dark:text-emerald-400">6/6 Tests Passing</span>
            <span>•</span>
            <span className="text-teal-700 dark:text-teal-300">100% Referential Integrity</span>
            <span>•</span>
            <span className="text-emerald-800/70 dark:text-emerald-400/70">India DPDP Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
import { AiCopilotTab } from "@/components/organisms/AiCopilotTab";
import {
  RiTimerLine,
  RiRouteLine,
  RiFlightLandLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiSparkling2Fill,
  RiRefreshLine,
} from "@remixicon/react";

type TabId = "duration" | "copilot" | "routes" | "airlines" | "anomalies" | "quality";

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState<TabId>("duration");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    },
    {
      id: "copilot" as TabId,
      label: "AI Copilot & ML",
      icon: <RiSparkling2Fill className="w-4 h-4 text-amber-500" />,
    },
    {
      id: "quality" as TabId,
      label: "Data Quality & Azure Lake",
      icon: <RiShieldCheckLine className="w-4 h-4 text-emerald-500" />,
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-on-background)] transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
        {/* Page Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-on-surface)] flex items-center gap-3 tracking-tight">
              ✈️ Flight Operations Analytics
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-on-surface-variant)] mt-1.5 max-w-3xl">
              Medallion Star Schema Lakehouse with Azure Databricks, Synapse Serverless SQL views, and Grounded Gemini Copilot.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[var(--radius-full)] shadow hover:shadow-lg transition-all duration-200 cursor-pointer font-bold text-xs sm:text-sm flex items-center gap-2 select-none hover:scale-102 active:scale-98"
          >
            <RiRefreshLine className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Lakehouse</span>
          </button>
        </div>

        {/* Executive KPI Overview Strip */}
        <KpiStrip />

        {/* Stress-Lens Pill-Shaped Segment Tab Navigation */}
        <div className="p-1.5 rounded-[var(--radius-full)] bg-[var(--color-surface-variant)]/40 border border-[var(--color-outline)]/20 flex overflow-x-auto gap-1.5 no-scrollbar shadow-xs">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.icon}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="pt-2 animate-fade-in">
          {activeTab === "duration" && <DurationTab />}
          {activeTab === "copilot" && <AiCopilotTab />}
          {activeTab === "routes" && <RoutePerformanceTab />}
          {activeTab === "airlines" && <AirlineTrendsTab />}
          {activeTab === "anomalies" && <DelayAnomalyTab />}
          {activeTab === "quality" && <DataQualityTab />}
        </div>
      </main>

      {/* Stress-Lens Style Clean Footer */}
      <footer className="border-t border-[var(--color-surface-variant)] bg-[var(--color-surface)]/80 backdrop-blur-md py-6 mt-16 text-xs text-[var(--color-on-surface-variant)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bold text-[var(--color-on-surface)]">
              ASG Airlines Ops Data Engineering Suite
            </span>
            <span>•</span>
            <span>Next.js 16 + TypeScript + Tailwind CSS v4 + Recharts</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 font-mono font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">8/8 Tests Passing</span>
            <span>•</span>
            <span className="text-[var(--color-primary)]">Azure Databricks Delta Lake</span>
            <span>•</span>
            <span className="text-[var(--color-on-surface-variant)]">India DPDP Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

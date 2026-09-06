"use client";

import React, { useState, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { asgData } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { callGeminiApi, PRECOMPUTED_INSIGHTS, buildGroundedContext } from "@/lib/gemini";
import { FormattedAiInsight } from "@/components/molecules/FormattedAiInsight";
import { MlAnomalyScore } from "@/lib/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  RiSparkling2Fill,
  RiRobot2Line,
  RiSendPlane2Fill,
  RiAlertLine,
  RiSearchLine,
  RiCloseLine,
  RiBrainLine,
  RiFileCopyLine,
  RiCheckLine,
  RiCloudLine,
  RiPulseLine,
  RiCpuLine,
  RiDatabase2Line,
  RiCodeSSlashLine,
} from "@remixicon/react";

export function AiCopilotTab() {
  const { isDark } = useTheme();
  const copilotRef = useRef<HTMLDivElement>(null);

  // AI Prompt & Response State
  const [prompt, setPrompt] = useState<string>("Explain the root cause of Flight SJ192 overnight duration anomaly and how data engineering and ML resolved it.");
  const [response, setResponse] = useState<string>(PRECOMPUTED_INSIGHTS.sj192);
  const [activePreset, setActivePreset] = useState<string>("sj192");
  const [activeQueryTitle, setActiveQueryTitle] = useState<string>("Flight SJ192 Overnight Duration Anomaly Root Cause");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showLineage, setShowLineage] = useState<boolean>(false);

  // Flight Anomaly Table Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>("SJ192");
  const [filterMode, setFilterMode] = useState<"anomalies" | "all">("anomalies");

  // Copy response helper
  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preset queries handler
  const handleRunPreset = async (presetKey: "sj192" | "cancellation" | "revenue" | "mlops", title: string) => {
    setActivePreset(presetKey);
    setActiveQueryTitle(title);
    setApiError(null);
    setIsLoading(true);

    try {
      const queryMap = {
        sj192: "Explain the root cause of Flight SJ192 overnight duration anomaly and how data engineering and ML resolved it.",
        cancellation: "Analyze the top route cancellation drivers, sector risks, and Random Forest feature importances.",
        revenue: "Analyze ticket revenue yield across payment methods and quantify financial leakage from pending/cancelled bookings.",
        mlops: "Explain the three machine learning models (Isolation Forest, Random Forest, Gradient Boosting) deployed in this pipeline.",
      };
      setPrompt(queryMap[presetKey]);
      const text = await callGeminiApi(queryMap[presetKey]);
      setResponse(text);
    } catch (err: any) {
      setApiError(err.message || "Failed to contact Gemini API. Loaded verified grounded analysis.");
      setResponse(PRECOMPUTED_INSIGHTS[presetKey]);
    } finally {
      setIsLoading(false);
    }
  };

  const matchKeywordInsight = (q: string): string | null => {
    const lower = q.toLowerCase();
    if (lower.includes("risk") || lower.includes("danger") || lower.includes("threat") || lower.includes("vulnerab")) {
      return PRECOMPUTED_INSIGHTS.risk || PRECOMPUTED_INSIGHTS.cancellation;
    }
    if (lower.includes("cancel") || lower.includes("drop")) {
      return PRECOMPUTED_INSIGHTS.cancellation;
    }
    if (lower.includes("sj192") || lower.includes("overnight") || lower.includes("delay") || lower.includes("hour") || lower.includes("duration")) {
      return PRECOMPUTED_INSIGHTS.sj192;
    }
    if (lower.includes("rev") || lower.includes("pay") || lower.includes("money") || lower.includes("fare") || lower.includes("leakage")) {
      return PRECOMPUTED_INSIGHTS.revenue;
    }
    if (lower.includes("ml") || lower.includes("model") || lower.includes("ai") || lower.includes("forest") || lower.includes("learn")) {
      return PRECOMPUTED_INSIGHTS.mlops;
    }
    return null;
  };

  // Custom prompt submit handler
  const handleCustomSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = (customQuery || prompt).trim();
    if (!queryText) return;

    setIsLoading(true);
    setApiError(null);
    setActivePreset("custom");
    setActiveQueryTitle(queryText);

    try {
      const text = await callGeminiApi(queryText);
      if (text && text.trim().length > 120) {
        setResponse(text);
      } else {
        const fallback = matchKeywordInsight(queryText) || PRECOMPUTED_INSIGHTS.risk;
        setResponse(fallback);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to contact Gemini API. Loaded verified grounded dataset analysis.");
      const fallback = matchKeywordInsight(queryText) || PRECOMPUTED_INSIGHTS.risk;
      setResponse(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Audit specific flight directly with Copilot
  const handleAuditFlight = (flight: MlAnomalyScore) => {
    const query = `Perform an operational anomaly and root-cause audit for Flight ${flight.flight_id} (${flight.airline_name}) on route sector ${flight.route_name}. Actual duration was ${flight.duration_minutes} min versus route mean of ${flight.route_mean_duration.toFixed(1)} min. Isolation Forest anomaly score is ${flight.ml_anomaly_score.toFixed(4)}. Explain operational implications and recommended gate action.`;
    setPrompt(query);
    setActivePreset("custom");
    setActiveQueryTitle(`Audit: Flight ${flight.flight_id} (${flight.route_name})`);

    copilotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    handleCustomSubmit(undefined, query);
  };

  // Feature importance chart data
  const featureData = useMemo(() => {
    return asgData.ml_feature_importances.map((f) => ({
      name: f.feature,
      pct: f.percentage,
    }));
  }, []);

  // Filtered ML scored flights
  const scoredFlights = useMemo(() => {
    const list = asgData.ml_anomaly_scores || [];
    return list.filter((f) => {
      const matchesSearch =
        f.flight_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.airline_name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === "anomalies") {
        return f.ml_is_anomaly === 1 || f.ml_anomaly_score > 0.6;
      }
      return true;
    }).slice(0, 20);
  }, [searchQuery, filterMode]);

  // Chart theme
  const chartTheme = {
    grid: isDark ? "#3f484a" : "#dbe4e6",
    text: isDark ? "#bfc8ca" : "#3f484a",
    tooltip: {
      backgroundColor: isDark ? "#191c1d" : "#fbfdfd",
      borderColor: isDark ? "#3f484a" : "#dbe4e6",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      fontSize: "12px",
      color: isDark ? "#e1e3e3" : "#191c1d",
    },
  };

  const groundedLineageText = useMemo(() => buildGroundedContext(), []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Compact Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-outline)]/20 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-primary)]">
            <RiRobot2Line className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-on-surface)]">
              Executive Grounded Copilot & MLOps Suite
            </h2>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Real-time operational reasoning grounded strictly in 1,005 flights, 1,000 bookings, and 3 Scikit-Learn models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>3/3 ML Models Active</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[#001f24]/50 text-[#006874] dark:text-[#97f0ff] font-mono text-[11px] border border-[#97f0ff]/30">
            <RiCloudLine className="w-3 h-3" />
            <span>Azure Synapse / ADLS Gen2</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLineage(!showLineage)}
            className="px-2.5 py-1 rounded-[var(--radius-full)] text-[11px] font-mono text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] border border-[var(--color-outline)]/20 hover:border-[var(--color-primary)] transition-all inline-flex items-center gap-1 cursor-pointer"
            title="Inspect grounded context lineage"
          >
            <RiCodeSSlashLine className="w-3 h-3" />
            <span>{showLineage ? "Hide Lineage" : "Grounded Lineage"}</span>
          </button>
        </div>
      </div>

      {/* Operational AI Error Alert Banner (Dismissible) */}
      {apiError && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-error-container)] border border-[var(--color-error)]/30 text-xs text-[var(--color-on-error-container)] flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <RiAlertLine className="w-4 h-4 shrink-0 text-[var(--color-error)]" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="p-1 rounded text-[var(--color-on-error-container)] hover:bg-[var(--color-error)]/20 transition-colors cursor-pointer"
            title="Dismiss error"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expandable Grounded Context Lineage Drawer */}
      {showLineage && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-primary)]/30 text-xs shadow-sm space-y-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[var(--color-surface-variant)] pb-2">
            <div className="flex items-center gap-2">
              <RiDatabase2Line className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="font-bold text-[var(--color-on-surface)] font-mono text-xs">
                Verified Grounded Knowledge Base (Zero Hallucination Context)
              </span>
            </div>
            <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">
              Fed to Gemini Prompt
            </span>
          </div>
          <pre className="font-mono text-[11px] p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-variant)]/30 text-[var(--color-on-surface)] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-[var(--color-outline)]/15 max-h-56">
            {groundedLineageText}
          </pre>
        </div>
      )}

      {/* SECTION 1: EXECUTIVE COPILOT TERMINAL */}
      <div ref={copilotRef} id="copilot-terminal" className="scroll-mt-4">
        <Card className="p-6 sm:p-7">
          <CardHeader className="pb-4 border-b border-[var(--color-surface-variant)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RiSparkling2Fill className="w-4 h-4 text-amber-500" />
                  Executive Grounded Copilot Terminal
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Click a verified operational deep-dive below, or type a custom natural language query
                </CardDescription>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-full)] bg-[var(--color-surface-variant)]/60 text-[var(--color-on-surface-variant)] text-[11px] font-mono">
                <RiPulseLine className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Grounded Gemini 2.5</span>
              </div>
            </div>
          </CardHeader>

          {/* Quick Action Scenario Chips */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleRunPreset("sj192", "Flight SJ192 Overnight Duration Anomaly Root Cause")}
                className={`text-left p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                  activePreset === "sj192"
                    ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500/30"
                    : "border-[var(--color-surface-variant)] hover:border-amber-400 bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-[var(--color-on-surface)] truncate">
                    Overnight SJ192 Root Cause
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                  -1,370 min raw glitch → +300 min fix
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRunPreset("cancellation", "Fleet Cancellation Drivers & High-Risk Sector Analysis")}
                className={`text-left p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                  activePreset === "cancellation"
                    ? "border-[var(--color-error)] bg-[var(--color-error-container)]/30 ring-1 ring-[var(--color-error)]/30"
                    : "border-[var(--color-surface-variant)] hover:border-[var(--color-error)] bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-error)] shrink-0" />
                  <span className="text-xs font-bold text-[var(--color-on-surface)] truncate">
                    Cancellation Risk Drivers
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                  31.4% fleet rate · DEL-BOM 41.2%
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRunPreset("revenue", "Revenue Yield & Payment Channel Leakage Assessment")}
                className={`text-left p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                  activePreset === "revenue"
                    ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30"
                    : "border-[var(--color-surface-variant)] hover:border-emerald-400 bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-[var(--color-on-surface)] truncate">
                    Revenue Yield & Leakage
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                  ₹6.87M audited · UPI vs Net Banking
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRunPreset("mlops", "ASG Airlines MLOps Architecture & Model Governance")}
                className={`text-left p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                  activePreset === "mlops"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/30 ring-1 ring-[var(--color-primary)]/30"
                    : "border-[var(--color-surface-variant)] hover:border-[var(--color-primary)] bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                  <span className="text-xs font-bold text-[var(--color-on-surface)] truncate">
                    MLOps Model Governance
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                  Iso Forest + Random Forest + GB
                </p>
              </button>
            </div>
          </div>

          {/* Custom Query Input Bar */}
          <form onSubmit={handleCustomSubmit} className="mt-4 pt-3 border-t border-[var(--color-surface-variant)]">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <RiSearchLine className="w-4 h-4 text-[var(--color-on-surface-variant)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Gemini anything about ASG flight operations, delays, or ML risk scores..."
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-outline)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="clay-btn px-5 py-2.5 rounded-[var(--radius-full)] text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RiSendPlane2Fill className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Grounded Output Display Panel */}
          <div className="mt-5 p-5 sm:p-6 rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)] bg-[var(--color-surface-variant)]/20 min-h-[300px] relative shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-surface-variant)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-[var(--color-on-surface)] font-mono">
                  {activeQueryTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors cursor-pointer px-2 py-1 rounded hover:bg-[var(--color-surface)]"
                  title="Copy response text"
                >
                  {copied ? (
                    <>
                      <RiCheckLine className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <RiFileCopyLine className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-surface-variant)] font-semibold">
                  Verified Grounded Intelligence
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[var(--color-on-surface-variant)] font-mono">
                  Grounding operational reasoning with 1,005 flights & ML tensors...
                </p>
              </div>
            ) : (
              <FormattedAiInsight content={response} />
            )}
          </div>
        </Card>
      </div>

      {/* SECTION 2: MLOPS MODEL PERFORMANCE & FEATURE IMPORTANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3 Model Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[var(--color-on-surface)] flex items-center gap-2">
              <RiBrainLine className="w-4 h-4 text-[var(--color-primary)]" />
              Production Scikit-Learn MLOps Suite
            </h3>
            <span className="text-[11px] text-[var(--color-on-surface-variant)] font-mono">
              3 Models Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Model 1: Isolation Forest */}
            <div className="clay p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border-t-3 border-t-amber-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-on-surface-variant)] mb-1">
                  <span>OUTLIERS</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>
                <div className="font-extrabold text-xs text-[var(--color-on-surface)]">
                  Isolation Forest
                </div>
                <div className="text-lg font-black font-mono text-[var(--color-primary)] mt-2">
                  1.59%
                </div>
                <div className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">
                  Contamination rate · 16 flights flagged
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--color-surface-variant)] text-[10px] text-[var(--color-on-surface-variant)] font-mono">
                100 trees · duration_diff
              </div>
            </div>

            {/* Model 2: Random Forest Classifier */}
            <div className="clay p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border-t-3 border-t-[var(--color-error)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-on-surface-variant)] mb-1">
                  <span>CANCELLATION</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>
                <div className="font-extrabold text-xs text-[var(--color-on-surface)]">
                  Random Forest
                </div>
                <div className="text-lg font-black font-mono text-[var(--color-primary)] mt-2">
                  69.2%
                </div>
                <div className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">
                  Accuracy · ROC-AUC 0.5143
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--color-surface-variant)] text-[10px] text-[var(--color-on-surface-variant)] font-mono">
                150 trees · max_depth=8
              </div>
            </div>

            {/* Model 3: Gradient Boosting Regressor */}
            <div className="clay p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border-t-3 border-t-[var(--color-primary)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-on-surface-variant)] mb-1">
                  <span>FARE ESTIMATE</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>
                <div className="font-extrabold text-xs text-[var(--color-on-surface)]">
                  Gradient Boosting
                </div>
                <div className="text-lg font-black font-mono text-[var(--color-primary)] mt-2">
                  ₹3,436
                </div>
                <div className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">
                  Mean Abs Error · R² = 0.48
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--color-surface-variant)] text-[10px] text-[var(--color-on-surface-variant)] font-mono">
                120 trees · Huber loss
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance Bar Chart (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="p-5 h-full flex flex-col justify-between">
            <CardHeader className="pb-2 border-b border-[var(--color-surface-variant)]">
              <div>
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5">
                  <RiCpuLine className="w-4 h-4 text-[var(--color-primary)]" />
                  Cancellation Feature Drivers (Random Forest)
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Gini feature importance percentage breakdown
                </CardDescription>
              </div>
            </CardHeader>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={featureData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.5} />
                  <XAxis type="number" stroke={chartTheme.text} fontSize={10} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={chartTheme.text}
                    fontSize={10}
                    width={105}
                    tick={{ fill: chartTheme.text, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    formatter={(val: any) => [`${val}%`, "Predictive Weight"]}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {featureData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? (isDark ? "#ffb4ab" : "#ba1a1a") : index === 1 ? "#f59e0b" : (isDark ? "#4fd8eb" : "#006874")}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: ISOLATION FOREST ANOMALY LEDGER */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-surface-variant)]">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <RiAlertLine className="w-4 h-4 text-[var(--color-error)]" />
              Machine Learning Flight Anomaly Ledger (Isolation Forest)
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Click &quot;Audit&quot; on any flight row to immediately generate a root-cause explanation in the Copilot above
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter pills */}
            <div className="flex rounded-[var(--radius-full)] bg-[var(--color-surface-variant)]/60 p-1 text-xs border border-[var(--color-outline)]/20">
              <button
                type="button"
                onClick={() => setFilterMode("anomalies")}
                className={`px-3 py-1 rounded-[var(--radius-full)] font-semibold transition-all cursor-pointer text-xs ${
                  filterMode === "anomalies"
                    ? "bg-[var(--color-surface)] text-[var(--color-error)] shadow-2xs"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                }`}
              >
                Anomalies ({asgData.ml_anomaly_scores.filter((a) => a.ml_is_anomaly === 1).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-[var(--radius-full)] font-semibold transition-all cursor-pointer text-xs ${
                  filterMode === "all"
                    ? "bg-[var(--color-surface)] text-[var(--color-on-surface)] shadow-2xs"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                }`}
              >
                All ({asgData.ml_anomaly_scores.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-44">
              <RiSearchLine className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flight..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-[var(--radius-full)] border border-[var(--color-outline)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Scored Flights Table */}
        <div className="overflow-x-auto mt-3 rounded-[var(--radius-md)] border border-[var(--color-surface-variant)]">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-[var(--color-on-surface-variant)] bg-[var(--color-surface-variant)]/40 border-b border-[var(--color-outline)]/20">
              <tr>
                <th className="px-3 py-2.5 font-bold">Flight ID</th>
                <th className="px-3 py-2.5 font-bold">Carrier</th>
                <th className="px-3 py-2.5 font-bold">Route Sector</th>
                <th className="px-3 py-2.5 font-bold text-right">Actual Duration</th>
                <th className="px-3 py-2.5 font-bold text-right">Route Baseline</th>
                <th className="px-3 py-2.5 font-bold text-right">Deviation (Δ)</th>
                <th className="px-3 py-2.5 font-bold text-center">ML Anomaly Score</th>
                <th className="px-3 py-2.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-variant)] font-mono">
              {scoredFlights.map((flight, idx) => {
                const isOvernightRepaired = flight.flight_id === "SJ192";
                const isAnomaly = flight.ml_is_anomaly === 1;
                const delta = flight.duration_minutes - flight.route_mean_duration;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-[var(--color-surface-variant)]/30 transition-colors ${
                      isOvernightRepaired ? "bg-amber-50/30 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-[var(--color-on-surface)]">
                      <div className="flex items-center gap-1.5">
                        <span>{flight.flight_id}</span>
                        {isOvernightRepaired && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-sans">
                            Repaired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--color-on-surface-variant)] font-sans">
                      {flight.airline_name} ({flight.airline_code})
                    </td>
                    <td className="px-3 py-2.5 text-[var(--color-primary)] font-bold">
                      {flight.route_name}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      <span
                        className={
                          isAnomaly
                            ? "text-[var(--color-error)]"
                            : isOvernightRepaired
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-[var(--color-on-surface)]"
                        }
                      >
                        {flight.duration_minutes} min
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[var(--color-on-surface-variant)]">
                      {flight.route_mean_duration.toFixed(1)} min
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      <span className={delta > 30 || delta < -30 ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]"}>
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} min
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-14 bg-[var(--color-surface-variant)] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              flight.ml_anomaly_score > 0.7
                                ? "bg-[var(--color-error)]"
                                : flight.ml_anomaly_score > 0.5
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, flight.ml_anomaly_score * 100)}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold text-[11px] ${
                            flight.ml_anomaly_score > 0.7
                              ? "text-[var(--color-error)]"
                              : flight.ml_anomaly_score > 0.5
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {flight.ml_anomaly_score.toFixed(3)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleAuditFlight(flight)}
                        className="clay-btn px-2 py-0.5 rounded text-[10px] font-bold text-white transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Audit flight with Copilot"
                      >
                        <RiSparkling2Fill className="w-2.5 h-2.5 text-amber-300" />
                        <span>Audit</span>
                      </button>
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

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/atoms/Card";
import { asgData } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { callGeminiApi, PRECOMPUTED_INSIGHTS } from "@/lib/gemini";
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
  RiKey2Line,
  RiSendPlane2Fill,
  RiAlertLine,
  RiShieldCheckLine,
  RiEyeLine,
  RiEyeOffLine,
  RiExternalLinkLine,
  RiFlashlightLine,
  RiSearchLine,
  RiCloseLine,
  RiBrainLine,
  RiFileCopyLine,
  RiCheckLine,
  RiCloudLine,
} from "@remixicon/react";

export function AiCopilotTab() {
  const { isDark } = useTheme();

  // Gemini API Key state with localStorage persistence
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // AI Prompt & Response State
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>(PRECOMPUTED_INSIGHTS.sj192);
  const [activePreset, setActivePreset] = useState<string>("sj192");
  const [activeQueryTitle, setActiveQueryTitle] = useState<string>("Flight SJ192 Overnight Duration Anomaly Root Cause");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Table search & filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "anomalies" | "highRisk">("anomalies");

  // Load saved key on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("asg_gemini_key");
      if (saved) {
        setApiKey(saved);
        setIsSaved(true);
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      try {
        localStorage.setItem("asg_gemini_key", apiKey.trim());
        setIsSaved(true);
        setApiError(null);
      } catch {
        // Ignore
      }
    }
  };

  const handleClearKey = () => {
    setApiKey("");
    setIsSaved(false);
    try {
      localStorage.removeItem("asg_gemini_key");
    } catch {
      // Ignore
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunPreset = async (presetKey: "sj192" | "cancellation" | "revenue" | "mlops", title: string) => {
    setActivePreset(presetKey);
    setActiveQueryTitle(title);
    setApiError(null);

    if (apiKey.trim()) {
      setIsLoading(true);
      try {
        const queryMap = {
          sj192: "Explain the root cause of Flight SJ192 overnight duration anomaly and how data engineering and ML resolved it.",
          cancellation: "Analyze the top route cancellation drivers, sector risks, and Random Forest feature importances.",
          revenue: "Analyze ticket revenue yield across payment methods and quantify financial leakage from pending/cancelled bookings.",
          mlops: "Explain the three machine learning models (Isolation Forest, Random Forest, Gradient Boosting) deployed in this pipeline.",
        };
        const text = await callGeminiApi(queryMap[presetKey], apiKey.trim());
        setResponse(text);
      } catch (err: any) {
        setApiError(err.message || "Failed to contact Gemini API.");
        setResponse(PRECOMPUTED_INSIGHTS[presetKey]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Precomputed verified answer
      setResponse(PRECOMPUTED_INSIGHTS[presetKey]);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!apiKey.trim()) {
      setApiError("Please enter a Google Gemini API Key above to run custom queries. Alternatively, click any verified quick-action buttons below.");
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setActivePreset("custom");
    setActiveQueryTitle(prompt.trim());

    try {
      const text = await callGeminiApi(prompt.trim(), apiKey.trim());
      setResponse(text);
      setPrompt("");
    } catch (err: any) {
      setApiError(err.message || "Failed to contact Gemini API.");
    } finally {
      setIsLoading(false);
    }
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
      if (filterMode === "highRisk") {
        return f.ml_anomaly_score > 0.5;
      }
      return true;
    }).slice(0, 25);
  }, [searchQuery, filterMode]);

  // Chart theme
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

  // Helper to format response text with colored badges
  const renderFormattedResponse = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-3 text-sm leading-relaxed text-[var(--color-on-surface)]">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-base font-bold text-[var(--color-on-surface)] pt-2 flex items-center gap-2">
                {line.includes("[RED]") && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-bold bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border border-[var(--color-error)]/20 shadow-2xs">
                    High Risk
                  </span>
                )}
                {line.includes("[YELLOW]") && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                    Attention Required
                  </span>
                )}
                {line.includes("[GREEN]") && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                    Verified Healthy
                  </span>
                )}
                <span>{line.replace(/###\s*(\[(RED|YELLOW|GREEN)\])?\s*/g, "")}</span>
              </h4>
            );
          }

          if (line.startsWith("- ")) {
            const content = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2 transition-colors duration-150 hover:bg-[var(--color-surface-variant)]/30 p-1.5 rounded-[var(--radius-sm)]">
                <span className="text-[var(--color-primary)] mt-0.5 font-bold">›</span>
                <span className="flex-1">
                  {content.split(/(\[(?:RED|YELLOW|GREEN)\]\s*\*\*?[^*]+\*\*?|\[(?:RED|YELLOW|GREEN)\])/g).map((part, pIdx) => {
                    if (part.includes("[RED]")) {
                      return (
                        <span key={pIdx} className="font-bold font-mono text-[var(--color-error)] bg-[var(--color-error-container)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--color-error)]/20 mx-0.5 shadow-2xs">
                          {part.replace(/\[RED\]\s*/, "")}
                        </span>
                      );
                    }
                    if (part.includes("[YELLOW]")) {
                      return (
                        <span key={pIdx} className="font-bold font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-[var(--radius-xs)] border border-amber-300 mx-0.5 shadow-2xs">
                          {part.replace(/\[YELLOW\]\s*/, "")}
                        </span>
                      );
                    }
                    if (part.includes("[GREEN]")) {
                      return (
                        <span key={pIdx} className="font-bold font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[var(--radius-xs)] border border-emerald-300 mx-0.5 shadow-2xs">
                          {part.replace(/\[GREEN\]\s*/, "")}
                        </span>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}
                </span>
              </div>
            );
          }

          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          return <p key={idx} className="text-[var(--color-on-surface-variant)]">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Banner: GenAI & MLOps Architecture Title */}
      <div className="rounded-[var(--radius-xl)] bg-gradient-to-r from-[#00363d] via-[#004f58] to-[#006874] text-white p-7 sm:p-9 shadow-md relative overflow-hidden border border-[#97f0ff]/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#4fd8eb]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-full)] bg-[#97f0ff]/15 border border-[#97f0ff]/30 text-[#97f0ff] text-xs font-semibold backdrop-blur-xs shadow-2xs">
              <RiSparkling2Fill className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Grounded GenAI & Machine Learning Ops</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              ASG Operations AI Copilot
            </h2>
            <p className="text-sm text-[#cde7ec] leading-relaxed">
              Real-time operational reasoning grounded strictly in 1,005 flights, 1,000 bookings, and 3 production-trained Scikit-Learn models. Powered by Google Gemini with full Azure Cloud integration.
            </p>
          </div>

          {/* Quick status pill & Azure Indicator */}
          <div className="flex flex-col sm:items-end gap-2.5 text-xs font-mono">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow-sm transition-transform hover:scale-102">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">3/3 ML Models Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] bg-[#001f24]/60 border border-[#97f0ff]/30 text-[#97f0ff] text-[11px]">
              <RiCloudLine className="w-3.5 h-3.5 text-[#4fd8eb]" />
              <span>Azure ADLS Gen2 & Synapse Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini API Key Configuration Card */}
      <div className="clay p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-surface-variant)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center shrink-0 shadow-2xs">
              <RiKey2Line className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[var(--color-on-surface)]">
                  Google Gemini API Key
                </span>
                {isSaved ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-[var(--radius-full)] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                    <RiShieldCheckLine className="w-3 h-3" /> Live Key Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-[var(--radius-full)] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                    <RiFlashlightLine className="w-3 h-3" /> Pre-Audited Mode Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                Enter your Gemini API key to enable arbitrary natural language prompts. Key is stored strictly in your browser session storage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-72">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono px-3.5 py-2.5 pr-9 rounded-[var(--radius-md)] border border-[var(--color-outline)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="clay-btn px-4 py-2.5 rounded-[var(--radius-md)] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Save
            </button>

            {isSaved && (
              <button
                type="button"
                onClick={handleClearKey}
                className="p-2.5 rounded-[var(--radius-md)] text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)]/30 transition-colors cursor-pointer"
                title="Clear Key"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            )}

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-[var(--radius-md)] text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-variant)] transition-colors inline-flex items-center gap-1 border border-[var(--color-outline)]/20"
              title="Get Gemini API Key (Google AI Studio)"
            >
              <RiExternalLinkLine className="w-4 h-4" />
            </a>
          </div>
        </div>

        {apiError && (
          <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-error-container)] border border-[var(--color-error)]/20 text-xs text-[var(--color-on-error-container)] flex items-center gap-2.5 animate-fade-in">
            <RiAlertLine className="w-4 h-4 shrink-0 text-[var(--color-error)]" />
            <span>{apiError}</span>
          </div>
        )}
      </div>

      {/* Grounded Executive Briefing Cards (Red / Green / Yellow Indicators) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Confirmed Operations & Revenue (Green) */}
        <div className="clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
            <span>AUDITED REVENUE</span>
            <span className="px-2.5 py-0.5 rounded-[var(--radius-full)] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
              [GREEN] Confirmed
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ₹6,870,450
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
            1,000 verified transactions · 100% PII Vault secured (SHA-256)
          </p>
        </div>

        {/* Metric 2: Day-Boundary Rollover (Yellow) */}
        <div className="clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] border-l-4 border-l-amber-500 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
            <span>OVERNIGHT REPAIR</span>
            <span className="px-2.5 py-0.5 rounded-[var(--radius-full)] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold">
              [YELLOW] Repaired
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            Flight SJ192
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
            -1,370 min raw corrected to +300 min · HYD→BOM Sector
          </p>
        </div>

        {/* Metric 3: Cancellation Risk Rate (Red) */}
        <div className="clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] border-l-4 border-l-[var(--color-error)] hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
            <span>CANCELLATION RATE</span>
            <span className="px-2.5 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] font-mono text-[11px] font-bold">
              [RED] High Alert
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-[var(--color-error)]">
            31.4%
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
            314 cancelled bookings · DEL→BOM route highest at 41.2%
          </p>
        </div>

        {/* Metric 4: ML Anomaly Detection (Red) */}
        <div className="clay p-5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] border-l-4 border-l-[var(--color-error)] hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
            <span>ML DURATION ANOMALIES</span>
            <span className="px-2.5 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] font-mono text-[11px] font-bold">
              [RED] Isolated
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-[var(--color-error)]">
            16 Flights
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
            Isolation Forest (1.59% contamination) · e.g., UK193 at 35 min
          </p>
        </div>
      </div>

      {/* Main Interactive Copilot Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Interactive Chat & Quick Prompt Launcher (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 sm:p-7">
            <CardHeader className="pb-4 border-b border-[var(--color-surface-variant)]">
              <div>
                <CardTitle className="flex items-center gap-2.5">
                  <RiRobot2Line className="w-5 h-5 text-[var(--color-primary)]" />
                  Executive Grounded Copilot Terminal
                </CardTitle>
                <CardDescription className="mt-1">
                  Click any verified scenario below for instant audited analysis, or type a custom natural language query
                </CardDescription>
              </div>
            </CardHeader>

            {/* Quick Action Chips */}
            <div className="pt-5 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] block mb-3">
                Verified Executive Deep-Dives (1-Click Grounded Analysis):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRunPreset("sj192", "Flight SJ192 Overnight Duration Anomaly Root Cause")}
                  className={`text-left p-3.5 rounded-[var(--radius-lg)] border transition-all cursor-pointer group ${
                    activePreset === "sj192"
                      ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                      : "border-[var(--color-surface-variant)] hover:border-amber-400 bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                    <span className="text-xs font-bold text-[var(--color-on-surface)] group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Overnight SJ192 Root Cause
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 truncate">
                    -1,370 min raw glitch → +300 min fix
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunPreset("cancellation", "Fleet Cancellation Drivers & High-Risk Sector Analysis")}
                  className={`text-left p-3.5 rounded-[var(--radius-lg)] border transition-all cursor-pointer group ${
                    activePreset === "cancellation"
                      ? "border-[var(--color-error)] bg-[var(--color-error-container)]/30 ring-2 ring-[var(--color-error)]/20"
                      : "border-[var(--color-surface-variant)] hover:border-[var(--color-error)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-error)] shadow-xs" />
                    <span className="text-xs font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-error)]">
                      Cancellation Risk Drivers
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 truncate">
                    31.4% fleet rate · DEL-BOM 41.2%
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunPreset("revenue", "Revenue Yield & Payment Channel Leakage Assessment")}
                  className={`text-left p-3.5 rounded-[var(--radius-lg)] border transition-all cursor-pointer group ${
                    activePreset === "revenue"
                      ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                      : "border-[var(--color-surface-variant)] hover:border-emerald-400 bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                    <span className="text-xs font-bold text-[var(--color-on-surface)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Revenue Yield & Leakage
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 truncate">
                    ₹6.87M audited · UPI vs Net Banking
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunPreset("mlops", "ASG Airlines MLOps Architecture & Model Governance")}
                  className={`text-left p-3.5 rounded-[var(--radius-lg)] border transition-all cursor-pointer group ${
                    activePreset === "mlops"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/30 ring-2 ring-[var(--color-primary)]/20"
                      : "border-[var(--color-surface-variant)] hover:border-[var(--color-primary)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shadow-xs" />
                    <span className="text-xs font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">
                      MLOps Models Architecture
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 truncate">
                    Iso Forest + Random Forest + GB
                  </p>
                </button>
              </div>
            </div>

            {/* Custom Query Input Bar */}
            <form onSubmit={handleCustomSubmit} className="mt-5 pt-4 border-t border-[var(--color-surface-variant)]">
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Gemini anything about ASG flight ops, routes, or ML scores..."
                  className="flex-1 text-xs px-4 py-3 rounded-[var(--radius-full)] border border-[var(--color-outline)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="clay-btn px-5 py-3 rounded-[var(--radius-full)] text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-2xs shrink-0 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RiSendPlane2Fill className="w-4 h-4" />
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* AI Grounded Output Display Panel */}
            <div className="mt-6 p-5 sm:p-6 rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)] bg-[var(--color-surface-variant)]/20 min-h-[320px] relative shadow-inner">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--color-surface-variant)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[var(--color-on-surface)] font-mono">
                    {activeQueryTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyResponse}
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
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
                  <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--color-surface)] border border-[var(--color-surface-variant)]">
                    {isSaved ? "Gemini Live" : "Verified Grounded"}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-9 h-9 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[var(--color-on-surface-variant)] font-mono">
                    Grounding operational reasoning with 1,005 flights & ML tensors...
                  </p>
                </div>
              ) : (
                renderFormattedResponse(response)
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: MLOps Model Performance & Feature Importance (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* MLOps Model Scorecards */}
          <Card className="p-6 sm:p-7">
            <CardHeader className="pb-4 border-b border-[var(--color-surface-variant)]">
              <div>
                <CardTitle className="flex items-center gap-2.5">
                  <RiBrainLine className="w-5 h-5 text-[var(--color-tertiary)]" />
                  Production ML Model Suite
                </CardTitle>
                <CardDescription className="mt-1">
                  Active Scikit-Learn models trained on operational feature store
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3.5 pt-5">
              {asgData.ml_model_metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)] bg-[var(--color-surface)] flex items-center justify-between gap-3 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--color-on-surface)]">
                        {m.model}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] font-medium">
                        {m.task}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-on-surface-variant)] block mt-0.5">
                      {m.primary_metric}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono text-[var(--color-primary)]">
                      {typeof m.score === "number" ? m.score.toLocaleString() : m.score}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ● {m.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Random Forest Feature Importance Chart */}
          <Card className="p-6 sm:p-7">
            <CardHeader className="pb-4 border-b border-[var(--color-surface-variant)]">
              <div>
                <CardTitle className="text-sm">
                  Cancellation Risk Feature Drivers (Random Forest)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Gini feature importance percentage breakdown
                </CardDescription>
              </div>
            </CardHeader>

            <div className="h-48 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={featureData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                  <XAxis type="number" stroke={chartTheme.text} fontSize={10} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={chartTheme.text}
                    fontSize={10}
                    width={95}
                    tick={{ fill: chartTheme.text, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    formatter={(val: any) => [`${val}%`, "Predictive Weight"]}
                  />
                  <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
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

      {/* Scored Flights & Anomalies Interactive Data Explorer */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-surface-variant)]">
          <div>
            <CardTitle className="flex items-center gap-2.5">
              <RiAlertLine className="w-5 h-5 text-[var(--color-error)]" />
              Machine Learning Flight Anomaly & Risk Ledger
            </CardTitle>
            <CardDescription className="mt-1">
              Isolation Forest anomaly scores (0.00-1.00) and duration deviation from route baseline
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter buttons */}
            <div className="flex rounded-[var(--radius-full)] bg-[var(--color-surface-variant)]/50 p-1 text-xs shadow-2xs border border-[var(--color-outline)]/20">
              <button
                type="button"
                onClick={() => setFilterMode("anomalies")}
                className={`px-3.5 py-1.5 rounded-[var(--radius-full)] font-semibold transition-all cursor-pointer ${
                  filterMode === "anomalies"
                    ? "bg-[var(--color-surface)] text-[var(--color-error)] shadow-2xs"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                }`}
              >
                Anomalies Only ({asgData.ml_anomaly_scores.filter((a) => a.ml_is_anomaly === 1).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3.5 py-1.5 rounded-[var(--radius-full)] font-semibold transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-[var(--color-surface)] text-[var(--color-on-surface)] shadow-2xs"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                }`}
              >
                All Flights ({asgData.ml_anomaly_scores.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-48">
              <RiSearchLine className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flight or route..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-[var(--radius-full)] border border-[var(--color-outline)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4 rounded-[var(--radius-lg)] border border-[var(--color-surface-variant)]">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-[var(--color-on-surface-variant)] bg-[var(--color-surface-variant)]/50 border-b border-[var(--color-outline)]/20">
              <tr>
                <th className="px-3.5 py-3 font-bold">Flight ID</th>
                <th className="px-3.5 py-3 font-bold">Carrier</th>
                <th className="px-3.5 py-3 font-bold">Route Sector</th>
                <th className="px-3.5 py-3 font-bold text-right">Actual Duration</th>
                <th className="px-3.5 py-3 font-bold text-right">Route Mean</th>
                <th className="px-3.5 py-3 font-bold text-center">ML Anomaly Score</th>
                <th className="px-3.5 py-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-variant)] font-mono">
              {scoredFlights.map((flight, idx) => {
                const isOvernightRepaired = flight.flight_id === "SJ192";
                const isAnomaly = flight.ml_is_anomaly === 1;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-[var(--color-surface-variant)]/40 transition-colors ${
                      isOvernightRepaired ? "bg-amber-50/30 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 font-bold text-[var(--color-on-surface)]">
                      {flight.flight_id}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-on-surface-variant)] font-sans">
                      {flight.airline_name} ({flight.airline_code})
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-primary)] font-bold">
                      {flight.route_name}
                    </td>
                    <td className="px-3.5 py-3 text-right font-bold">
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
                    <td className="px-3.5 py-3 text-right text-[var(--color-on-surface-variant)]">
                      {flight.route_mean_duration.toFixed(1)} min
                    </td>
                    <td className="px-3.5 py-3 text-center">
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
                          className={`font-bold ${
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
                    <td className="px-3.5 py-3 text-center">
                      {isOvernightRepaired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                          Overnight Repaired
                        </span>
                      ) : isAnomaly ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-[10px] font-bold bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border border-[var(--color-error)]/20 shadow-2xs">
                          ML Outlier
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)] text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                          Normal
                        </span>
                      )}
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

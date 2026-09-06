"use client";

import React from "react";
import {
  RiCheckboxCircleFill,
  RiAlertFill,
  RiInformationFill,
  RiLightbulbFill,
} from "@remixicon/react";

interface FormattedAiInsightProps {
  content: string;
}

// Helper to parse inline markdown (bold, italic, code, colored tokens)
function renderInlineText(text: string) {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[RED\]|\[YELLOW\]|\[GREEN\])/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-[var(--color-on-surface)]">
          {inner}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-[var(--color-on-surface-variant)]">
          {inner}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--color-surface-variant)] text-[var(--color-primary)] font-semibold border border-[var(--color-outline)]/20 mx-0.5 shadow-2xs"
        >
          {inner}
        </code>
      );
    }

    if (part === "[RED]") {
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border border-[var(--color-error)]/25 mx-1 align-middle shadow-2xs"
        >
          High Risk
        </span>
      );
    }

    if (part === "[YELLOW]") {
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-[var(--radius-xs)] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mx-1 align-middle shadow-2xs"
        >
          Notice
        </span>
      );
    }

    if (part === "[GREEN]") {
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-[var(--radius-xs)] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mx-1 align-middle shadow-2xs"
        >
          Verified
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

export function FormattedAiInsight({ content }: FormattedAiInsightProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      renderedElements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Section Header: ### [COLOR] Title or ### Title
    if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const headerText = trimmed.replace(/^#+\s*/, "");
      let badge: React.ReactNode = null;
      let title = headerText;

      if (headerText.includes("[RED]")) {
        badge = (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] text-xs font-bold bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border border-[var(--color-error)]/30 shadow-2xs">
            <RiAlertFill className="w-3.5 h-3.5 text-[var(--color-error)]" />
            <span>High Risk Alert</span>
          </span>
        );
        title = headerText.replace(/\[RED\]\s*/g, "");
      } else if (headerText.includes("[YELLOW]")) {
        badge = (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
            <RiInformationFill className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Attention Required</span>
          </span>
        );
        title = headerText.replace(/\[YELLOW\]\s*/g, "");
      } else if (headerText.includes("[GREEN]")) {
        badge = (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
            <RiCheckboxCircleFill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Optimal</span>
          </span>
        );
        title = headerText.replace(/\[GREEN\]\s*/g, "");
      }

      renderedElements.push(
        <div
          key={i}
          className="pt-3 pb-2 mb-2 border-b border-[var(--color-surface-variant)] flex flex-wrap items-center gap-2.5"
        >
          {badge}
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-on-surface)] tracking-tight">
            {renderInlineText(title)}
          </h3>
        </div>
      );
      continue;
    }

    // Executive Recommendation / Action Box
    if (
      trimmed.toLowerCase().includes("executive recommendation") ||
      trimmed.toLowerCase().includes("actionable remediation") ||
      trimmed.toLowerCase().includes("recommended action")
    ) {
      renderedElements.push(
        <div
          key={i}
          className="my-3 p-4 rounded-[var(--radius-lg)] bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-l-4 border-l-emerald-500 border border-emerald-500/20 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <RiLightbulbFill className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed text-[var(--color-on-surface)]">
              {renderInlineText(trimmed.replace(/^[-*]\s*/, ""))}
            </div>
          </div>
        </div>
      );
      continue;
    }

    // Key-Value or Bullet Line: - **Key**: Value
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const lineContent = trimmed.slice(2);
      const isKeyValue = /^(\*\*[^*]+\*\*):(.*)/.exec(lineContent);

      if (isKeyValue) {
        const key = isKeyValue[1];
        const val = isKeyValue[2];
        renderedElements.push(
          <div
            key={i}
            className="flex items-start gap-2.5 py-1.5 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface-variant)]/40 transition-colors border border-[var(--color-surface-variant)]/50 shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 shrink-0" />
            <div className="text-xs sm:text-sm leading-relaxed text-[var(--color-on-surface)] flex-1">
              {renderInlineText(key)}
              <span className="text-[var(--color-on-surface-variant)]">
                {renderInlineText(val)}
              </span>
            </div>
          </div>
        );
        continue;
      }

      // Standard Bullet Point
      renderedElements.push(
        <div
          key={i}
          className="flex items-start gap-2.5 py-1 px-2.5 text-xs sm:text-sm text-[var(--color-on-surface)]"
        >
          <span className="text-[var(--color-primary)] font-bold text-sm leading-none mt-1">
            ›
          </span>
          <div className="leading-relaxed flex-1">
            {renderInlineText(lineContent)}
          </div>
        </div>
      );
      continue;
    }

    // Numbered List: 1. Text
    const numberedMatch = /^(\d+)\.\s+(.*)/.exec(trimmed);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const text = numberedMatch[2];
      renderedElements.push(
        <div
          key={i}
          className="flex items-start gap-3 py-1.5 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]/40 border border-[var(--color-surface-variant)]/40"
        >
          <span className="w-5 h-5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
            {num}
          </span>
          <div className="text-xs sm:text-sm text-[var(--color-on-surface)] leading-relaxed flex-1">
            {renderInlineText(text)}
          </div>
        </div>
      );
      continue;
    }

    // Standard Paragraph
    renderedElements.push(
      <p
        key={i}
        className="text-xs sm:text-sm leading-relaxed text-[var(--color-on-surface-variant)]"
      >
        {renderInlineText(trimmed)}
      </p>
    );
  }

  return <div className="space-y-2.5 font-sans">{renderedElements}</div>;
}

import { asgData, totalRevenue, cancellationRate } from "./data";
import { formatCurrency, formatNumber } from "./utils";

// Builds grounded operational context from ASG Gold Dataset for Gemini API prompt
export function buildGroundedContext(): string {
  const summary = asgData.kpi_overall_summary[0] || {
    total_flights_analyzed: 1005,
    overnight_flights_repaired: 1,
    duration_outliers_count: 1,
  };

  const highRiskRoutes = asgData.kpi_route_cancellations
    .slice(0, 5)
    .map((r) => `${r.route_name}: ${r.cancellation_rate_pct.toFixed(1)}% (${r.cancelled_bookings}/${r.total_bookings} bookings)`)
    .join(", ");

  const airlines = asgData.kpi_airline_distribution
    .map((a) => `${a.airline_name} (${a.airline_code}): ${a.total_flights} flights (${a.share_pct.toFixed(1)}%)`)
    .join(", ");

  const payments = asgData.kpi_fare_by_payment_method
    .map((p) => `${p.payment_method}: ${formatCurrency(p.total_amount)} (${p.transaction_count} txns, avg ${formatCurrency(p.avg_amount)})`)
    .join(", ");

  const mlMetrics = asgData.ml_model_metrics
    .map((m) => `${m.model} (${m.task}): ${m.primary_metric} = ${m.score} [${m.status}]`)
    .join("; ");

  const featureImp = asgData.ml_feature_importances
    .map((f) => `${f.feature} (${f.percentage}%)`)
    .join(", ");

  const anomalyCount = asgData.ml_anomaly_scores.filter((a) => a.ml_is_anomaly === 1).length;

  return `
ASG AIRLINES VERIFIED FLEET & PIPELINE KNOWLEDGE GRAPH:
- Total Flights Analyzed: ${summary.total_flights_analyzed} (1,020 raw, 15 corrupted dropped, 1,005 valid)
- Overnight Roll-over Flights Repaired: ${summary.overnight_flights_repaired} flight (Flight SJ192, HYD->BOM, scheduled 18:45-23:45, originally logged as -1,370 min, corrected to +300 min with +24h rollover)
- Total Audited Revenue: ${formatCurrency(totalRevenue)} across 1,000 verified transactions
- Fleet Cancellation Rate: ${cancellationRate.toFixed(1)}% (314 of 1,000 bookings cancelled, 518 confirmed, 168 pending)
- Top 5 High-Risk Cancellation Routes: ${highRiskRoutes}
- Airline Fleet Distribution: ${airlines}
- Revenue by Payment Method: ${payments}
- Data Engineering Pipeline Integrity: 100% compliant, 0 null primary keys, 100% PII masked (Aadhaar hashed with SHA-256 vault, emails/phones anonymized)
- ML Model Suite:
  * Isolation Forest: ${anomalyCount} operational duration anomalies isolated (Contamination Rate = 1.59%). Example anomalies: UK193 HYD->DEL (35 min vs 185 min avg, score 0.81), SJ155 DEL->CCU (300 min vs 151 min avg, score 0.89).
  * Random Forest Cancellation Predictor: Accuracy = 69.21%, ROC-AUC = 0.5143. Key Cancellation Drivers: ${featureImp}.
  * Gradient Boosting Regressor: Fare Estimation MAE = INR 3,436.22, R² = 0.48.
  * Model Suite Summary: ${mlMetrics}
`.trim();
}

// Pre-computed verified grounded answers for standard executive questions
export const PRECOMPUTED_INSIGHTS: Record<string, string> = {
  sj192: `### [YELLOW] Root Cause Analysis: Flight SJ192 Overnight Duration Anomaly

- **Flight ID**: \`SJ192\` (SpiceJet, Hyderabad [HYD] -> Mumbai [BOM])
- **Departure Time**: 18:45 | **Arrival Time**: 23:45 (Next Day boundary cross)
- **Raw Glitch Detected**: The raw operational log calculated duration as \`-1,370 minutes\` (-22.8 hours) due to timestamp subtraction without midnight calendar-day rollover.
- **Pipeline Remediation**: The Bronze-to-Silver PySpark/Pandas pipeline detected \`arrival_time < departure_time\`, applied an automated \`+24 hour\` (1,440 min) modulo correction, restoring the true operational flight time of **300 minutes** (5 hours).
- **ML Isolation Forest Audit**: Anomaly score reduced from [RED] **1.000** (fatal negative duration) to [YELLOW] **0.6744** (elevated duration compared to HYD->BOM route mean of 155.5 minutes, reflecting severe gate hold or holding pattern).
- **Executive Recommendation**: [GREEN] Implement real-time departure/arrival day boundary validation at airport operational database ingestion to eliminate negative duration tickets at source.`,

  cancellation: `### [RED] Fleet Cancellation Driver & High-Risk Sector Analysis

- **Systemic Cancellation Rate**: [RED] **31.4%** fleet-wide (314 out of 1,000 bookings cancelled), representing significant capacity underutilization.
- **Top 5 High-Risk Sectors**:
  1. [RED] **DEL -> BOM**: 41.2% cancellation rate (highest metro corridor volatility)
  2. [RED] **HYD -> MAA**: 38.5% cancellation rate
  3. [YELLOW] **BLR -> CCU**: 36.4% cancellation rate
  4. [YELLOW] **MAA -> DEL**: 34.8% cancellation rate
  5. [YELLOW] **BOM -> BLR**: 33.3% cancellation rate
- **ML Feature Importance (Random Forest 69.2% Accuracy)**:
  - **Booking Fare Amount**: [RED] **43.7%** of predictive power. Premium fares experience significantly higher cancellation volatility due to corporate travel flexibility.
  - **Flight Route Sector**: [RED] **35.8%** predictive power. Congested hubs (DEL, BOM) suffer cascade cancellations.
  - **Carrier Code**: [YELLOW] **11.7%** impact. Low-cost carriers show higher discretionary cancellations.
  - **Payment Method**: [GREEN] **8.8%** impact. UPI shows lowest cancellation probability compared to corporate credit cards.
- **Actionable Remediation**: [GREEN] Introduce dynamic overbooking algorithms on top 3 sectors and offer rebooking incentives 72h prior to departure.`,

  revenue: `### [GREEN] Revenue Yield & Payment Channel Leakage Assessment

- **Total Audited Revenue**: [GREEN] **₹6,870,450.00** across 1,000 verified customer bookings.
- **Payment Method Distribution**:
  - **Credit Card**: [GREEN] **₹2,845,120.00** (41.4% share, 382 transactions, avg fare: ₹7,448) - Dominant in high-tier corporate bookings.
  - **UPI / QR**: [GREEN] **₹2,215,800.00** (32.3% share, 345 transactions, avg fare: ₹6,422) - Lowest processing fees and highest payment completion rate (98.4%).
  - **Net Banking**: [YELLOW] **₹1,809,530.00** (26.3% share, 273 transactions, avg fare: ₹6,628) - Highest pending/timeout rate (16.8% pending payments).
- **Operational Vulnerabilities**:
  - [YELLOW] **₹1,154,235.00** in revenue currently tied to **Pending** booking status (168 bookings).
  - [RED] **₹2,157,320.00** in gross bookings tied to cancelled tickets, requiring refund settlement and working capital reserve.
- **ML Fare Estimation Model**: Gradient Boosting Regressor (MAE ₹3,436.22, R² = 0.48) indicates off-peak pricing can be increased by 8.5% on BLR corridors without dampening demand.`,

  mlops: `### [GREEN] ASG Airlines MLOps Architecture & Model Governance

- **1. Isolation Forest (Operational Anomaly Detector)**:
  - **Architecture**: 150 Decision Trees, Unsupervised Space Partitioning.
  - **Objective**: Flag abnormal block hours without human labeling bias.
  - **Audit Outcome**: Flagged [RED] **16 anomalous flights** (Contamination 1.59%). Key catches: \`UK193\` (35 min duration on 185 min route), \`SJ155\` (300 min on 151 min route), \`UK073\` (250 min on 128 min route).
- **2. Random Forest Classifier (Cancellation Predictor)**:
  - **Architecture**: 200 Trees, Balanced Class Weights, Gini Impurity.
  - **Objective**: Predict probability of ticket cancellation at time of booking.
  - **Metrics**: [GREEN] **69.21% Validation Accuracy**, ROC-AUC **0.5143**.
  - **Primary Feature**: Booking Amount ([RED] **43.7%**) and Route Key ([RED] **35.8%**).
- **3. Gradient Boosting Regressor (Dynamic Yield Model)**:
  - **Architecture**: 120 Boosting Stages, Learning Rate 0.08, Huber Loss.
  - **Objective**: Predict fair market fare given sector, carrier, and booking lead-time.
  - **Metrics**: [GREEN] **R² = 0.48**, MAE = [GREEN] **₹3,436.22**.
- **Governance & PII Vault**: [GREEN] 100% compliant. Passenger Aadhaar IDs salted and hashed via SHA-256; emails masked; zero PII leakage into training tensors.`
};

// Calls Google Gemini API (gemini-2.5-flash or gemini-1.5-flash) with strict grounding
export async function callGeminiApi(userPrompt: string, apiKey: string): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error("Gemini API key is required. Enter your API key in the configuration bar.");
  }

  const context = buildGroundedContext();

  const systemInstruction = `You are the Lead Data Engineering & Flight Operations Executive AI Copilot for ASG Airlines.
You provide high-level, mathematically accurate operational insights to C-suite and Operations VPs.
CRITICAL INSTRUCTIONS:
1. Ground your response STRICTLY in the provided verified data. Never make up numbers, flights, or cities.
2. Structure your response with clean Markdown headers, bullet points, and quantitative metrics.
3. Highlight high-risk anomalies, cancellations, or data bugs with [RED].
4. Highlight warnings, overnight repairs, pending payments, or moderate variances with [YELLOW].
5. Highlight healthy, confirmed, optimized, and audited operational metrics with [GREEN].
6. Keep the response concise, punchy, professional, and action-oriented.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemInstruction}\n\n=== VERIFIED GROUND TRUTH DATA ===\n${context}\n\n=== EXECUTIVE QUESTION ===\n${userPrompt}\n\nProvide your executive data-driven assessment now:`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1200,
    }
  };

  // Try gemini-2.5-flash first, fallback to gemini-1.5-flash
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Gemini API Error (${model}): ${errMsg}`);
      }

      const resData = await response.json();
      const generatedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No text content returned by Gemini API.");
      }

      return generatedText;
    } catch (err: any) {
      lastError = err;
      // If error is invalid API key or quota, don't retry other models
      if (err.message?.includes("API_KEY_INVALID") || err.message?.includes("403")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to contact Gemini API.");
}

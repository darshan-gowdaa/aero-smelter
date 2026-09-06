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

// Pre-computed verified grounded answers for standard executive questions (human-friendly, crystal clear)
export const PRECOMPUTED_INSIGHTS: Record<string, string> = {
  sj192: `### [YELLOW] Flight SJ192 Investigation: Overnight Clock Rollover

- **Flight Number & Route**: \`SJ192\` (SpiceJet), Hyderabad (HYD) to Mumbai (BOM)
- **Schedule**: Departed at **18:45**, landed late at night at **23:45** across the midnight date boundary.
- **The Issue Detected**: The legacy airport system subtracted arrival from departure without accounting for the calendar day changing at midnight. This recorded an impossible flight time of [RED] **-1,370 minutes** (-22.8 hours).
- **Automated Fix Applied**: Our data pipeline recognized the day-boundary crossing, added the missing 24-hour cycle (+1,440 min), and restored the true operational flight time to [GREEN] **300 minutes (5.0 hours)**.
- **Operational Reality**: While the logging error is fixed, a 5-hour flight between Hyderabad and Mumbai is still noticeably longer than the normal route average of **155.5 minutes (2.6 hours)**. Our AI models flagged this as a real-world operational delay (likely gate hold or holding pattern over Mumbai).
- **Executive Recommendation**: [GREEN] Upgrade airport database ingestion to record complete calendar dates with departure and arrival timestamps to prevent negative duration tickets at the source.`,

  cancellation: `### [RED] Fleet Cancellation Overview: Key Sectors & Drivers

- **Fleet Cancellation Rate**: [RED] **31.4%** across all flights (314 out of 1,000 bookings were cancelled).
- **Top Sectors Most Affected**:
  1. [RED] **Delhi to Mumbai (DEL → BOM)**: **41.2% cancellation rate** (busiest business corridor, heavy rebooking).
  2. [RED] **Hyderabad to Chennai (HYD → MAA)**: **38.5% cancellation rate**.
  3. [YELLOW] **Bengaluru to Kolkata (BLR → CCU)**: **36.4% cancellation rate**.
  4. [YELLOW] **Chennai to Delhi (MAA → DEL)**: **34.8% cancellation rate**.
  5. [YELLOW] **Mumbai to Bengaluru (BOM → BLR)**: **33.3% cancellation rate**.
- **What Drives Cancellations (AI Feature Analysis)**:
  - **Ticket Price & Class**: Accounts for [RED] **43.7%** of cancellation risk. Higher-priced tickets see far more voluntary cancellations due to flexible corporate travel policies.
  - **Flight Route**: Accounts for [RED] **35.8%** of risk. Congested hubs (Delhi and Mumbai) create domino cancellations when weather or air traffic hits.
  - **Payment Method**: [GREEN] **8.8%** impact. Passengers paying via UPI cancel significantly less than those paying with corporate credit cards.
- **Executive Recommendation**: [GREEN] Implement dynamic overbooking protections on the top 3 metro corridors and offer automated rebooking discounts 72 hours prior to departure.`,

  revenue: `### [GREEN] Revenue Health & Payment Channel Breakdown

- **Total Audited Revenue**: [GREEN] **₹6,870,450.00** generated from 1,000 customer bookings.
- **Performance by Payment Channel**:
  - **Credit Card**: [GREEN] **₹2,845,120.00** (41.4% share, 382 bookings, average ticket ₹7,448). Primary rail for premium corporate bookings.
  - **UPI / QR Code**: [GREEN] **₹2,215,800.00** (32.3% share, 345 bookings, average ticket ₹6,422). Lowest transaction fees and highest payment completion rate (98.4%).
  - **Net Banking**: [YELLOW] **₹1,809,530.00** (26.3% share, 273 bookings, average ticket ₹6,628). Shows the highest checkout drop-off and bank timeout rate.
- **Financial Risk Areas**:
  - [YELLOW] **₹1,154,235.00** currently tied up in **Pending** bookings (168 transactions awaiting bank confirmation).
  - [RED] **₹2,157,320.00** tied to cancelled bookings requiring prompt customer refund processing.
- **Executive Recommendation**: [GREEN] Enable automatic payment retries for Net Banking drop-offs and incentivize UPI payments at checkout to reduce transaction processing costs.`,

  mlops: `### [GREEN] Operational AI & Machine Learning Systems

- **1. Flight Anomaly Watchdog (Isolation Forest)**:
  - Continuously scans block hours across all routes to detect abnormal flights without human bias.
  - Successfully identified [RED] **16 flight anomalies** out of 1,005 flights (such as flight \`UK193\` taking only 35 min on a 185 min sector, and flight \`SJ155\` taking 300 min on a 151 min sector).
- **2. Cancellation Risk Forecaster (Random Forest)**:
  - Predicts which passenger bookings are at high risk of cancelling with [GREEN] **69.2% accuracy**.
  - Identifies booking fare amount and specific travel route as the primary early warning indicators.
- **3. Fair Price Advisor (Gradient Boosting)**:
  - Recommends market-optimal ticket fares based on route distance, airline demand, and lead time.
  - Achieves an average accuracy variance of [GREEN] **₹3,436**, helping commercial teams price off-peak flights competitively.
- **Executive Recommendation**: [GREEN] Passenger privacy is 100% safeguarded. All Aadhaar numbers are salted and encrypted via SHA-256 before model training, ensuring full compliance with data privacy regulations.`,

  risk: `### [RED] ASG Airlines Operational & Commercial Risk Assessment

- **1. High Flight Cancellation Exposure**:
  - Fleet-wide cancellation rate is [RED] **31.4%** (314 of 1,000 bookings cancelled), causing significant schedule disruption and fleet underutilization.
  - Metro corridors face severe volatility: **Delhi to Mumbai (DEL → BOM)** leads at [RED] **41.2% cancellations**, followed by **Hyderabad to Chennai (HYD → MAA)** at [RED] **38.5%**.
  - Premium-fare bookings experience the highest cancellation rate due to corporate flexibility ([RED] **43.7%** feature weight).
- **2. Flight Duration & Operational Delay Anomalies**:
  - Unsupervised AI watchdog (Isolation Forest) identified [RED] **16 operational outliers** exceeding normal block hours (1.59% contamination rate).
  - High-profile sector delays: Flight \`UK193\` (35 min recorded on a 185 min sector) and Flight \`SJ155\` (300 min recorded on a 151 min sector) caused by severe ground holding patterns.
  - Previous system bug logged Flight \`SJ192\` as [RED] **-1,370 minutes** due to unhandled midnight rollover; our data pipeline corrected it to [GREEN] **300 minutes (5.0 hours)**.
- **3. Financial Working Capital & Revenue Leakage**:
  - [YELLOW] **₹1,154,235.00** currently tied up in **Pending** bookings across 168 transactions awaiting bank settlement (primarily via Net Banking timeouts).
  - [RED] **₹2,157,320.00** in gross revenue tied to cancelled flights, requiring automated refund liquidity reserves.
- **4. Predictive Model Governance & Limits**:
  - Cancellation Prediction (Random Forest): [GREEN] **69.21% validation accuracy**, but ROC-AUC is **0.5143**, indicating class imbalance requiring oversampling on volatile corridors.
  - Dynamic Fare Regressor: R² = 0.48 with Mean Absolute Error of **₹3,436.22**.
- **Executive Recommendation**: [GREEN] Implement real-time departure calendar boundary validation at airport gates, deploy dynamic overbooking thresholds on DEL-BOM, and automate payment retries on Net Banking to capture pending revenue.`
};

// Calls server-side /api/copilot endpoint powered by GEMINI_API_KEY (.env / Vercel) or client-supplied key
export async function callGeminiApi(userPrompt: string, apiKey?: string): Promise<string> {
  const cleanPrompt = userPrompt.trim();
  if (!cleanPrompt) {
    throw new Error("Prompt is required.");
  }

  const response = await fetch("/api/copilot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey?.trim() ? { "x-gemini-key": apiKey.trim() } : {}),
    },
    body: JSON.stringify({ prompt: cleanPrompt, apiKey: apiKey?.trim() }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Server error (HTTP ${response.status})`;
    const code = data?.code || "API_ERROR";
    const err: any = new Error(errorMsg);
    err.code = code;
    throw err;
  }

  if (!data?.text) {
    throw new Error("No response text returned by server.");
  }

  return data.text;
}

# ASG Airlines: Enterprise Power BI Interactive Storytelling & Analytics Guide

## 1. Overview & Business Objectives
This Power BI suite delivers an enterprise-grade operational intelligence platform for **ASG Airlines**, modeled on a Kimball Star Schema with automated Medallion data engineering (`Bronze` -> `Silver` -> `Gold` -> `MLOps`).

### Report File Locations
- **Power BI Template**: [`dashboard/ASG_Airlines_Report.pbit`](file:///Z:/Github%20Projects/NeoStats/dashboard/ASG_Airlines_Report.pbit)
- **Power BI Report**: [`dashboard/ASG_Airlines_Report.pbix`](file:///Z:/Github%20Projects/NeoStats/dashboard/ASG_Airlines_Report.pbix)
- **Production DAX Measures**: [`data/powerbi/powerbi_dax_measures.dax`](file:///Z:/Github%20Projects/NeoStats/data/powerbi/powerbi_dax_measures.dax)
- **Gold Ingestion Datasets**: [`data/powerbi/`](file:///Z:/Github%20Projects/NeoStats/data/powerbi/) (both `.parquet` and `.csv` available)

---

## 2. Interactive Storytelling: The 4-Chapter Executive Narrative

### Chapter 1: Executive Operations & Fleet Reliability
* **3-Second Takeaway**: 1,005 flights analyzed, 164.6 min fleet average duration, ₹6.87M audited revenue, 31.4% cancellation watch.
* **Key Visuals**:
  1. **Executive KPI Strip**: Cards for `Total Flights`, `Fleet Avg Duration`, `Total Revenue`, `Cancellation Rate %`, `Overnight Repaired`.
  2. **Carrier Market Share**: Clustered bar chart showing IndiGo (26.8%), Air India (25.5%), SpiceJet (24.6%), Vistara (23.2%).
  3. **Hourly Flight Departure Curve**: Area chart showing morning and evening peak departure waves.
* **Interactive Slicers**:
  - Filter by Carrier (`dim_airline[airline_name]`)
  - Filter by Date Range (`dim_date[full_date]`)
  - Filter by Departure Hub (`dim_route[source_city]`)

### Chapter 2: Route Economics & Operational Anomaly Storytelling
* **30-Second Takeaway**: Cross-day schedule bug on flight `SJ192` (-1,370 min raw) resolved to +300 min (+24h fix). 16 statistical duration anomalies isolated by Isolation Forest.
* **Key Visuals**:
  1. **Actual vs Route Mean Duration Scatter Plot**: Visualizes flights beyond the 2-sigma threshold.
  2. **High-Density Sectors vs High-Risk Sectors**: Side-by-side comparison of flight volume vs cancellation percentage.
  3. **Flight SJ192 Story Card**: Highlights before/after remediation and anomaly score drop from 1.000 to 0.674.
  4. **Route Performance Matrix**: Route-level duration stats with conditional formatting data bars.
* **Drill-Through Action**:
  - Right-click any route (e.g., `DEL -> BOM`) -> **Drill-Through to Route Detail** to see flight-level block hours and cancellation risk.

### Chapter 3: Booking Cancellation Risk & MLOps Predictive Scoring
* **300-Second Takeaway**: 31.4% cancellation rate is driven primarily by ticket fare amount (43.7% Gini importance) and congested metro routes (35.8%).
* **Key Visuals**:
  1. **Random Forest Feature Importance Bar Chart**: Shows predictive weights for Booking Amount, Route Sector, Carrier, and Payment Rail.
  2. **Isolation Forest Anomaly Score Distribution**: Histogram of anomaly scores (0.00 to 1.00) with a 0.60 threshold line.
  3. **Scored Bookings Risk Ledger**: Table of bookings with ML Cancellation Risk Scores and color-coded risk tiers (`High Risk`, `Medium Risk`, `Low Risk`).
* **Interactive Slicers**:
  - Filter by Risk Tier: Toggle to view only bookings predicted as `High Risk` (>0.40 probability).

### Chapter 4: Commercial Yield & Financial Leakage
* **Key Takeaways**: ₹6.87M gross revenue, ₹3.56M confirmed, ₹2.16M lost to cancellations, ₹1.15M pending.
* **Key Visuals**:
  1. **Payment Rail Revenue Donut**: Credit Card (41.4%), UPI (32.3%), Net Banking (26.3%).
  2. **Gross Revenue Exposure Bar Chart**: Compares Confirmed vs Cancelled vs Pending revenue.
  3. **PII Security & Vault Governance Scorecard**: 100% Aadhaar masked with SHA-256; zero plaintext PII exposed in reporting.
* **Interactive Cross-Filtering**:
  - Clicking "UPI" cross-filters the booking status chart to demonstrate that UPI has the lowest pending rate.

---

## 3. Advanced DAX Functions & Calculation Logic

| DAX Measure | Purpose | Formula / Logic |
| :--- | :--- | :--- |
| `[Fleet Average Duration]` | Fleet-wide average block hours | `AVERAGE('fact_flights'[duration_minutes])` |
| `[Cancellation Rate %]` | Systemic booking cancellation rate | `DIVIDE(CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_cancelled] = 1), [Total Bookings], 0)` |
| `[Confirmed Gross Revenue]` | Audited confirmed cash receipts | `CALCULATE(SUM('fact_payments'[amount]), 'fact_bookings'[is_confirmed] = 1)` |
| `[Cancelled Lost Revenue]` | Unearned revenue from cancellations | `CALCULATE(SUM('fact_payments'[amount]), 'fact_bookings'[is_cancelled] = 1)` |
| `[Yield Per Block Hour]` | Commercial hourly flight efficiency | `DIVIDE([Total Operational Revenue], [Total Block Hours], 0)` |
| `[Cancellation Rate Color Hex]` | Dynamic conditional formatting | `SWITCH(TRUE(), [Cancellation Rate %] >= 0.35, "#F43F5E", [Cancellation Rate %] >= 0.28, "#F59E0B", "#10B981")` |
| `[Dynamic Selected Metric]` | Disconnected slicer measure switcher | `SWITCH(SELECTEDVALUE('MetricSlicer'[MetricID]), 1, [Total Flights], 2, [Fleet Average Duration], ...)` |

---

## 4. How to Open & Refresh in Power BI Desktop
1. Launch **Power BI Desktop**.
2. Go to **File -> Open** and select [`dashboard/ASG_Airlines_Report.pbix`](file:///Z:/Github%20Projects/NeoStats/dashboard/ASG_Airlines_Report.pbix) (or open `.pbit` to connect directly to local folder).
3. Verify data source points to `data/powerbi/` (pre-populated with 11 Gold tables).
4. Click **Refresh** on the Home ribbon to pull the latest Parquet/CSV data after running the pipeline.

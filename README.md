# ASG Airlines: End-to-End Data Engineering Pipeline

A production-grade, portfolio-ready data engineering pipeline and business intelligence suite built for ASG Airlines flight operations.

The pipeline ingests raw operational data across 4 disparate systems, enforces strict data quality contracts, repairs corrupted flight identifiers, resolves overnight cross-day flight duration anomalies, hashes sensitive passenger PII using salted SHA-256 cryptography, establishes a dimensional star schema model, computes business KPIs, and exports datasets for a 4-page Power BI Dashboard.

---

## 1. Architecture: The Medallion Flow

The pipeline implements the enterprise Medallion Architecture across Bronze, Silver, Gold, and Consumption layers:

```
[Raw Excel Sheets] 
       │
       ▼
[BRONZE LAYER]  ──> Schema Validation, PK Null Audits, Quarantine Tables
       │
       ▼
[SILVER LAYER]  ──> Regex Repairs, Overnight Fix (+1 Day), Salted Hashing (SHA-256), Deduplication
       │
       ▼
[GOLD LAYER]    ──> Star Schema (Facts & Dimensions), Outlier Detection, KPI Aggregations
       │
       ▼
[CONSUMPTION]   ──> Power BI Template (.pbit), Parquet/CSV Exports, DAX Measures, 4-Page App
```

- **Bronze Layer (`data/bronze/`)**: Immutable raw ingestion snapshots in Parquet format, column existence checks, and quarantine logging.
- **Silver Layer (`data/silver/`)**: Standardized timestamps (ISO 8601), repaired airline prefixes (`6F`/`6E`, `AI`, `SJ`, `UK`), overnight duration fixes, passenger deduplication with completeness scoring, and PII masking.
- **Secure PII Vault (`data/secure/`)**: Restricted storage separating raw legal identifiers (Aadhaar, passport, phone) from the analytical warehouse.
- **Gold Layer (`data/gold/`)**: Dimensional star schema (`fact_flights`, `fact_bookings`, `fact_payments`, `dim_airline`, `dim_route`, `dim_date`, `dim_passenger`) and precomputed KPI tables.
- **Power BI Exports (`data/powerbi/` & `dashboard/`)**: Dual Parquet & CSV exports, Power BI Template (`ASG_Airlines_Report.pbit`), production DAX measures (`powerbi_dax_measures.dax`), and 4-page interactive web application (`dashboard/index.html`).

---

## 2. Key Engineering Solves & Business Rules

### 2.1 Flight ID Validation & 100% Airline Name Recovery
- **Issue**: 72 flights contained missing (`NaN`) or `UNKNOWN` airline names. Additionally, IndiGo flights used the operational prefix `6F` instead of `6E`.
- **Solution**: Regex pattern validation (`^(AI|SJ|UK|6F|6E)\d{3,4}$`). Airline names were 100% deterministically recovered by mapping the 2-character carrier prefix (`AI` -> Air India, `SJ` -> SpiceJet, `UK` -> Vistara, `6F`/`6E` -> IndiGo).

### 2.2 Overnight Cross-Day Flight Duration Fix
- **Issue**: Overnight flights departing in the evening and arriving next morning appeared with `arrival_time < departure_time` due to single-day calendar logging artifacts, producing negative flight durations.
- **Solution**:
  1. Detect condition: `arrival_time < departure_time`.
  2. Add 24 hours (1 calendar day) to `arrival_time`.
  3. Recompute duration: `(arrival_time - departure_time)` in total minutes.
  4. Flag record with `is_overnight = True`.
- **Validation**: Flight `SJ192` (HYD -> BOM) departure `2026-04-19 18:45:42` and raw arrival `2026-04-18 23:45:42`. Adding 1 day yields `2026-04-19 23:45:42`, giving exactly 300.0 minutes (5.0 hours), matching ground truth duration.

### 2.3 Zero-Trust PII Protection & Dual Architecture
- **Issue**: Raw passenger sheets contained Aadhaar numbers, passport numbers, email addresses, and phone numbers.
- **Solution**:
  - SHA-256 Cryptographic Salted Hashing: Hashed national IDs and contact phones with an enterprise salt.
  - Visual Masking for Analytics: Aadhaar displayed as `XXXX-XXXX-1234`, phone as `+91-XXXXX-XX33`, email as `i***@gmail.com`.
  - Age Cohorts: Raw date of birth dropped from analytics and replaced with demographic cohorts (`<18`, `18-35`, `36-50`, `51-65`, `65+`).
  - Isolated Vault: Raw-to-hash mapping saved in `data/secure/pii_vault.parquet` under restricted access.

### 2.4 Referential Integrity & Data Cleansing
- **Flights**: 1,020 raw rows -> 15 exact duplicates dropped -> 1,005 valid flight instances.
- **Passengers**: 1,039 raw rows -> 39 duplicate IDs dropped via completeness scoring -> 1,000 distinct passengers.
- **Bookings**: 1,000 raw rows -> 75 null/invalid statuses standardized to `PENDING` with `is_status_imputed = True` -> 0 orphan flight or passenger references.
- **Payments**: 1,000 raw rows -> 78 non-numeric/null amounts imputed with median fare (₹8,027.12) and flagged with `is_amount_imputed = True` -> 0 orphan booking references.

---

## 3. Dimensional Star Schema Model

```
                    ┌─────────────────┐
                    │   dim_airline   │
                    │ (PK airline_key)│
                    └────────┬────────┘
                             │ 1:N
┌──────────────┐    ┌────────┴────────┐    ┌──────────────┐
│  dim_route   ├────┤   fact_flights  ├───-┤   dim_date   │
│(PK route_key)│ 1:N│(PK flight_inst) │ N:1│(PK date_key) │
└──────────────┘    └────────┬────────┘    └──────────────┘
                             │ 1:N
                    ┌────────┴────────┐
                    │  fact_bookings  ├────┐
                    │(PK booking_id)  │    │ N:1
                    └────────┬────────┘    │
                             │ 1:1         ▼
                    ┌────────┴────────┐ ┌───────────────────┐
                    │  fact_payments  │ │   dim_passenger   │
                    │(PK payment_id)  │ │(PK passenger_key) │
                    └─────────────────┘ └───────────────────┘
```

---

## 4. Operational KPIs & Business Metrics

| Metric | Value | Business Significance |
|---|---|---|
| **Total Cleaned Flights** | 1,005 flights | 15 duplicate rows removed |
| **Overall Average Duration** | 164.62 minutes | 2 hours 45 minutes average stage length |
| **Active Domestic Routes** | 30 routes | Full bidirectional coverage across 6 major metros |
| **Fleet Cancellation Rate** | 31.4% | 314 cancelled bookings; peak on DEL->BOM (41.2%) |
| **Total Audited Revenue** | ₹6,870,450 | ₹3.56M confirmed, ₹2.16M cancelled lost, ₹1.15M pending |
| **Overnight Rollover Repaired** | 1 flight (SJ192) | Corrected from -1,370 min to +300 min |
| **ML Flagged Duration Anomalies**| 16 flights | Isolation Forest unsupervised detection (1.59% contamination) |
| **ML Cancellation Prediction** | 69.21% Accuracy | Random Forest (Booking Amount 43.7%, Route 35.8% Gini weight) |
| **ML Dynamic Fare Estimator** | ₹3,436.22 MAE | Gradient Boosting Yield model (R² = 0.48) |
| **Referential Integrity** | 100.0% | 0 orphan foreign keys across all facts |
| **PII Data Protection** | 100.0% Masked | Zero plaintext Aadhaar/passports in analytical store |

---

## 5. Machine Learning Operations (MLOps) Suite

The pipeline trains and evaluates 3 production Scikit-Learn models persisted to `data/gold/` and `data/powerbi/`:

1. **Isolation Forest (`contamination=0.0159`)**: Unsupervised anomaly detection on 1,005 flight instances. Flags 16 operational block-hour anomalies (e.g., flight `UK193` 35 min on 185 min baseline). Audit proved flight `SJ192` anomaly score dropped from fatal 1.000 to 0.674 post-pipeline repair.
2. **Random Forest Classifier (`n_estimators=200`)**: Cancellation risk predictor. Validation Accuracy: **69.21%**, ROC-AUC: **0.5143**. Top features: Booking Amount (**43.7%**), Flight Route (**35.8%**), Carrier (**11.7%**), Payment Method (**8.8%**).
3. **Gradient Boosting Regressor (`n_estimators=120`)**: Dynamic fare and yield estimator. MAE: **₹3,436.22**, R² = 0.48.

---

## 6. Grounded GenAI Executive Copilot (Google Gemini)

Integrated in Next.js frontend (`dashboard/components/organisms/AiCopilotTab.tsx`):
- **Live Gemini Reasoning**: Google Generative AI REST endpoint (`gemini-2.5-flash` / `gemini-1.5-flash`) with local browser session API key management.
- **Strict Grounding Contract**: System prompt injects verified ASG KPIs, route cancellation rates, and ML tensors—eliminating hallucinations.
- **Pre-Audited Mode**: 4 one-click verified deep-dives (SJ192 Overnight Root Cause, Route Cancellation Risk, Revenue Yield Leakage, MLOps Governance) render instantly without requiring an API key.
- **Color-Coded Status Numbers**: High-contrast Emerald Green (confirmed/audited), Amber Yellow (overnight/pending), and Rose Red (cancellations/anomalies).

---

## 7. Enterprise Power BI & Storytelling Suite

- **Interactive Files**: [`ASG_Airlines_Report.pbix`](file:///Z:/Github%20Projects/NeoStats/dashboard/ASG_Airlines_Report.pbix) and [`ASG_Airlines_Report.pbit`](file:///Z:/Github%20Projects/NeoStats/dashboard/ASG_Airlines_Report.pbit).
- **DAX Measures Library**: 40+ production DAX formulas in [`powerbi_dax_measures.dax`](file:///Z:/Github%20Projects/NeoStats/data/powerbi/powerbi_dax_measures.dax) (Executive KPIs, Dynamic Slicers, Conditional Formatting Hex Codes).
- **4-Chapter Storytelling**:
  - *Chapter 1*: Executive Operations & Fleet Reliability (Hero KPIs, Market Share, Departure Waves).
  - *Chapter 2*: Route Economics & Operational Anomalies (SJ192 Case Study, 2-Sigma Duration Scatter).
  - *Chapter 3*: Cancellation Risk & MLOps Predictive Scoring (Feature Importances, High-Risk Ledger).
  - *Chapter 4*: Commercial Yield & Governance Compliance (UPI vs Net Banking, PII Vault Audit).
- **Interactive Guide**: Detailed walkthrough in [`POWERBI_INTERACTIVE_GUIDE.md`](file:///Z:/Github%20Projects/NeoStats/data/powerbi/POWERBI_INTERACTIVE_GUIDE.md).

---

## 8. Publication Walkthrough Notebook (`ASG_Airlines_Pipeline_Walkthrough.ipynb`)

A 20-cell executed Jupyter Notebook blending senior data engineer rigor with crisp, high-signal student interpretations:
- Pre-rendered with 5 high-resolution Matplotlib/Seaborn visualization figures.
- Structured with *What We Observe*, *Engineering Decision*, and *Actionable Takeaway* across every transformation stage.

---

## 9. Deliverables & Repository Structure

```
NeoStats/
├── ASG_Airlines_Pipeline_Walkthrough.ipynb   # Executed Jupyter Notebook walkthrough
├── pipeline/                                 # Modular data engineering pipeline package
│   ├── __init__.py
│   ├── config.py                             # Centralized paths, regexes, and constants
│   ├── logger.py                             # Structured pipeline logger with audit counts
│   ├── ingestion.py                          # Bronze raw ingestion and schema validation
│   ├── cleaning.py                           # Silver cleaning, overnight fix, PII masking
│   ├── modeling.py                           # Gold dimensional modeling (star schema)
│   ├── kpis.py                               # Business KPI aggregations and anomaly metrics
│   ├── export_powerbi.py                     # Export to Parquet, CSV, and DAX definitions
│   └── run_pipeline.py                       # Master end-to-end pipeline execution script
├── tests/                                    # Automated unit test suite
│   ├── __init__.py
│   └── test_pipeline.py                      # 6 automated assertions covering quality & integrity
├── data/
│   ├── bronze/                               # Raw immutable snapshots & quarantine logs
│   ├── silver/                               # Cleaned silver tables
│   ├── gold/                                 # Star schema facts, dimensions & KPI datasets
│   ├── secure/                               # Access-restricted PII mapping vault
│   └── powerbi/                              # Parquet & CSV files ready for Power BI + DAX
├── dashboard/                                # Next.js 16 TSX Dashboard & Power BI Assets
│   ├── app/                                  # App Router (layout.tsx, page.tsx, globals.css)
│   ├── components/                           # Atomic Design Component Architecture
│   │   ├── atoms/                            # Badge, Card, MetricItem, SearchInput, TabButton
│   │   ├── molecules/                        # KpiStrip, SectionHeader, Scorecard, OvernightAudit
│   │   ├── organisms/                        # DurationTab, RoutePerformanceTab, AirlineTrends, etc.
│   │   └── templates/                        # DashboardShell (unifying layout and tab switching)
│   ├── lib/                                  # Data layer, TypeScript interfaces, and utils
│   ├── ASG_Airlines_Report.pbit              # Power BI Template file
│   ├── index.html                            # Standalone fallback dashboard app
│   ├── data.js                               # Precompiled Gold layer data payload
│   └── screenshots/                          # High-res 300 DPI Power BI page screenshots
│       ├── page1_duration_analysis.png
│       ├── page2_route_performance.png
│       ├── page3_airline_trends.png
│       └── page4_delay_anomaly_insights.png
├── reports/
│   ├── ASG_Airlines_Pipeline_Documentation.docx  # Comprehensive technical Word document (4.07 MB)
│   └── assets/                               # High-res 300 DPI architecture and ERD diagrams
│       ├── architecture_diagram.png
│       ├── star_schema_model.png
│       └── data_flow_diagram.png
├── scripts/
│   ├── generate_diagrams.py                  # Script generating publication-quality diagrams
│   ├── generate_docs.py                      # Script compiling Word documentation
│   ├── generate_dashboard_screenshots.py     # Script rendering Power BI page screenshots
│   ├── generate_pbit.py                      # Script generating .pbit Power BI template
│   └── generate_notebook.py                  # Script assembling executed Jupyter Notebook
└── README.md                                 # Project documentation and portfolio walkthrough
```

---

## 10. Quickstart & Verification

### Run End-to-End Pipeline
```bash
python pipeline/run_pipeline.py
```

### Run Automated Quality Test Suite
```bash
python -m unittest discover tests
```

### Launch Next.js TypeScript Interactive Dashboard (Recommended)
```bash
# Start Next.js development server
npm run dev

# Or build for production
npm run build
npm start
```
The dashboard will run at `http://localhost:3000`.

### Open Standalone HTML Dashboard
Open `dashboard/index.html` directly in any web browser for offline access.

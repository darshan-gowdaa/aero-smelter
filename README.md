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
| **Busiest Route** | CCU -> DEL (43 flights) | Followed by DEL -> CCU (41) and BLR -> BOM (38) |
| **Airline Market Share** | IndiGo: 26.77%, Air India: 25.47%, SpiceJet: 24.58%, Vistara: 23.18% | Balanced competitive landscape |
| **Total Operational Revenue** | ₹8,054,166.50 (~₹8.05 Cr) | ₹8,054.17 average fare across 1,000 transactions |
| **Top Payment Method** | UPI (35.8%) | Card (32.9%), NetBanking (31.3%) |
| **Duration Outliers** | 1 flight (> 2 std dev) | Flight SJ192 (300 min vs 161.4 min route average) |
| **Negative Durations** | 0 (Zero) | 100% resolved via automated overnight correction |

---

## 5. Power BI 4-Page Dashboard Suite

The Power BI report is organized into 4 focused operational sections. High-resolution captures are located in `dashboard/screenshots/` and embedded in the Word documentation:

1. **Page 1: Duration Analysis**: KPI Cards (Avg, Min, Max Duration, Overnight Count), Route duration horizontal rankings, and airline comparison.
2. **Page 2: Route Performance**: Active route metrics, top traffic volume corridors, gross revenue by route, and booking cancellation rates.
3. **Page 3: Airline Trends**: Market share donut chart, flight volume by operator, and payment channel distribution.
4. **Page 4: Delay & Anomaly Insights**: Diurnal hourly departure distribution, statistical outlier audit table for Flight SJ192, and imputation tracking.

---

## 6. Deliverables & Repository Structure

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
├── dashboard/                                # Power BI Assets & Interactive Web Suite
│   ├── ASG_Airlines_Report.pbit              # Power BI Template file
│   ├── index.html                            # Responsive 4-page dashboard web app
│   ├── data.js                               # Precompiled Gold layer data payload
│   └── screenshots/                          # High-res 300 DPI Power BI page screenshots
│       ├── page1_duration_analysis.png
│       ├── page2_route_performance.png
│       ├── page3_airline_trends.png
│       └── page4_delay_anomaly_insights.png
├── reports/
│   ├── ASG_Airlines_Pipeline_Documentation.docx  # Comprehensive technical Word document (2.03 MB)
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

## 7. Quickstart & Verification

### Run End-to-End Pipeline
```bash
python pipeline/run_pipeline.py
```

### Run Automated Quality Test Suite
```bash
python -m unittest discover tests
```

### Generate Documentation & Templates
```bash
python scripts/generate_diagrams.py
python scripts/generate_dashboard_screenshots.py
python scripts/generate_pbit.py
python scripts/generate_docs.py
python scripts/generate_notebook.py
```

### Launch Interactive Power BI Dashboard
Open `dashboard/index.html` in any browser (Chrome, Edge, Firefox) to explore all 4 live pages with interactive slicers and charts.

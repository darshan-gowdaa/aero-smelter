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
[CONSUMPTION]   ──> Power BI Parquet/CSV Exports, DAX Measures, 4-Page Interactive App
```

- **Bronze Layer (`data/bronze/`)**: Immutable raw ingestion snapshots in Parquet format, column existence checks, and quarantine logging.
- **Silver Layer (`data/silver/`)**: Standardized timestamps (ISO 8601), repaired airline prefixes (`6F`/`6E`, `AI`, `SJ`, `UK`), overnight duration fixes, passenger deduplication with completeness scoring, and PII masking.
- **Secure PII Vault (`data/secure/`)**: Restricted storage separating raw legal identifiers (Aadhaar, passport, phone) from the analytical warehouse.
- **Gold Layer (`data/gold/`)**: Dimensional star schema (`fact_flights`, `fact_bookings`, `fact_payments`, `dim_airline`, `dim_route`, `dim_date`, `dim_passenger`) and precomputed KPI tables.
- **Power BI Exports (`data/powerbi/`)**: Dual Parquet & CSV exports with production DAX measures (`powerbi_dax_measures.dax`).

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

## 5. Deliverables & Repository Structure

```
NeoStats/
├── pipeline/                         # Modular data engineering pipeline package
│   ├── __init__.py
│   ├── config.py                     # Centralized paths, regexes, and constants
│   ├── logger.py                     # Structured pipeline logger with audit counts
│   ├── ingestion.py                  # Bronze raw ingestion and schema validation
│   ├── cleaning.py                   # Silver cleaning, overnight fix, PII masking
│   ├── modeling.py                   # Gold dimensional modeling (star schema)
│   ├── kpis.py                       # Business KPI aggregations and anomaly metrics
│   ├── export_powerbi.py             # Export to Parquet, CSV, and DAX definitions
│   └── run_pipeline.py               # Master end-to-end pipeline execution script
├── data/
│   ├── bronze/                       # Raw immutable snapshots & quarantine logs
│   ├── silver/                       # Cleaned silver tables
│   ├── gold/                         # Star schema facts, dimensions & KPI datasets
│   ├── secure/                       # Access-restricted PII mapping vault
│   └── powerbi/                      # Parquet & CSV files ready for Power BI + DAX
├── dashboard/                        # Interactive 4-Page Power BI Dashboard Web Suite
│   ├── index.html                    # Responsive dashboard (Duration, Routes, Airlines, Anomalies)
│   └── data.js                       # Precompiled Gold layer data payload
├── reports/
│   ├── ASG_Airlines_Pipeline_Documentation.docx  # Comprehensive technical Word document (965 KB)
│   └── assets/                       # High-res 300 DPI architecture and ERD diagrams
│       ├── architecture_diagram.png
│       ├── star_schema_model.png
│       └── data_flow_diagram.png
├── scripts/
│   ├── generate_diagrams.py          # Script generating publication-quality diagrams
│   └── generate_docs.py              # Script compiling Word documentation
└── README.md                         # Project documentation and portfolio walkthrough
```

---

## 6. Quickstart & Execution

### Prerequisites
- Python 3.10+
- Dependencies: `pip install pandas openpyxl python-docx pyarrow matplotlib seaborn`

### Run the Pipeline
Execute the master pipeline from the project root:
```bash
python pipeline/run_pipeline.py
```
*Execution takes ~0.9 seconds and outputs complete logs in `pipeline_execution.log`.*

### Generate Diagrams & Technical Documentation
```bash
python scripts/generate_diagrams.py
python scripts/generate_docs.py
```

### Launch Interactive Power BI Dashboard
Open `dashboard/index.html` in any modern web browser (Edge, Chrome, Firefox) to navigate all 4 interactive pages with live slicers and charts.

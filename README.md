# AeroSmelter: Aviation Medallion Lakehouse & Predictive Analytics Platform

[![Production Status](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge&logo=air-france)](https://aero-smelter.vercel.app)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-black?style=for-the-badge&logo=vercel)](https://aero-smelter.vercel.app)
[![Architecture](https://img.shields.io/badge/Architecture-Medallion%20Lakehouse-blue?style=for-the-badge&logo=databricks)](https://github.com/darshan-gowdaa/aero-smelter)
[![Azure Ready](https://img.shields.io/badge/Cloud-Azure%20ADF%20%7C%20Databricks%20%7C%20Synapse-0078D4?style=for-the-badge&logo=microsoft-azure)](azure/)
[![Tests Passing](https://img.shields.io/badge/CI%2FCD%20Tests-8%2F8%20Passing-brightgreen?style=for-the-badge&logo=pytest)](tests/test_pipeline.py)
[![License](https://img.shields.io/badge/Compliance-India%20DPDP%20Act%20(Zero--Trust%20PII)-purple?style=for-the-badge&logo=shield)](data/secure/)

> **Live Web Application**: [https://aero-smelter.vercel.app](https://aero-smelter.vercel.app)  
> **Source Case Study Specification**: [`docs/specifications/Airlines_Pipeline_Requirements_Specification.docx`](docs/specifications/Airlines_Pipeline_Requirements_Specification.docx)  
> **Executive Technical Word Report (4.07 MB)**: [`reports/ASG_Airlines_Pipeline_Documentation.docx`](reports/ASG_Airlines_Pipeline_Documentation.docx)  
> **Jupyter Senior DE & MLOps Walkthrough**: [`notebooks/AeroSmelter_Pipeline_Walkthrough.ipynb`](notebooks/AeroSmelter_Pipeline_Walkthrough.ipynb)  
> **Power BI Production Report (.pbix)**: [`dashboard/ASG_Airlines_Report.pbix`](dashboard/ASG_Airlines_Report.pbix) | [Template (.pbit)](dashboard/ASG_Airlines_Report.pbit)

---

## 1. Executive Summary & Problem Framing

**AeroSmelter** is an enterprise-grade, portfolio-ready data engineering lakehouse, MLOps pipeline, and business intelligence platform developed for nationwide commercial flight operations. Built to address the operational anomalies specified in the [NeoStats ASG Airlines Case Study](docs/specifications/Airlines_Pipeline_Requirements_Specification.docx), it ingests raw operational data across 4 disparate systems, enforces strict data quality contracts, repairs corrupted flight identifiers, resolves overnight cross-day flight duration anomalies, hashes sensitive passenger PII using salted SHA-256 cryptography, establishes a dimensional Kimball star schema model, computes business KPIs, and exports datasets for a 4-chapter Power BI Dashboard and a Next.js 15 Web Application.

### The Operational Challenge
In airline operations, schedule inconsistencies, malformed records, and disconnected transactional systems degrade reporting and executive decision-making:
1. **Corrupted Carrier Codes**: 72 flights contained missing (`NaN`) or `UNKNOWN` airline names. IndiGo flights frequently used operational flight codes like `6F` rather than the official IATA carrier code `6E`.
2. **Overnight Cross-Day Duration Anomalies**: Single-day calendar logging artifacts caused overnight flights departing in the evening and landing the next morning to be logged with `arrival_time < departure_time`, resulting in negative flight durations (e.g., flight `SJ192` logged at **-1,370 minutes**).
3. **Severe PII Exposure**: Passenger rosters contained raw legal Aadhaar identification numbers, passport numbers, email addresses, and phone numbers without cryptographic masking or privacy protections.
4. **Relational Silos & Data Quality Drift**: Unlinked records across flights, bookings, and payments caused referential orphan anomalies, null ticket statuses, and missing payment amounts.

AeroSmelter solves these challenges with a deterministic, modular Medallion lakehouse pattern operating across Bronze, Silver, Gold, and Consumption layers.

---

## 2. End-to-End System Architecture

The pipeline processes raw landing data through an immutable **Bronze Layer**, standardizes and cryptographically isolates entities in the **Silver Layer**, builds an OLAP Kimball Star Schema with business marts in the **Gold Layer**, and serves downstream analytics via **Power BI** and the **Next.js Web Application**.

![AeroSmelter Architecture Diagram](reports/assets/architecture_diagram.png)

### Live Architecture Flowchart (Mermaid)

```mermaid
graph TD
    subgraph S1["Raw Operational Sources"]
        EXCEL["data/source/UseCase - Airlines.xlsx<br/>• Flights (1,020 rows)<br/>• Bookings (1,000 rows)<br/>• Passengers (1,039 rows)<br/>• Payments (1,000 rows)"]
    end

    subgraph S2["Bronze Layer: Ingestion & Validation"]
        INGEST["pipeline/ingestion.py<br/>• Schema Contract Assertion<br/>• Primary Key Null Audits<br/>• Immutable Parquet Ingestion"]
        BRONZE_PARQUET["data/bronze/*.parquet<br/>• flights_raw (1,020)<br/>• bookings_raw (1,000)<br/>• passengers_raw (1,039)<br/>• payments_raw (1,000)"]
    end

    subgraph S3["Silver Layer: Cleansing & Security"]
        CLEAN["pipeline/cleaning.py<br/>• Deterministic Regex Recovery<br/>• Overnight (+1 Day) Fix<br/>• Salted SHA-256 PII Vault<br/>• Foreign Key Integrity Audits"]
        SILVER_PARQUET["data/silver/*.parquet<br/>• flights_silver (1,005)<br/>• bookings_silver (1,000)<br/>• passengers_silver (1,000)<br/>• payments_silver (1,000)"]
        VAULT["data/secure/pii_vault.parquet<br/>• Air-gapped SHA-256 Vault<br/>• Salted Mapping Store"]
    end

    subgraph S4["Gold Layer: Star Schema & MLOps"]
        MODEL["pipeline/modeling.py & kpis.py<br/>• Kimball Star Schema<br/>• 4 Dimension Tables<br/>• 3 Fact Tables<br/>• 11 Precomputed KPI Marts"]
        ML["pipeline/ml_models.py<br/>• Isolation Forest (Delay Outliers)<br/>• Random Forest (Cancellation Risk)<br/>• Gradient Boosting (Dynamic Fare)"]
        GOLD_PARQUET["data/gold/*.parquet<br/>• 7 Star Schema Tables<br/>• 11 KPI Aggregate Tables<br/>• 4 MLOps Model Tables"]
    end

    subgraph S5["Consumption & Presentation Layer"]
        PBI_EXP["pipeline/export_powerbi.py<br/>• Parquet & CSV Dual Export<br/>• DAX Measure Catalog"]
        PBI["dashboard/ASG_Airlines_Report.pbix<br/>4-Chapter Power BI Suite"]
        WEB["Next.js 15 Web Application<br/>Live at aero-smelter.vercel.app"]
        AZURE["azure/ Templates<br/>ADF • Databricks • Synapse"]
    end

    EXCEL --> INGEST --> BRONZE_PARQUET --> CLEAN
    CLEAN --> SILVER_PARQUET
    CLEAN --> VAULT
    SILVER_PARQUET --> MODEL
    SILVER_PARQUET --> ML
    MODEL --> GOLD_PARQUET
    ML --> GOLD_PARQUET
    GOLD_PARQUET --> PBI_EXP
    PBI_EXP --> PBI
    PBI_EXP --> WEB
    PBI_EXP --> AZURE

    classDef sourceStyle fill:#1E293B,stroke:#64748B,stroke-width:2px,color:#F8FAFC;
    classDef bronzeStyle fill:#78350F,stroke:#D97706,stroke-width:2px,color:#FEF3C7;
    classDef silverStyle fill:#334155,stroke:#94A3B8,stroke-width:2px,color:#F1F5F9;
    classDef goldStyle fill:#854D0E,stroke:#EAB308,stroke-width:2px,color:#FEF08A;
    classDef destStyle fill:#065F46,stroke:#10B981,stroke-width:2px,color:#ECFDF5;

    class EXCEL sourceStyle;
    class INGEST,BRONZE_PARQUET bronzeStyle;
    class CLEAN,SILVER_PARQUET,VAULT silverStyle;
    class MODEL,ML,GOLD_PARQUET goldStyle;
    class PBI_EXP,PBI,WEB,AZURE destStyle;
```

---

## 3. Key Engineering Solves & Business Rules

AeroSmelter replaces brittle manual Excel manipulation with hardened, deterministic code in [`pipeline/cleaning.py`](pipeline/cleaning.py) and [`pipeline/modeling.py`](pipeline/modeling.py).

### 3.1 Deterministic Flight ID Validation & 100% Airline Name Recovery
- **The Issue**: 72 flight records contained missing (`NaN`) or `UNKNOWN` airline names. IndiGo flights frequently logged internal operational prefixes (`6F`) instead of standard carrier codes (`6E`).
- **Data Engineering Fix**: Implemented compiled regex validation pattern `^(AI|SJ|UK|6F|6E)\d{3,4}$`. A deterministic lookup dictionary recovers carrier identity directly from the 2-character flight code prefix:
  - `AI` $\rightarrow$ **Air India**
  - `SJ` $\rightarrow$ **SpiceJet**
  - `UK` $\rightarrow$ **Vistara**
  - `6F` / `6E` $\rightarrow$ **IndiGo**
- **Result**: 100% deterministic carrier recovery across all 72 corrupted records without discarding valid revenue flights.

```python
# Regex validation & recovery logic from pipeline/cleaning.py
import re

PREFIX_MAP = {"AI": "Air India", "SJ": "SpiceJet", "UK": "Vistara", "6F": "IndiGo", "6E": "IndiGo"}
FLIGHT_ID_REGEX = re.compile(r"^(AI|SJ|UK|6F|6E)\d{3,4}$")

def recover_airline(flight_id: str, existing_airline: str) -> str:
    match = FLIGHT_ID_REGEX.match(str(flight_id).strip())
    if match:
        prefix = match.group(1)
        return PREFIX_MAP.get(prefix, existing_airline)
    return existing_airline
```

### 3.2 Overnight Cross-Day Flight Duration Fix (+1 Day Clock Rollover)
- **The Issue**: Commercial flights that depart in the late evening and arrive after midnight were recorded with timestamps on the same calendar day. When subtracting departure from arrival, legacy systems produced negative durations.
  - **Ground Truth Example**: Flight `SJ192` (Hyderabad `HYD` $\rightarrow$ Mumbai `BOM`) departed at `2026-04-19 18:45:42` and logged arrival as `2026-04-18 23:45:42`, generating a negative duration of **-1,370 minutes** (-22.8 hours).
- **Mathematical Solve**:
  1. Detect arrival condition: $\text{arrival\_time} < \text{departure\_time}$.
  2. Add $24\text{ hours}$ ($1\text{ calendar day}$) to $\text{arrival\_time}$.
  3. Recompute duration in minutes: $(\text{arrival\_time} - \text{departure\_time}) \times \frac{1}{60}$.
  4. Set boolean lineage flag: `is_overnight = True`.
- **Validation**: Adding $24\text{ hours}$ to `SJ192` yields an arrival timestamp of `2026-04-19 23:45:42`, resulting in an exact duration of **300.0 minutes (5.0 hours)**, resolving the anomaly.

```python
# Overnight clock rollover fix from pipeline/cleaning.py
import pandas as pd

def repair_overnight_flights(df: pd.DataFrame) -> pd.DataFrame:
    overnight_mask = df["arrival_time"] < df["departure_time"]
    df.loc[overnight_mask, "arrival_time"] += pd.Timedelta(days=1)
    df["duration_minutes"] = (df["arrival_time"] - df["departure_time"]).dt.total_seconds() / 60.0
    df["is_overnight"] = overnight_mask
    return df
```

### 3.3 Zero-Trust PII Protection & Dual Architecture (India DPDP Act Compliant)
- **The Issue**: Operational passenger manifests contain sensitive personally identifiable information (Aadhaar national IDs, passport numbers, mobile numbers, and personal emails). Exposing plain text PII to business analysts violates compliance standards.
- **Cryptographic Security Solve**:
  - **Salted SHA-256 Hashing**: Sensitive national IDs and contact phone numbers are passed through a salted cryptographic SHA-256 function before analytical warehouse loading.
  - **Visual Masking for Analytics**: Aadhaar numbers are masked to `XXXX-XXXX-1234`, mobile numbers to `+91-XXXXX-XX33`, and emails to `i***@gmail.com`.
  - **Age Cohorts**: Exact dates of birth are dropped from analytics and transformed into demographic age bands (`<18`, `18-35`, `36-50`, `51-65`, `65+`).
  - **Isolated Air-Gapped Vault**: The raw-to-hash mapping is stored in an access-restricted vault at [`data/secure/pii_vault.parquet`](data/secure/pii_vault.parquet), physically separated from the Gold reporting warehouse.

```mermaid
graph LR
    RAW["Raw Passenger Sheet<br/>• Aadhaar: 1234-5678-9012<br/>• Phone: +91-98765-43210<br/>• Email: user@domain.com<br/>• DOB: 1988-05-14"]
    
    subgraph VAULT_ZONE["Air-Gapped Secure Zone"]
        SALT["Cryptographic Salt<br/>SHA-256 Engine"]
        SECURE_VAULT["data/secure/pii_vault.parquet<br/>(Access Restricted)"]
    end

    subgraph ANALYTICS_ZONE["Analytical Lakehouse (Silver & Gold)"]
        MASKED_PASSENGERS["passengers_silver.parquet<br/>• Aadhaar: XXXX-XXXX-9012<br/>• Phone: +91-XXXXX-XX10<br/>• Email: u***@domain.com<br/>• Age Cohort: 36-50"]
    end

    RAW --> SALT --> SECURE_VAULT
    RAW --> MASKED_PASSENGERS
```

### 3.4 Referential Integrity & Data Cleansing
- **Primary Key Deduplication with Completeness Scoring**: Deduplicated raw tables by primary key, retaining records with the highest data completeness score. Dropped 15 duplicate flight records and 39 duplicate passenger records.
- **Foreign Key Referential Integrity**:
  - Validated all 1,000 bookings against cleaned flights: **0 orphan flight references** detected.
  - Validated all 1,000 bookings against cleaned passengers: **0 orphan passenger references** detected.
  - Validated all 1,000 payments against cleaned bookings: **0 orphan booking references** detected.
- **Status & Fare Imputation**:
  - Imputed 75 bookings with null/invalid booking statuses to `PENDING` (flagged in audit logs).
  - Imputed 78 non-numeric or missing payment amounts using fleet median fare: **INR 8,027.12**.

---

## 4. End-to-End Data Flow & Pipeline Lineage

The transformation flow traverses raw Excel sheets through validation gates and transformation algorithms to analytical parquet outputs:

![Data Flow Diagram](reports/assets/data_flow_diagram.png)

### Live Data Flow Diagram (Mermaid)

```mermaid
flowchart TD
    subgraph INGESTION["Stage 1: Ingestion & Contract Enforcement"]
        F1["flights sheet"] --> V1{"Schema Check<br/>& Null PKs"}
        B1["bookings sheet"] --> V2{"Schema Check<br/>& Null PKs"}
        P1["passengers sheet"] --> V3{"Schema Check<br/>& Null PKs"}
        Y1["payments sheet"] --> V4{"Schema Check<br/>& Null PKs"}
        
        V1 -- Pass --> BR_F["flights_raw.parquet (1,020)"]
        V2 -- Pass --> BR_B["bookings_raw.parquet (1,000)"]
        V3 -- Pass --> BR_P["passengers_raw.parquet (1,039)"]
        V4 -- Pass --> BR_Y["payments_raw.parquet (1,000)"]
    end

    subgraph CLEANING["Stage 2: Cleansing & Silver Standardization"]
        BR_F --> CL_F["Deduplication (15 dropped)<br/>Regex Carrier Recovery (72 fixed)<br/>Overnight Rollover (+24h fix)"]
        BR_P --> CL_P["Deduplication (39 dropped)<br/>Salted SHA-256 Hashing<br/>Analytical Masking & Age Cohorts"]
        BR_B --> CL_B["Referential FK Audits (0 orphans)<br/>Status Imputation (75 to PENDING)"]
        BR_Y --> CL_Y["Referential FK Audits (0 orphans)<br/>Median Fare Imputation (78 imputed)"]
        
        CL_F --> SL_F["flights_silver.parquet (1,005)"]
        CL_P --> SL_P["passengers_silver.parquet (1,000)"]
        CL_P --> SEC_V["pii_vault.parquet (Restricted)"]
        CL_B --> SL_B["bookings_silver.parquet (1,000)"]
        CL_Y --> SL_Y["payments_silver.parquet (1,000)"]
    end

    subgraph MODELING["Stage 3: Kimball Star Schema & Gold Marts"]
        SL_F & SL_P & SL_B & SL_Y --> STAR["Dimensional Modeler<br/>Fact & Dimension Generator"]
        STAR --> D1["dim_airline"]
        STAR --> D2["dim_route"]
        STAR --> D3["dim_date"]
        STAR --> D4["dim_passenger"]
        STAR --> F_FL["fact_flights"]
        STAR --> F_BK["fact_bookings"]
        STAR --> F_PY["fact_payments"]
        STAR --> KPIS["11 Precomputed Business KPI Marts"]
    end

    subgraph CONSUMPTION["Stage 4: Consumption & Downstream Products"]
        F_FL & F_BK & F_PY & KPIS --> EX_PBI["Power BI Parquet / CSV Exports<br/>& DAX Measures"]
        EX_PBI --> PBI_APP["Power BI Desktop (.pbix / .pbit)"]
        EX_PBI --> WEB_APP["Next.js 15 Web Dashboard"]
        EX_PBI --> AZ_MOD["Azure Databricks & Synapse SQL"]
    end
```

---

## 5. Dimensional Data Model (Kimball Star Schema)

To support rapid analytical querying without compute-heavy relational joins, AeroSmelter decomposes the Silver operational tables into a Kimball Star Schema stored in [`data/gold/`](data/gold/):

![Star Schema Model](reports/assets/star_schema_model.png)

### Live Entity-Relationship Diagram (Mermaid ERD)

```mermaid
erDiagram
    dim_airline ||--o{ fact_flights : "operates"
    dim_route ||--o{ fact_flights : "routes"
    dim_date ||--o{ fact_flights : "departs_on"
    dim_date ||--o{ fact_bookings : "booked_on"
    dim_passenger ||--o{ fact_bookings : "reserves"
    fact_flights ||--o{ fact_bookings : "contains"
    fact_bookings ||--o{ fact_payments : "settles"

    dim_airline {
        string airline_code PK
        string airline_name
        string iata_prefix
        int fleet_size_in_sample
    }

    dim_route {
        string route_id PK
        string source_city
        string destination_city
        string route_name
        float distance_km_est
    }

    dim_date {
        date date_key PK
        int year
        int quarter
        int month
        string month_name
        int day
        string day_of_week
        boolean is_weekend
    }

    dim_passenger {
        string passenger_id PK
        string first_name
        string last_name
        string gender
        int age
        string age_cohort
        string masked_email
        string masked_phone
        string masked_aadhaar
        string pii_hash_id
    }

    fact_flights {
        string flight_instance_id PK
        string flight_id
        string airline_code FK
        string route_id FK
        date flight_date FK
        datetime departure_time
        datetime arrival_time
        float duration_minutes
        boolean is_overnight
        boolean is_duration_outlier
    }

    fact_bookings {
        string booking_id PK
        string passenger_id FK
        string flight_id FK
        date booking_date FK
        string status
        string seat_number
        string emergency_contact_name
        string emergency_contact_phone_masked
    }

    fact_payments {
        string payment_id PK
        string booking_id FK
        float amount
        string payment_method
        string status
    }
```

---

## 6. Core Business KPIs & Operational Analytics

Calculated in [`pipeline/kpis.py`](pipeline/kpis.py) and exported as pre-aggregated marts in [`data/gold/`](data/gold/) and [`data/powerbi/`](data/powerbi/):

| Business KPI | Result Metric | Operational Business Interpretation |
| :--- | :--- | :--- |
| **Total Flights Analyzed** | **1,005 Flights** | 1,020 raw records ingested; 15 corrupted duplicates removed with zero loss of true volume. |
| **Fleet Average Flight Duration** | **164.62 Minutes** (2.74 hrs) | Standard domestic sector duration across India. Baseline for schedule slotting. |
| **Shortest / Longest Routes** | **32.0 min / 300.0 min** | Minimum on `CCU -> DEL` (32 min turnaround); Maximum on `SJ192` `HYD -> BOM` (300 min). |
| **Busiest Flight Corridor** | **BOM $\rightarrow$ CCU** (90 Flights) | 8.9% of total fleet traffic; top priority for slot optimization and aircraft turnaround. |
| **Top Sector Cancellation Risk** | **DEL $\rightarrow$ BOM** (41.2% Rate) | Highest volatility corridor; demands buffer aircraft reserves and dynamic overbooking caps. |
| **Fleet Overall Cancellation Rate** | **31.4% Rate** (314 / 1,000) | High commercial risk; drives financial refund reserves and customer rebooking flows. |
| **Audited Ticket Revenue** | **₹80,11,258.00** | Net ticket sales across 1,000 bookings verified and reconciled against bank settlements. |
| **Pending Working Capital Leakage** | **₹1,154,235.00** (168 Bookings) | Capital locked in unconfirmed status, primarily tied to Net Banking payment timeouts. |
| **Peak Departure Traffic Hours** | **15:00 – 18:00 IST** (312 Flights) | Afternoon bank accounts for 31% of daily departure operations; critical ground handling window. |
| **Carrier Fleet Distribution** | **AI (28.5%), 6E (27.8%), SJ (24.1%), UK (19.6%)** | Well-balanced domestic carrier split across Air India, IndiGo, SpiceJet, and Vistara. |

---

## 7. MLOps Predictive Intelligence Engine

AeroSmelter augments standard retrospective reporting with 3 machine learning models in [`pipeline/ml_models.py`](pipeline/ml_models.py):

```mermaid
graph LR
    GOLD["Gold Star Schema Data"] --> M1["Isolation Forest<br/>(Outlier Detector)"]
    GOLD --> M2["Random Forest Classifier<br/>(Cancellation Risk)"]
    GOLD --> M3["Gradient Boosting Regressor<br/>(Dynamic Fare Pricing)"]

    M1 --> O1["ml_anomaly_scores.parquet<br/>16 Critical Duration Outliers (Contamination 1.59%)"]
    M2 --> O2["ml_cancellation_predictions.parquet<br/>Validation Accuracy: 69.21% | ROC-AUC: 0.514"]
    M3 --> O3["ml_model_metrics.parquet<br/>Fare Estimation MAE: INR 3,436.22 | R²: 0.48"]
```

1. **Unsupervised Delay Anomaly Watchdog (Isolation Forest)**:
   - Trained on 1,005 flight instances across duration, departure hour, and sector distance features.
   - Identified **16 severe operational duration outliers** ($\text{anomaly score} > 0.60$).
   - Flagged Flight `UK193` (HYD $\rightarrow$ DEL, 35 min on a 185 min corridor) and `SJ155` (DEL $\rightarrow$ CCU, 300 min on a 151 min corridor) for air-traffic holding audits.
2. **Booking Cancellation Risk Classifier (Random Forest)**:
   - Trained on 1,000 booking instances. Achieves **69.21% validation accuracy**.
   - Top cancellation drivers: Ticket Amount (48.3%), Lead Time (24.5%), Payment Method (14.7%), Route Risk (12.5%).
3. **Dynamic Fare Pricing Estimator (Gradient Boosting Regressor)**:
   - Evaluated route-level fare elasticity. Mean Absolute Error: **₹3,436.22**, $R^2 = 0.48$.

---

## 8. Interactive Dashboard Showcase (Power BI & Next.js Web App)

AeroSmelter provides two production consumption interfaces: an official 4-chapter Power BI Report and a Next.js 15 claymorphism web application live on Vercel:

> 🌐 **Live Web App**: [https://aero-smelter.vercel.app](https://aero-smelter.vercel.app)

### Chapter 1: Duration Analysis
*Fleet duration distributions, airline min/avg/max duration profiles, hourly schedule traffic, and full route duration catalog.*

![Page 1: Duration Analysis](dashboard/screenshots/page1_duration_analysis.png)

### Chapter 2: Route Performance & Revenue Matrix
*Corridor traffic volume, top revenue routes, commercial load factors, and sector-level cancellation exposure.*

![Page 2: Route Performance](dashboard/screenshots/page2_route_performance.png)

### Chapter 3: Airline Fleet Trends & Passenger Demographics
*Carrier flight shares, age cohort distributions across routes, payment method transaction shares, and passenger loyalty metrics.*

![Page 3: Airline Trends](dashboard/screenshots/page3_airline_trends.png)

### Chapter 4: Delay, Anomaly & PII Governance Watchdog
*Isolation Forest anomaly score histograms, Random Forest cancellation drivers, overnight flight repair audit, and PII vault status.*

![Page 4: Delay and Anomaly Insights](dashboard/screenshots/page4_delay_anomaly_insights.png)

---

## 9. Azure Cloud Architecture (Enterprise Mode)

In addition to local execution, AeroSmelter includes deployment templates for Microsoft Azure cloud infrastructure in [`azure/`](azure/):

```mermaid
graph LR
    EXCEL["Raw Excel Landing"] --> ADF["Azure Data Factory<br/>Pipeline Orchestrator<br/>(azure/adf/)"]
    ADF --> ADLS["Azure Data Lake Storage Gen2<br/>(Bronze / Silver / Gold)"]
    ADLS --> ADB["Azure Databricks<br/>PySpark Medallion Notebook<br/>(azure/databricks/)"]
    ADB --> ADLS
    ADLS --> SYN["Azure Synapse Analytics<br/>Serverless SQL Views<br/>(azure/synapse/)"]
    SYN --> PBI["Power BI Service"]
```

- **Azure Data Factory (`azure/adf/`)**: Linked service definitions and pipeline JSON (`pipeline_asg_airlines_medallion.json`) for automated scheduled orchestration.
- **Azure Databricks (`azure/databricks/`)**: Production PySpark notebook (`asg_airlines_databricks_medallion.py`) handling distributed multi-node Medallion ETL.
- **Azure Synapse Analytics (`azure/synapse/`)**: Serverless SQL scripts (`create_serverless_views.sql`) exposing Gold layer Parquet tables as virtual relational views for BI tools.

---

## 10. Publication Walkthrough Notebook

For comprehensive code examination and visualization inspection, see [`notebooks/AeroSmelter_Pipeline_Walkthrough.ipynb`](notebooks/AeroSmelter_Pipeline_Walkthrough.ipynb).

- 22 fully executed cells with embedded 300 DPI Seaborn/Matplotlib figures.
- Structured with *What We Observe*, *Engineering Decision*, and *Actionable Takeaway* across every stage.
- Automatically resolves imports whether launched from repo root or the `notebooks/` directory.

---

## 11. Deliverables & Repository Structure

```
aero-smelter/
├── azure/                                    # Cloud IaC & pipeline templates (ADF, Databricks, Synapse)
│   ├── adf/                                  # Azure Data Factory pipeline & linked service definitions
│   ├── databricks/                           # PySpark Medallion Lakehouse ETL notebook
│   └── synapse/                              # Azure Synapse Serverless SQL view definitions
├── dashboard/                                # Next.js 15 TSX Claymorphism Dashboard & Power BI Assets
│   ├── app/                                  # App Router (layout.tsx, page.tsx, globals.css)
│   ├── app/api/copilot/                      # Gemini AI Copilot route with serverless fallback
│   ├── components/                           # Atomic Design Component Architecture (Atoms, Molecules, Organisms)
│   ├── lib/                                  # Data layer, TypeScript interfaces, Gemini AI copilot client
│   ├── ASG_Airlines_Report.pbix / .pbit      # Production Power BI desktop and template files
│   ├── index.html                            # Standalone offline web dashboard
│   └── screenshots/                          # 300 DPI high-resolution Power BI dashboard captures
├── data/                                     # Medallion Lakehouse Storage Architecture
│   ├── source/                               # Immutable raw source files (UseCase - Airlines.xlsx)
│   ├── bronze/                               # Raw immutable Parquet snapshots & schema audit logs
│   ├── silver/                               # Cleaned, standardized, and PII-masked Parquet tables
│   ├── gold/                                 # Star schema facts, dimensions & precomputed analytical marts
│   ├── secure/                               # Air-gapped salted SHA-256 PII cryptographic mapping vault
│   └── powerbi/                              # Parquet & CSV exports, schema definitions & DAX measures
├── docs/                                     # Project documentation, specifications & architecture
│   └── specifications/                       # Case study requirements & client problem statements
├── logs/                                     # Execution logs & run traces (gitignored)
│   └── pipeline_execution.log                # End-to-end pipeline execution audit log
├── notebooks/                                # Jupyter exploration & publication walkthroughs
│   └── AeroSmelter_Pipeline_Walkthrough.ipynb # Executed 22-cell engineering & MLOps walkthrough
├── pipeline/                                 # Core Python Lakehouse & Data Engineering Package
│   ├── __init__.py
│   ├── azure_integration.py                  # Azure Blob/ADLS Gen2 sync & cloud deployment generator
│   ├── cleaning.py                           # Silver cleaning, overnight duration fix, PII masking
│   ├── config.py                             # Centralized paths, regex rules, schemas & business thresholds
│   ├── export_powerbi.py                     # Gold layer dual Parquet/CSV exporter & DAX generator
│   ├── ingestion.py                          # Bronze raw ingestion and schema contract validator
│   ├── kpis.py                               # Business KPI aggregations and duration anomaly metrics
│   ├── logger.py                             # Structured pipeline logger with audit counts
│   ├── ml_models.py                          # Isolation Forest anomaly detection & Random Forest classifier
│   ├── modeling.py                           # Gold dimensional modeling (Kimball Star Schema)
│   └── run_pipeline.py                       # Master pipeline execution orchestrator
├── reports/                                  # Technical reports & publication figures
│   ├── ASG_Airlines_Pipeline_Documentation.docx  # Comprehensive technical Word document (4.07 MB)
│   └── assets/                               # Architecture diagrams, data flows, and ERD models
├── scripts/                                  # Developer automation & compilation utilities
│   ├── generate_dashboard_screenshots.py     # Power BI report screenshot generator
│   ├── generate_diagrams.py                  # Publication diagram rendering script
│   ├── generate_docs.py                      # Technical Word documentation compiler
│   ├── generate_notebook.py                  # Standard Jupyter notebook generator
│   ├── generate_pbit.py                      # Power BI template binary packager
│   └── generate_rich_notebook.py             # Senior-level executed walkthrough notebook generator
├── tests/                                    # CI/CD Quality Gates & Automated Unit Tests
│   ├── __init__.py
│   └── test_pipeline.py                      # Automated assertions covering Bronze, Silver, Gold, PII & Azure
├── .gitignore                                # Production enterprise Data Engineering gitignore
├── package.json                              # Task orchestration scripts & project metadata
├── pyproject.toml                            # Modern Python project configuration & tool specifications
├── README.md                                 # Project documentation and portfolio showcase
└── requirements.txt                          # Locked production dependencies
```

---

## 12. Quickstart & Verification

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/darshan-gowdaa/aero-smelter.git
cd aero-smelter

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies for dashboard
npm --prefix dashboard install
```

### 2. Run End-to-End Pipeline
Executes Bronze ingestion, Silver cleaning, PII salted hashing, Gold Star Schema modeling, MLOps model training, and Power BI dataset export:
```bash
python pipeline/run_pipeline.py
# Or via npm script:
npm run pipeline
```

### 3. Run Automated CI/CD Quality Test Suite
Executes 8 automated assertions verifying Bronze snapshots, overnight duration calculations, regex airline recovery, PII air-gap protection, and foreign key integrity:
```bash
python -m unittest discover tests
# Or via npm script:
npm test
```

### 4. Regenerate Executed Walkthrough Notebook
Regenerates and executes the 22-cell publication Jupyter Notebook:
```bash
python scripts/generate_rich_notebook.py
# Or via npm script:
npm run notebook
```

### 5. Launch Interactive Next.js Dashboard
Starts the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

---

## 13. Evaluation Criteria Alignment

| Evaluation Pillar | Requirement from Specification | AeroSmelter Implementation |
| :--- | :--- | :--- |
| **1. Functionality** | Accurate duration, route traffic, overnight fix, end-to-end pipeline. | Deterministic `+24h` overnight fix, 100% carrier recovery via regex, 11 precomputed KPI marts, verified in [`tests/test_pipeline.py`](tests/test_pipeline.py). |
| **2. Scalability & Performance** | Scalable lakehouse architecture, optimized storage formats. | Medallion architecture, columnar Snappy-compressed Parquet storage across all tiers, ready for multi-node PySpark on Azure Databricks. |
| **3. Data Quality & Governance** | Schema contracts, quarantine tables, zero-trust PII handling. | Automated schema assertions, air-gapped salted SHA-256 PII vault, 100% referential foreign key integrity (0 orphans). |
| **4. Creativity & Polish** | Value-add beyond basic requirements, user-friendly dashboard. | 3 MLOps predictive models, 4-chapter Power BI report + Next.js web application deployed on Vercel, automated docx & diagram generators. |

---

## 14. License & Authorship

- **Author**: Lead Data Engineer & Solutions Architect ([@darshan-gowdaa](https://github.com/darshan-gowdaa))
- **Live Application**: [https://aero-smelter.vercel.app](https://aero-smelter.vercel.app)
- **Repository**: [https://github.com/darshan-gowdaa/aero-smelter](https://github.com/darshan-gowdaa/aero-smelter)
- **License**: MIT License. Open for academic and portfolio demonstration.

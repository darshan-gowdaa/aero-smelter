import os
from pathlib import Path
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCS_DIR = Path(__file__).resolve().parent.parent / "reports"
ASSETS_DIR = DOCS_DIR / "assets"
DOC_PATH = DOCS_DIR / "ASG_Airlines_Pipeline_Documentation.docx"

def set_cell_background(cell, color_hex):
    # Sets background color of a table cell using XML
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def format_table(table, col_widths, col_alignments=None):
    # Formats a docx table with padding, borders and column widths
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, col in enumerate(table.columns):
        for cell in col.cells:
            cell.width = col_widths[i]
            # Set top/bottom margin padding
            tcPr = cell._tc.get_or_add_tcPr()
            tcMar = OxmlElement('w:tcMar')
            for m in ['top', 'bottom', 'left', 'right']:
                node = OxmlElement(f'w:{m}')
                node.set(qn('w:w'), '120')
                node.set(qn('w:type'), 'dxa')
                tcMar.append(node)
            tcPr.append(tcMar)

def add_callout(doc, text, title="NOTE"):
    # Adds a colored callout box for highlighting key operational decisions
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    cell.width = Inches(6.5)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r_title = p.add_run(f"[{title}] ")
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(37, 99, 235)
    r_text = p.add_run(text)
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_documentation():
    print("Building ASG Airlines Pipeline Technical Documentation (.docx)...")
    doc = Document()

    # Configure 1 inch page margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("ASG Airlines: End-to-End Data Engineering Pipeline\nArchitecture, Quality Governance & Reporting Specification")
    title_run.font.size = Pt(20)
    title_run.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub_p.add_run("Enterprise Flight Operations Data Platform • Portfolio-Grade Implementation\nDate: September 2026 | Author: Senior Data Engineer & Data Scientist | Version: 1.0.0")
    sub_run.font.size = Pt(10)
    sub_run.font.color.rgb = RGBColor(71, 85, 105)
    sub_run.italic = True
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 1. Executive Summary
    h1 = doc.add_heading("1. Executive Summary & Problem Statement", level=1)
    h1.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p1 = doc.add_paragraph(
        "ASG Airlines, a premier domestic carrier operating across major Indian metropolitan airports, operates a high-frequency "
        "flight network connecting Delhi (DEL), Mumbai (BOM), Bengaluru (BLR), Hyderabad (HYD), Kolkata (CCU), and Chennai (MAA). "
        "The airline collects flight ops data, booking records, passenger demographics, and transaction logs across disparate legacy systems. "
        "Historically, operational analytics suffered from severe data quality bottlenecks including corrupted flight identifiers, inconsistent "
        "timestamp formats, unhandled overnight (cross-day) flight duration anomalies, missing passenger values, duplicate bookings, "
        "unprotected PII records, and referential integrity orphans."
    )
    p1.runs[0].font.size = Pt(10.5)

    p2 = doc.add_paragraph(
        "To resolve these operational challenges, an end-to-end production data engineering pipeline was architected following the "
        "industry-standard Medallion Architecture (Bronze -> Silver -> Gold). The pipeline ingests 4 operational source sheets (1,020 flights, "
        "1,000 bookings, 1,039 passengers, and 1,000 payments), executes rigorous schema validations and quarantine checks, standardizes "
        "inconsistent timestamps to ISO 8601, resolves overnight flight duration calculations, enforces zero-trust PII masking with cryptographic "
        "SHA-256 salted hashing, builds a star schema dimensional model, computes key operational KPIs, and exports clean analytical assets "
        "for a 4-page executive Power BI Dashboard."
    )
    p2.runs[0].font.size = Pt(10.5)

    add_callout(
        doc,
        "The pipeline runs deterministically and idempotently in under 1 second (0.94s) across all 4 operational datasets, achieving "
        "100% referential integrity, zero data loss, and complete protection of sensitive passenger PII via an isolated vault.",
        title="EXECUTIVE RESULT"
    )

    # 2. Architecture & Pipeline Design
    h2 = doc.add_heading("2. Architecture & Pipeline Design (Medallion Flow)", level=1)
    h2.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_arch = doc.add_paragraph(
        "The platform implements a multi-hop Medallion Architecture designed for enterprise scalability, repeatability, and governance. "
        "Each stage serves a dedicated architectural responsibility, enforcing strict data quality contracts before progressing downstream."
    )
    p_arch.runs[0].font.size = Pt(10.5)

    arch_img_path = ASSETS_DIR / "architecture_diagram.png"
    if arch_img_path.exists():
        doc.add_picture(str(arch_img_path), width=Inches(6.4))
        p_cap = doc.add_paragraph("Figure 1: ASG Airlines Medallion Data Engineering Architecture (Bronze -> Silver -> Gold -> Consumption)")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.runs[0].font.size = Pt(8.5)
        p_cap.runs[0].font.italic = True
        p_cap.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    doc.add_heading("Framework Selection: Modular Python / Pandas with PyArrow", level=2)
    p_framework = doc.add_paragraph(
        "Rationale for Engineering Framework: For datasets with operational batches ranging from thousands to millions of rows, Python with "
        "Pandas 2.x and PyArrow provides zero-infrastructure overhead, instant sub-second local execution, native Microsoft Excel parsing, "
        "and direct columnar Parquet output with strong type validation. The codebase was architected with modular functional boundaries "
        "(IngestionLayer, CleaningLayer, ModelingLayer, KPICalculator, PowerBIExporter) ensuring that each module can be mapped directly to "
        "PySpark transformations on Azure Databricks or Azure Synapse Spark pools when scaling to multi-terabyte operations."
    )
    p_framework.runs[0].font.size = Pt(10)

    # Medallion Stage Summary Table
    table_stages = doc.add_table(rows=5, cols=4)
    stage_headers = ["Layer", "Format & Storage", "Key Operations Performed", "Governance & SLA"]
    for i, h in enumerate(stage_headers):
        cell = table_stages.cell(0, i)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E3A8A")

    stages_data = [
        ("Bronze (Raw)", "Parquet snapshot in data/bronze/", "Lossless ingestion of Excel sheets, schema validation, quarantine tracking", "Raw audit trail; immutable append"),
        ("Silver (Cleansed)", "Parquet in data/silver/ & data/secure/", "Regex flight repairs, overnight duration fix, deduplication, PII hashing", "Encrypted PII vault; cleansed silver facts"),
        ("Gold (Dimensional)", "Star Schema in data/gold/", "Surrogate keys, facts (flights, bookings, payments), dims (airline, route, date)", "High-performance analytics & BI"),
        ("Consumption", "Parquet & CSV in data/powerbi/", "4-page Power BI dashboard, DAX metrics, automated reports, executive charts", "Role-based row-level access (RLS)")
    ]
    for r_idx, row_data in enumerate(stages_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = table_stages.cell(r_idx, c_idx)
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(9)
            set_cell_background(cell, bg)
    format_table(table_stages, [Inches(1.3), Inches(1.6), Inches(2.3), Inches(1.3)])
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3. Data Ingestion & Quality Gates
    h3 = doc.add_heading("3. Data Ingestion & Schema Validation Layer (Bronze)", level=1)
    h3.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_ing = doc.add_paragraph(
        "The Ingestion Layer reads the source Excel workbook (`UseCase - Airlines.xlsx`) sheet-by-sheet to guarantee sequential isolation "
        "and precise memory management. Upon reading each sheet, the raw data is persisted as an immutable bronze Parquet snapshot. "
        "A rigorous schema validation contract evaluates each sheet:"
    )
    p_ing.runs[0].font.size = Pt(10)

    bullets_ing = [
        "Column Existence Audit: Confirms that all mandatory business columns are present. If any column is missing, pipeline halts with a descriptive schema error.",
        "Primary Key Null Checks: Evaluates primary keys (flight_id + departure_time for flights, booking_id for bookings, passenger_id for passengers, payment_id for payments). Records failing PK presence are segregated into bronze quarantine tables with a logged rejection reason.",
        "Lossless Type Preservation: Preserves raw date strings, timestamps, and currency strings prior to transformation to enable complete reproducibility.",
        "Ingestion Logging: Emits precise row counts, column counts, null distribution, and storage locations for comprehensive auditability."
    ]
    for b in bullets_ing:
        bp = doc.add_paragraph(b, style='List Bullet')
        bp.runs[0].font.size = Pt(9.5)

    # 4. Cleaning, Standardization & Transformations
    h4 = doc.add_heading("4. Data Cleaning, Standardization & Transformations (Silver)", level=1)
    h4.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    df_img_path = ASSETS_DIR / "data_flow_diagram.png"
    if df_img_path.exists():
        doc.add_picture(str(df_img_path), width=Inches(6.4))
        p_cap = doc.add_paragraph("Figure 2: End-to-End Data Transformation Flow & Quality Gates")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.runs[0].font.size = Pt(8.5)
        p_cap.runs[0].font.italic = True
        p_cap.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    doc.add_heading("4.1 Flight ID Validation & Airline Prefix Repair", level=2)
    p_fid = doc.add_paragraph(
        "Analysis of the raw flight records revealed that 72 flights contained missing (NaN) or 'UNKNOWN' values in the `airline` column. "
        "Additionally, IndiGo flights were recorded under the operational prefix `6F` alongside standard carrier codes (AI for Air India, "
        "SJ for SpiceJet, UK for Vistara). The pipeline executes deterministic regex pattern validation (`^(AI|SJ|UK|6F|6E)\\d{3,4}$`). "
        "By parsing the 2-character carrier prefix, the cleaning layer automatically repairs 100% of missing and UNKNOWN airline names "
        "(41 NaN and 31 UNKNOWN rows successfully recovered) without discarding valuable operational flight records."
    )
    p_fid.runs[0].font.size = Pt(10)

    doc.add_heading("4.2 Timestamp Normalization & Overnight Flight Duration Fix", level=2)
    p_overnight = doc.add_paragraph(
        "A critical challenge in flight operations data is handling overnight (cross-day) flights where departure occurs late in the evening "
        "and arrival takes place after midnight or on the following day. In legacy systems, timestamps are frequently recorded without proper "
        "date incrementation, causing arrival_time to appear chronologically earlier than departure_time (negative duration)."
    )
    p_overnight.runs[0].font.size = Pt(10)

    add_callout(
        doc,
        "Mathematical Transformation Logic for Overnight Flights:\n"
        "1. Standardize departure_time and arrival_time to ISO 8601 datetime format.\n"
        "2. Evaluate condition: IF arrival_time < departure_time:\n"
        "     arrival_time_corrected = arrival_time + 1 Day (24 hours)\n"
        "     is_overnight = TRUE\n"
        "3. Duration Recomputation: duration_minutes = (arrival_time_corrected - departure_time) in total minutes.\n"
        "4. Exact Verification: In flight SJ192 (HYD -> BOM), departure was 2026-04-19 18:45:42 and raw arrival was 2026-04-18 23:45:42. "
        "Adding 1 day to arrival produces 2026-04-19 23:45:42, yielding exactly 300.0 minutes (5.0 hours), perfectly matching the raw flight duration.",
        title="OVERNIGHT FLIGHT ALGORITHM"
    )

    doc.add_heading("4.3 Duplicate Resolution & Completeness Scoring", level=2)
    p_dedup = doc.add_paragraph(
        "Natural keys were identified for deduplication across entities: `[flight_id, departure_time]` for flights, `booking_id` for bookings, "
        "and `passenger_id` for passengers. In the passengers dataset, 39 duplicate passenger ID instances were identified. Rather than "
        "arbitrarily dropping rows, a completeness scoring heuristic was deployed that calculates total string length and non-null presence "
        "across first_name, last_name, and email. The record with highest completeness was retained, preserving maximum data fidelity "
        "while eliminating 39 duplicate passenger records."
    )
    p_dedup.runs[0].font.size = Pt(10)

    doc.add_heading("4.4 PII Protection: Cryptographic Salted Hashing & Isolated Vault", level=2)
    p_pii = doc.add_paragraph(
        "Compliance with international privacy frameworks (GDPR, India Digital Personal Data Protection Act 2023) requires strict protection "
        "of Personally Identifiable Information (PII). The pipeline implements a zero-trust dual-architecture model:"
    )
    p_pii.runs[0].font.size = Pt(10)

    bullets_pii = [
        "Cryptographic Salted Hashing: Sensitive national identity numbers (Aadhaar ID, Passport number) and contact telephone numbers (passenger phone, emergency contact phone) are hashed using SHA-256 combined with a secret enterprise salt (PII_SALT). This prevents rainbow table and dictionary attacks.",
        "Visual Masking for Analytics: User-facing identifiers are masked for reporting: Aadhaar displays as 'XXXX-XXXX-1234' (last 4 visible), phone numbers display as '+91-XXXXX-XX33', and emails mask the username while preserving domain intelligence ('i***@gmail.com').",
        "Age Band Derivation: Raw date of birth is dropped from analytical consumption, replaced with demographic age cohorts (<18, 18-35, 36-50, 51-65, 65+).",
        "Restricted PII Vault: A separate, access-controlled vault dataset (`data/secure/pii_vault.parquet`) maintains the bidirectional mapping between passenger_id and raw legal identifiers, encrypted on disk and restricted exclusively to compliance and law-enforcement personnel."
    ]
    for b in bullets_pii:
        bp = doc.add_paragraph(b, style='List Bullet')
        bp.runs[0].font.size = Pt(9.5)

    doc.add_heading("4.5 Booking Status & Payment Amount Imputation", level=2)
    p_impute = doc.add_paragraph(
        "In the bookings dataset, 75 records contained missing (45) or 'INVALID' (30) status values. Cross-referencing against the payments "
        "table revealed that these bookings were associated with active payment transactions. Rather than discarding valid customer bookings, "
        "their status was standardized to 'PENDING' with an audit flag (`is_status_imputed = TRUE`). In the payments dataset, 78 non-numeric "
        "or null amounts were imputed using the median ticket fare (INR 8,027.12) and flagged with `is_amount_imputed = TRUE`, enabling financial "
        "analysts to filter or evaluate imputed revenue streams independently."
    )
    p_impute.runs[0].font.size = Pt(10)

    # 5. Star Schema Data Model
    h5 = doc.add_heading("5. Dimensional Star Schema Model (Gold Layer)", level=1)
    h5.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    model_img_path = ASSETS_DIR / "star_schema_model.png"
    if model_img_path.exists():
        doc.add_picture(str(model_img_path), width=Inches(6.4))
        p_cap = doc.add_paragraph("Figure 3: Gold Layer Star Schema Entity Relationship Diagram")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.runs[0].font.size = Pt(8.5)
        p_cap.runs[0].font.italic = True
        p_cap.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    doc.add_heading("Data Dictionary & Table Specifications", level=2)
    table_dict = doc.add_table(rows=8, cols=4)
    dict_headers = ["Table Name", "Type", "Grain / Primary Key", "Key Attributes & Relationships"]
    for i, h in enumerate(dict_headers):
        cell = table_dict.cell(0, i)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E3A8A")

    dict_data = [
        ("dim_airline", "Dimension", "airline_key (PK)", "airline_name, airline_code (AI, 6E, SJ, UK), country (4 rows)"),
        ("dim_route", "Dimension", "route_key (PK)", "source, destination, source_city, dest_city, route_name (30 routes)"),
        ("dim_date", "Dimension", "date_key (PK, YYYYMMDD)", "full_date, year, month, month_name, day, day_name, is_weekend (345 days)"),
        ("dim_passenger", "Dimension", "passenger_key (PK)", "passenger_id (BK), gender, age, age_band, masked contact PII (1,000 rows)"),
        ("fact_flights", "Fact", "flight_instance_id (PK)", "flight_id, airline_key, route_key, date_key, duration_minutes, is_overnight, outlier flags (1,005 rows)"),
        ("fact_bookings", "Fact", "booking_id (PK)", "passenger_key, flight_id, route_key, airline_key, date_key, status, seat_number (1,000 rows)"),
        ("fact_payments", "Fact", "payment_id (PK)", "booking_id (FK), route_key, airline_key, payment_method, amount, is_amount_imputed (1,000 rows)")
    ]
    for r_idx, row_data in enumerate(dict_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = table_dict.cell(r_idx, c_idx)
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            set_cell_background(cell, bg)
    format_table(table_dict, [Inches(1.2), Inches(0.9), Inches(1.8), Inches(2.6)])
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 6. Assumptions Log & Quality Decisions
    h6 = doc.add_heading("6. Assumptions Log & Engineering Justifications", level=1)
    h6.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_assump = doc.add_paragraph(
        "Every transformation, imputation, and filtering rule was recorded with complete business and statistical justification:"
    )
    p_assump.runs[0].font.size = Pt(10)

    table_assump = doc.add_table(rows=8, cols=4)
    assump_headers = ["Domain / Field", "Observed Issue", "Cleaning Strategy Applied", "Business & Technical Rationale"]
    for i, h in enumerate(assump_headers):
        cell = table_assump.cell(0, i)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E3A8A")

    assump_data = [
        ("airline in flights", "41 NaN and 31 UNKNOWN airline names", "Inferred airline from 2-letter flight_id prefix (AI->Air India, 6F->IndiGo, etc.)", "Airline carrier codes are legally unique to operating airlines; 100% deterministic recovery without data loss."),
        ("flight_id code '6F'", "IndiGo flights use 6F prefix instead of 6E", "Retained 6F as valid operational alias mapped to IndiGo", "Both flights and bookings sheets uniformly use 6F. Preserving this maintains 100% referential integrity without cross-table key desynchronization."),
        ("arrival < departure", "Row 355 arrival recorded on previous calendar day", "Added 1 day (24 hours) to arrival timestamp; set is_overnight=TRUE", "Flight departed at 18:45 and arrived at 23:45. Adding 1 day fixes inverted calendar artifact and matches raw 5h duration."),
        ("duration column", "Raw duration had mixed datatypes (time vs datetime)", "Recomputed duration = (arrival - departure) in minutes", "Operational standard: calculated timestamps represent true ground truth, eliminating format-parsing errors."),
        ("passenger duplicates", "39 duplicate passenger IDs with conflicting values", "Deduplicated on passenger_id; retained record with highest completeness score", "Passengers should have unique business keys. Keeping row with most non-null contact fields avoids orphan details."),
        ("Aadhaar ID length", "Integer formatting in Excel stripped leading zeros", "Applied zero-padding to 12 digits (zfill(12))", "Indian Aadhaar numbers are strictly 12 digits. Stripping leading zeros during ingestion is an Excel numeric artifact."),
        ("Payment amount", "78 null or 'INVALID' amount records in payments", "Imputed median route fare (INR 8,027.12); flagged with is_amount_imputed", "Median is statistically robust against extreme fare outliers; flagging preserves transparency for revenue audits.")
    ]
    for r_idx, row_data in enumerate(assump_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = table_assump.cell(r_idx, c_idx)
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            set_cell_background(cell, bg)
    format_table(table_assump, [Inches(1.2), Inches(1.6), Inches(1.8), Inches(1.9)])
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 7. Business KPIs & Operational Metrics
    h7 = doc.add_heading("7. Business KPIs & Analytical Insights", level=1)
    h7.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    doc.add_heading("7.1 Operational Overview KPIs", level=2)
    table_kpis = doc.add_table(rows=7, cols=3)
    kpi_headers = ["Operational KPI Metric", "Calculated Value", "Operational Interpretation"]
    for i, h in enumerate(kpi_headers):
        cell = table_kpis.cell(0, i)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E3A8A")

    kpis_data = [
        ("Total Cleaned Flights", "1,005 flights", "Active scheduled flight network after dropping 15 exact duplicate instances"),
        ("Overall Average Duration", "164.62 minutes (2h 45m)", "Reflects standard Indian domestic sector stage lengths across major metros"),
        ("Total Operational Bookings", "1,000 bookings", "320 Confirmed (32.0%), 314 Cancelled (31.4%), 366 Pending (36.6%)"),
        ("Total Operational Revenue", "INR 8,054,166.50 (~8.05 Cr)", "Generated across 1,000 transactions; average fare is INR 8,054.17"),
        ("Active Domestic Routes", "30 route pairs", "Complete bidirectional connectivity across BOM, DEL, BLR, HYD, CCU, MAA"),
        ("Operational Anomaly Count", "1 statistical duration outlier", "Duration exceeds 2 standard deviations from route mean; 0 negative durations")
    ]
    for r_idx, row_data in enumerate(kpis_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = table_kpis.cell(r_idx, c_idx)
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(9)
            set_cell_background(cell, bg)
    format_table(table_kpis, [Inches(2.0), Inches(1.8), Inches(2.7)])
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("7.2 Airline Market Share & Duration Performance", level=2)
    table_airline = doc.add_table(rows=5, cols=5)
    al_headers = ["Airline Name", "Carrier Code", "Flight Count", "Market Share %", "Avg Duration (min)"]
    for i, h in enumerate(al_headers):
        cell = table_airline.cell(0, i)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E3A8A")

    al_data = [
        ("IndiGo", "6E / 6F", "269", "26.77%", "163.78 mins"),
        ("Air India", "AI", "256", "25.47%", "165.73 mins"),
        ("SpiceJet", "SJ", "247", "24.58%", "164.84 mins"),
        ("Vistara", "UK", "233", "23.18%", "164.12 mins")
    ]
    for r_idx, row_data in enumerate(al_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = table_airline.cell(r_idx, c_idx)
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(9)
            set_cell_background(cell, bg)
    format_table(table_airline, [Inches(1.5), Inches(1.0), Inches(1.1), Inches(1.3), Inches(1.6)])
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("7.3 Top Routes by Traffic & Revenue", level=2)
    p_route = doc.add_paragraph(
        "Traffic is evenly distributed across all 30 metro routes, averaging ~33-35 flights per pair. Top traffic routes include "
        "CCU -> DEL (43 flights, 4.28%), DEL -> CCU (41 flights, 4.08%), and BLR -> BOM (38 flights, 3.78%). Highest revenue "
        "corridors are CCU -> DEL (INR 372,450), DEL -> BLR (INR 345,120), and BOM -> DEL (INR 338,900)."
    )
    p_route.runs[0].font.size = Pt(10)

    # 8. Privacy, Governance & Access Control
    h8 = doc.add_heading("8. Privacy, Governance & Access Control Architecture", level=1)
    h8.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_sec = doc.add_paragraph(
        "To enforce defense-in-depth security, access to ASG Airlines data assets is segregated using Role-Based Access Control (RBAC), "
        "least privilege principles, and data masking tiers:"
    )
    p_sec.runs[0].font.size = Pt(10)

    table_rbac = doc.add_table(rows=5, cols=4)
    rbac_headers = ["User Role", "Accessible Datasets", "PII Visibility Level", "Allowed Tools & Platforms"]
    for i, h in enumerate(rbac_headers):
        cell = table_rbac.cell(0, i)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E3A8A")

    rbac_data = [
        ("Executive & Management", "Gold layer KPI tables, executive dashboards", "Aggregated only; zero PII exposed", "Power BI Premium, Mobile Dashboard"),
        ("BI & Flight Operations Analysts", "fact_flights, dim_airline, dim_route, dim_date", "Fully masked PII (XXXX-1234, i***@domain)", "Power BI Desktop, SQL Analytics"),
        ("Revenue & Finance Analysts", "fact_bookings, fact_payments, dim_route", "Masked PII; financial amounts and payment methods", "Power BI, Excel via Direct Lake"),
        ("Data Protection Officer (DPO) / Legal", "data/secure/pii_vault.parquet (Restricted)", "Full plaintext legal PII for legal subpoenas / compliance", "Encrypted terminal with MFA & audit logging")
    ]
    for r_idx, row_data in enumerate(rbac_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = table_rbac.cell(r_idx, c_idx)
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            set_cell_background(cell, bg)
    format_table(table_rbac, [Inches(1.5), Inches(1.8), Inches(1.7), Inches(1.5)])
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 9. Power BI Dashboard Architecture
    h9 = doc.add_heading("9. Power BI Dashboard Specification & Visual Walkthrough", level=1)
    h9.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_pbi = doc.add_paragraph(
        "The Power BI report was architected as a production-grade 4-page analytical suite. Each page contains executive KPI cards, "
        "interactive slicers (Airline, Route, Date Range), and cross-filtering analytical visuals. The dataset is exported in dual Parquet "
        "and CSV formats (`data/powerbi/`) accompanied by a standardized Power BI template (`dashboard/ASG_Airlines_Report.pbit`) and "
        "pre-calculated DAX measures (`data/powerbi/powerbi_dax_measures.dax`)."
    )
    p_pbi.runs[0].font.size = Pt(10)

    # Embed 4 Dashboard Screenshots
    dash_screens_dir = Path(__file__).resolve().parent.parent / "dashboard" / "screenshots"
    pages_meta = [
        ("page1_duration_analysis.png", "Figure 4: Power BI Page 1 — Flight Duration & Sector Analysis", [
            "KPI Cards: Overall Avg Duration (164.6 min), Min Duration (30.0 min), Max Duration (300.0 min), Overnight Repaired (1).",
            "Slicers: Airline Name dropdown, Route Name multiselect, Flight Date slider.",
            "Visuals: Top 8 Routes by Average Duration horizontal bar chart; Average Flight Duration by Airline carrier bar chart."
        ]),
        ("page2_route_performance.png", "Figure 5: Power BI Page 2 — Route Traffic & Operational Revenue", [
            "KPI Cards: Active Domestic Routes (30), Total Bookings (1,000), Cancellation Rate (31.40%), Total Operational Revenue (INR 8.05M).",
            "Slicers: Source City, Destination City, Route Name.",
            "Visuals: Top 8 Busiest Routes flight instance volume; Top 8 Revenue Corridors in INR."
        ]),
        ("page3_airline_trends.png", "Figure 6: Power BI Page 3 — Airline Market Share & Payment Trends", [
            "KPI Cards: Total Flights Operated (1,005), Leading Airline Market Share (26.77% IndiGo), Repaired Carriers (72), Top Payment Channel (UPI 35.8%).",
            "Slicers: Airline selector, Payment Method filter.",
            "Visuals: Flight Share distribution donut chart by carrier; Payment Channel distribution by transaction volume (UPI, Card, NetBanking)."
        ]),
        ("page4_delay_anomaly_insights.png", "Figure 7: Power BI Page 4 — Delay, Anomaly & Quality Audit", [
            "KPI Cards: Duration Outliers Detected (1), Negative Durations (0), Imputed Fare Values (78), Referential Integrity Loss (0.00%).",
            "Slicers: Outlier Severity, Anomaly Type, Time of Day.",
            "Visuals: Diurnal Flight Traffic curve across 24-hour departure hours; Statistical Outlier Flight Audit table for Flight SJ192 with root cause analysis."
        ])
    ]

    for img_filename, fig_caption, bullets in pages_meta:
        img_p = dash_screens_dir / img_filename
        if img_p.exists():
            doc.add_picture(str(img_p), width=Inches(6.4))
            p_cap = doc.add_paragraph(fig_caption)
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.runs[0].font.size = Pt(8.5)
            p_cap.runs[0].font.italic = True
            p_cap.runs[0].font.color.rgb = RGBColor(100, 116, 139)

        for b in bullets:
            bp = doc.add_paragraph(b, style='List Bullet')
            bp.runs[0].font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 10. Verification & Reproducibility
    h10 = doc.add_heading("10. Pipeline Verification & Reproducibility Instructions", level=1)
    h10.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_ver = doc.add_paragraph(
        "The entire pipeline is completely automated, idempotent, and executable with a single command from any environment with Python 3.10+ installed:\n\n"
        "  python pipeline/run_pipeline.py\n\n"
        "Execution performs bronze ingestion, silver cleaning, gold dimensional modeling, KPI computation, and Power BI Parquet/CSV export "
        "in under 1 second. All logs and audit counts are stored in `pipeline_execution.log`."
    )
    p_ver.runs[0].font.size = Pt(10)

    # Save document
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    doc.save(DOC_PATH)
    print(f"ASG Airlines Documentation successfully generated at: {DOC_PATH}")

if __name__ == "__main__":
    build_documentation()

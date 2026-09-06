import json
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PBIT = BASE_DIR / "dashboard" / "ASG_Airlines_Report.pbit"
OUTPUT_PBIX = BASE_DIR / "dashboard" / "ASG_Airlines_Report.pbix"
EXPORT_DIR = BASE_DIR / "data" / "powerbi"

def generate_powerbi_assets():
    print("Generating Comprehensive 6-Page Power BI Suite matching web application...")
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Content types XML
    content_types_xml = """<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="" />
  <Default Extension="xml" ContentType="" />
  <Override PartName="/Version" ContentType="" />
  <Override PartName="/DataModelSchema" ContentType="" />
  <Override PartName="/Report/Layout" ContentType="" />
  <Override PartName="/Settings" ContentType="" />
  <Override PartName="/Metadata" ContentType="" />
</Types>"""

    # 2. Version: Must be UTF-16LE 1.28 for Power BI Packager compatibility
    version_text = "1.28"

    # 3. DataModelSchema JSON
    datamodel_schema = {
        "name": "ASG_Airlines_Enterprise_Model",
        "compatibilityLevel": 1550,
        "model": {
            "culture": "en-US",
            "dataSources": [
                {
                    "type": "Folder",
                    "name": "GoldDataFolder",
                    "connectionString": "data/powerbi/"
                }
            ],
            "tables": [
                {
                    "name": "fact_flights",
                    "columns": [
                        {"name": "flight_instance_id", "dataType": "int64"},
                        {"name": "flight_id", "dataType": "string"},
                        {"name": "airline_key", "dataType": "int64"},
                        {"name": "route_key", "dataType": "int64"},
                        {"name": "departure_date_key", "dataType": "int64"},
                        {"name": "departure_time", "dataType": "dateTime"},
                        {"name": "arrival_time", "dataType": "dateTime"},
                        {"name": "duration_minutes", "dataType": "double"},
                        {"name": "route_mean_duration", "dataType": "double"},
                        {"name": "route_std_duration", "dataType": "double"},
                        {"name": "is_overnight", "dataType": "boolean"},
                        {"name": "duration_anomaly_flag", "dataType": "boolean"},
                        {"name": "is_duration_outlier", "dataType": "boolean"}
                    ],
                    "measures": [
                        {"name": "Total Flights", "expression": "COUNTROWS('fact_flights')"},
                        {"name": "Total Block Hours", "expression": "DIVIDE(SUM('fact_flights'[duration_minutes]), 60, 0)"},
                        {"name": "Fleet Average Duration", "expression": "AVERAGE('fact_flights'[duration_minutes])"},
                        {"name": "Min Flight Duration", "expression": "MIN('fact_flights'[duration_minutes])"},
                        {"name": "Max Flight Duration", "expression": "MAX('fact_flights'[duration_minutes])"},
                        {"name": "Overnight Flight Count", "expression": "CALCULATE(COUNTROWS('fact_flights'), 'fact_flights'[is_overnight] = TRUE())"},
                        {"name": "Overnight Flight %", "expression": "DIVIDE([Overnight Flight Count], [Total Flights], 0)"},
                        {"name": "Duration Outlier Count (>2σ)", "expression": "CALCULATE(COUNTROWS('fact_flights'), 'fact_flights'[is_duration_outlier] = TRUE())"}
                    ]
                },
                {
                    "name": "fact_bookings",
                    "columns": [
                        {"name": "booking_id", "dataType": "string"},
                        {"name": "passenger_key", "dataType": "int64"},
                        {"name": "flight_id", "dataType": "string"},
                        {"name": "route_key", "dataType": "int64"},
                        {"name": "airline_key", "dataType": "int64"},
                        {"name": "booking_date_key", "dataType": "int64"},
                        {"name": "booking_date", "dataType": "dateTime"},
                        {"name": "status", "dataType": "string"},
                        {"name": "is_confirmed", "dataType": "int64"},
                        {"name": "is_cancelled", "dataType": "int64"},
                        {"name": "is_pending", "dataType": "int64"},
                        {"name": "is_status_imputed", "dataType": "int64"},
                        {"name": "seat_number", "dataType": "string"},
                        {"name": "passport_masked", "dataType": "string"}
                    ],
                    "measures": [
                        {"name": "Total Bookings", "expression": "COUNTROWS('fact_bookings')"},
                        {"name": "Confirmed Bookings", "expression": "CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_confirmed] = 1)"},
                        {"name": "Confirmation Rate %", "expression": "DIVIDE([Confirmed Bookings], [Total Bookings], 0)"},
                        {"name": "Cancelled Bookings", "expression": "CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_cancelled] = 1)"},
                        {"name": "Cancellation Rate %", "expression": "DIVIDE([Cancelled Bookings], [Total Bookings], 0)"},
                        {"name": "Pending Bookings", "expression": "CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_pending] = 1)"},
                        {"name": "Pending Rate %", "expression": "DIVIDE([Pending Bookings], [Total Bookings], 0)"}
                    ]
                },
                {
                    "name": "fact_payments",
                    "columns": [
                        {"name": "payment_id", "dataType": "string"},
                        {"name": "booking_id", "dataType": "string"},
                        {"name": "route_key", "dataType": "int64"},
                        {"name": "airline_key", "dataType": "int64"},
                        {"name": "payment_method", "dataType": "string"},
                        {"name": "amount", "dataType": "double"},
                        {"name": "is_amount_imputed", "dataType": "boolean"}
                    ],
                    "measures": [
                        {"name": "Total Operational Revenue", "expression": "SUM('fact_payments'[amount])"},
                        {"name": "Average Fare Per Booking", "expression": "AVERAGE('fact_payments'[amount])"},
                        {"name": "Confirmed Gross Revenue", "expression": "CALCULATE(SUM('fact_payments'[amount]), 'fact_bookings'[is_confirmed] = 1)"},
                        {"name": "Cancelled Lost Revenue", "expression": "CALCULATE(SUM('fact_payments'[amount]), 'fact_bookings'[is_cancelled] = 1)"},
                        {"name": "Pending At-Risk Revenue", "expression": "CALCULATE(SUM('fact_payments'[amount]), 'fact_bookings'[is_pending] = 1)"},
                        {"name": "Yield Per Block Hour", "expression": "DIVIDE([Total Operational Revenue], [Total Block Hours], 0)"}
                    ]
                },
                {
                    "name": "dim_airline",
                    "columns": [
                        {"name": "airline_key", "dataType": "int64"},
                        {"name": "airline_name", "dataType": "string"},
                        {"name": "airline_code", "dataType": "string"},
                        {"name": "country", "dataType": "string"}
                    ]
                },
                {
                    "name": "dim_route",
                    "columns": [
                        {"name": "route_key", "dataType": "int64"},
                        {"name": "source", "dataType": "string"},
                        {"name": "source_city", "dataType": "string"},
                        {"name": "destination", "dataType": "string"},
                        {"name": "dest_city", "dataType": "string"},
                        {"name": "route_name", "dataType": "string"},
                        {"name": "route_full_name", "dataType": "string"}
                    ]
                },
                {
                    "name": "dim_date",
                    "columns": [
                        {"name": "date_key", "dataType": "int64"},
                        {"name": "full_date", "dataType": "dateTime"},
                        {"name": "year", "dataType": "int64"},
                        {"name": "month", "dataType": "int64"},
                        {"name": "month_name", "dataType": "string"},
                        {"name": "day", "dataType": "int64"},
                        {"name": "day_name", "dataType": "string"},
                        {"name": "is_weekend", "dataType": "boolean"}
                    ]
                },
                {
                    "name": "dim_passenger",
                    "columns": [
                        {"name": "passenger_key", "dataType": "int64"},
                        {"name": "passenger_id", "dataType": "string"},
                        {"name": "gender", "dataType": "string"},
                        {"name": "age", "dataType": "int64"},
                        {"name": "age_band", "dataType": "string"},
                        {"name": "email_masked", "dataType": "string"},
                        {"name": "phone_masked", "dataType": "string"},
                        {"name": "aadhaar_masked", "dataType": "string"},
                        {"name": "passenger_name_masked", "dataType": "string"}
                    ]
                },
                {
                    "name": "ml_anomaly_scores",
                    "columns": [
                        {"name": "flight_id", "dataType": "string"},
                        {"name": "airline_code", "dataType": "string"},
                        {"name": "airline_name", "dataType": "string"},
                        {"name": "route_name", "dataType": "string"},
                        {"name": "departure_time", "dataType": "string"},
                        {"name": "arrival_time", "dataType": "string"},
                        {"name": "duration_minutes", "dataType": "double"},
                        {"name": "route_mean_duration", "dataType": "double"},
                        {"name": "ml_is_anomaly", "dataType": "int64"},
                        {"name": "ml_anomaly_score", "dataType": "double"}
                    ],
                    "measures": [
                        {"name": "ML Flagged Anomaly Flights", "expression": "CALCULATE(COUNTROWS('ml_anomaly_scores'), 'ml_anomaly_scores'[ml_is_anomaly] = 1)"},
                        {"name": "Average ML Anomaly Score", "expression": "AVERAGE('ml_anomaly_scores'[ml_anomaly_score])"}
                    ]
                },
                {
                    "name": "ml_cancellation_predictions",
                    "columns": [
                        {"name": "booking_id", "dataType": "string"},
                        {"name": "flight_id", "dataType": "string"},
                        {"name": "airline_code", "dataType": "string"},
                        {"name": "route_name", "dataType": "string"},
                        {"name": "payment_method", "dataType": "string"},
                        {"name": "amount_clean", "dataType": "double"},
                        {"name": "is_cancelled", "dataType": "int64"},
                        {"name": "cancellation_risk_score", "dataType": "double"},
                        {"name": "risk_tier", "dataType": "string"}
                    ],
                    "measures": [
                        {"name": "High Risk Bookings Count", "expression": "CALCULATE(COUNTROWS('ml_cancellation_predictions'), 'ml_cancellation_predictions'[risk_tier] = \"High Risk\")"}
                    ]
                },
                {
                    "name": "ml_feature_importances",
                    "columns": [
                        {"name": "feature", "dataType": "string"},
                        {"name": "importance", "dataType": "double"},
                        {"name": "percentage", "dataType": "double"}
                    ]
                }
            ],
            "relationships": [
                {
                    "name": "flights_airline",
                    "fromTable": "fact_flights",
                    "fromColumn": "airline_key",
                    "toTable": "dim_airline",
                    "toColumn": "airline_key"
                },
                {
                    "name": "flights_route",
                    "fromTable": "fact_flights",
                    "fromColumn": "route_key",
                    "toTable": "dim_route",
                    "toColumn": "route_key"
                },
                {
                    "name": "flights_date",
                    "fromTable": "fact_flights",
                    "fromColumn": "departure_date_key",
                    "toTable": "dim_date",
                    "toColumn": "date_key"
                },
                {
                    "name": "bookings_passenger",
                    "fromTable": "fact_bookings",
                    "fromColumn": "passenger_key",
                    "toTable": "dim_passenger",
                    "toColumn": "passenger_key"
                },
                {
                    "name": "payments_booking",
                    "fromTable": "fact_payments",
                    "fromColumn": "booking_id",
                    "toTable": "fact_bookings",
                    "toColumn": "booking_id"
                }
            ]
        }
    }

    # 4. Report Layout JSON (6 full pages matching web app)
    report_layout = {
        "id": 0,
        "resourcePackages": [],
        "sections": [
            {
                "displayName": "1. Duration Analysis",
                "ordinal": 0,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "ASG Airlines - Executive Duration Analysis & Flight Profile Suite"})},
                    {"x": 10, "y": 80, "z": 1, "width": 620, "height": 330, "config": json.dumps({"title": "Airline Duration Profile (Min / Avg / Max)", "type": "barChart"})},
                    {"x": 645, "y": 80, "z": 2, "width": 625, "height": 330, "config": json.dumps({"title": "Top 10 Routes by Average Flight Duration", "type": "barChart"})},
                    {"x": 10, "y": 425, "z": 3, "width": 800, "height": 270, "config": json.dumps({"title": "24-Hour Departure Traffic Intensity (Hourly Flights)", "type": "columnChart"})},
                    {"x": 825, "y": 425, "z": 4, "width": 445, "height": 270, "config": json.dumps({"title": "Flight Duration Frequency (Histogram Distribution)", "type": "columnChart"})}
                ]
            },
            {
                "displayName": "2. AI Copilot & MLOps Suite",
                "ordinal": 1,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "AI Copilot Grounded Terminal & Production Scikit-Learn Model Governance"})},
                    {"x": 10, "y": 80, "z": 1, "width": 300, "height": 100, "config": json.dumps({"title": "Audited Revenue [GREEN]", "type": "card"})},
                    {"x": 325, "y": 80, "z": 2, "width": 300, "height": 100, "config": json.dumps({"title": "Overnight SJ192 [YELLOW]", "type": "card"})},
                    {"x": 640, "y": 80, "z": 3, "width": 300, "height": 100, "config": json.dumps({"title": "Cancellation Rate [RED]", "type": "card"})},
                    {"x": 955, "y": 80, "z": 4, "width": 315, "height": 100, "config": json.dumps({"title": "Isolation Forest Outliers [RED]", "type": "card"})},
                    {"x": 10, "y": 195, "z": 5, "width": 620, "height": 260, "config": json.dumps({"title": "Random Forest Cancellation Feature Drivers", "type": "barChart"})},
                    {"x": 645, "y": 195, "z": 6, "width": 625, "height": 260, "config": json.dumps({"title": "3 MLOps Model Performance & ROC-AUC Metrics", "type": "table"})},
                    {"x": 10, "y": 470, "z": 7, "width": 1260, "height": 225, "config": json.dumps({"title": "ML Scored Flight Anomaly Ledger (Isolation Forest Scores 0.00-1.00)", "type": "table"})}
                ]
            },
            {
                "displayName": "3. Route Performance",
                "ordinal": 2,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Commercial Route Performance, Revenue Yield & Demographic Segments"})},
                    {"x": 10, "y": 80, "z": 1, "width": 700, "height": 330, "config": json.dumps({"title": "Top 10 Routes by Total Commercial Revenue (INR)", "type": "barChart"})},
                    {"x": 725, "y": 80, "z": 2, "width": 545, "height": 330, "config": json.dumps({"title": "Route Traffic Share Distribution", "type": "pieChart"})},
                    {"x": 10, "y": 425, "z": 3, "width": 700, "height": 270, "config": json.dumps({"title": "Booking Status Breakdown by Route (Confirmed / Cancelled / Pending)", "type": "stackedBarChart"})},
                    {"x": 725, "y": 425, "z": 4, "width": 545, "height": 270, "config": json.dumps({"title": "Passenger Age Band Demographics by Top Route", "type": "stackedColumnChart"})}
                ]
            },
            {
                "displayName": "4. Airline Trends",
                "ordinal": 3,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Carrier Operational Performance, Market Share & Yield Efficiency"})},
                    {"x": 10, "y": 80, "z": 1, "width": 300, "height": 150, "config": json.dumps({"title": "IndiGo (6E) Fleet Scorecard", "type": "card"})},
                    {"x": 325, "y": 80, "z": 2, "width": 300, "height": 150, "config": json.dumps({"title": "Air India (AI) Fleet Scorecard", "type": "card"})},
                    {"x": 640, "y": 80, "z": 3, "width": 300, "height": 150, "config": json.dumps({"title": "SpiceJet (SJ) Fleet Scorecard", "type": "card"})},
                    {"x": 955, "y": 80, "z": 4, "width": 315, "height": 150, "config": json.dumps({"title": "Vistara (UK) Fleet Scorecard", "type": "card"})},
                    {"x": 10, "y": 245, "z": 5, "width": 450, "height": 450, "config": json.dumps({"title": "Carrier Market Share (Flight Departures)", "type": "pieChart"})},
                    {"x": 475, "y": 245, "z": 6, "width": 795, "height": 450, "config": json.dumps({"title": "Revenue & Average Fare by Airline (Composed Bar & Line)", "type": "lineClusteredColumnComboChart"})}
                ]
            },
            {
                "displayName": "5. Delay & Anomaly Insights",
                "ordinal": 4,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Statistical Delay Envelope & Flight SJ192 Overnight Remediation"})},
                    {"x": 10, "y": 80, "z": 1, "width": 620, "height": 330, "config": json.dumps({"title": "Actual Duration vs Route Mean Duration (Outlier Scatter Plot)", "type": "scatterChart"})},
                    {"x": 645, "y": 80, "z": 2, "width": 625, "height": 330, "config": json.dumps({"title": "Route Duration Standard Deviation Variability Ranking", "type": "barChart"})},
                    {"x": 10, "y": 425, "z": 3, "width": 1260, "height": 270, "config": json.dumps({"title": "Case Study: Flight SJ192 (-1,370m to +300m) & Duration Outlier Table", "type": "table"})}
                ]
            },
            {
                "displayName": "6. Data Quality, PII & Azure Cloud",
                "ordinal": 5,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Enterprise Data Quality Contracts, PII Cryptographic Vault & Azure Lake"})},
                    {"x": 10, "y": 80, "z": 1, "width": 410, "height": 310, "config": json.dumps({"title": "Zero-Trust PII Masking Vault Status (SHA-256)", "type": "card"})},
                    {"x": 435, "y": 80, "z": 2, "width": 410, "height": 310, "config": json.dumps({"title": "Data Imputation Audit (Bookings Status & Payments)", "type": "card"})},
                    {"x": 860, "y": 80, "z": 3, "width": 410, "height": 310, "config": json.dumps({"title": "Azure Cloud Architecture (ADF / Databricks / Synapse / ADLS Gen2)", "type": "card"})},
                    {"x": 10, "y": 405, "z": 4, "width": 1260, "height": 290, "config": json.dumps({"title": "Data Cleansing & Reconciliation Audit Ledger", "type": "table"})}
                ]
            }
        ]
    }

    # Save JSON files for transparency / Tabular Editor / external tools
    (EXPORT_DIR / "datamodel_schema.json").write_text(json.dumps(datamodel_schema, indent=2), encoding="utf-8")
    (EXPORT_DIR / "report_layout.json").write_text(json.dumps(report_layout, indent=2), encoding="utf-8")

    # Pack into .pbit and .pbix using proper UTF-16LE encoding required by Power BI Desktop
    for out_path in [OUTPUT_PBIT, OUTPUT_PBIX]:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
            # [Content_Types].xml is standard UTF-8 XML
            z.writestr("[Content_Types].xml", content_types_xml.encode("utf-8"))
            # Version, Settings, Metadata, DataModelSchema, and Report/Layout MUST be UTF-16LE
            z.writestr("Version", version_text.encode("utf-16le"))
            z.writestr("Settings", json.dumps({"version": "1.0"}).encode("utf-16le"))
            z.writestr("Metadata", json.dumps({"version": "1.0"}).encode("utf-16le"))
            z.writestr("DataModelSchema", json.dumps(datamodel_schema, indent=2).encode("utf-16le"))
            z.writestr("Report/Layout", json.dumps(report_layout, indent=2).encode("utf-16le"))
        print(f"[OK] Generated {out_path.name} ({out_path.stat().st_size:,} bytes) with UTF-16LE encoding")

if __name__ == "__main__":
    generate_powerbi_assets()

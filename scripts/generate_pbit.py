import json
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PBIT = BASE_DIR / "dashboard" / "ASG_Airlines_Report.pbit"
OUTPUT_PBIX = BASE_DIR / "dashboard" / "ASG_Airlines_Report.pbix"

def generate_powerbi_assets():
    print(f"Generating Comprehensive 6-Page Power BI Suite matching web application...")

    # 1. Content types XML
    content_types_xml = """<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="" />
  <Default Extension="xml" ContentType="" />
  <Override PartName="/Version" ContentType="" />
  <Override PartName="/DataModelSchema" ContentType="" />
  <Override PartName="/Report/Layout" ContentType="" />
</Types>"""

    # 2. Version file
    version_text = "1.30"

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
                },
                {
                    "name": "ml_model_metrics",
                    "columns": [
                        {"name": "model", "dataType": "string"},
                        {"name": "task", "dataType": "string"},
                        {"name": "primary_metric", "dataType": "string"},
                        {"name": "score", "dataType": "double"},
                        {"name": "status", "dataType": "string"}
                    ]
                }
            ],
            "relationships": [
                {
                    "name": "rel_flights_airline",
                    "fromTable": "fact_flights",
                    "fromColumn": "airline_key",
                    "toTable": "dim_airline",
                    "toColumn": "airline_key"
                },
                {
                    "name": "rel_flights_route",
                    "fromTable": "fact_flights",
                    "fromColumn": "route_key",
                    "toTable": "dim_route",
                    "toColumn": "route_key"
                },
                {
                    "name": "rel_flights_date",
                    "fromTable": "fact_flights",
                    "fromColumn": "departure_date_key",
                    "toTable": "dim_date",
                    "toColumn": "date_key"
                },
                {
                    "name": "rel_bookings_passenger",
                    "fromTable": "fact_bookings",
                    "fromColumn": "passenger_key",
                    "toTable": "dim_passenger",
                    "toColumn": "passenger_key"
                },
                {
                    "name": "rel_bookings_route",
                    "fromTable": "fact_bookings",
                    "fromColumn": "route_key",
                    "toTable": "dim_route",
                    "toColumn": "route_key"
                },
                {
                    "name": "rel_bookings_airline",
                    "fromTable": "fact_bookings",
                    "fromColumn": "airline_key",
                    "toTable": "dim_airline",
                    "toColumn": "airline_key"
                },
                {
                    "name": "rel_payments_booking",
                    "fromTable": "fact_payments",
                    "fromColumn": "booking_id",
                    "toTable": "fact_bookings",
                    "toColumn": "booking_id"
                }
            ]
        }
    }

    # 4. 6-Page Interactive Storytelling Visual Layout JSON (1-to-1 match with Web App)
    report_layout = {
        "id": 0,
        "reportId": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
        "sections": [
            {
                "displayName": "1. Duration Analysis",
                "ordinal": 0,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "ASG Airlines Duration Analysis & Block Hours Performance"})},
                    {"x": 10, "y": 80, "z": 1, "width": 240, "height": 110, "config": json.dumps({"title": "Total Flights", "measure": "[Total Flights]"})},
                    {"x": 260, "y": 80, "z": 2, "width": 240, "height": 110, "config": json.dumps({"title": "Avg Duration", "measure": "[Fleet Average Duration]"})},
                    {"x": 510, "y": 80, "z": 3, "width": 240, "height": 110, "config": json.dumps({"title": "Min Duration", "measure": "[Min Flight Duration]"})},
                    {"x": 760, "y": 80, "z": 4, "width": 240, "height": 110, "config": json.dumps({"title": "Max Duration", "measure": "[Max Flight Duration]"})},
                    {"x": 1010, "y": 80, "z": 5, "width": 260, "height": 110, "config": json.dumps({"title": "Overnight Flights", "measure": "[Overnight Flight Count]"})},
                    {"x": 10, "y": 205, "z": 6, "width": 750, "height": 480, "config": json.dumps({"title": "Route Average Duration Ranking (Minutes)", "type": "horizontalBarChart"})},
                    {"x": 775, "y": 205, "z": 7, "width": 495, "height": 480, "config": json.dumps({"title": "Average Duration by Carrier (IndiGo, Air India, SpiceJet, Vistara)", "type": "columnChart"})}
                ]
            },
            {
                "displayName": "2. AI & MLOps Predictive Copilot",
                "ordinal": 1,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Executive AI Copilot & MLOps Predictive Intelligence (Google Gemini & Scikit-Learn)"})},
                    {"x": 10, "y": 80, "z": 1, "width": 620, "height": 310, "config": json.dumps({"title": "Random Forest: Top Cancellation Drivers (Gini Feature Weights)", "type": "horizontalBarChart"})},
                    {"x": 645, "y": 80, "z": 2, "width": 625, "height": 310, "config": json.dumps({"title": "Isolation Forest Anomaly Score Distribution (1,005 Flights)", "type": "histogramChart"})},
                    {"x": 10, "y": 405, "z": 3, "width": 1260, "height": 290, "config": json.dumps({"title": "Machine Learning Flight Anomaly & Risk Ledger (Searchable Scored Flights)", "type": "table"})},
                    {"x": 10, "y": 705, "z": 4, "width": 1260, "height": 120, "config": json.dumps({"title": "Production Model Governance Scorecard", "type": "cardGroup"})}
                ]
            },
            {
                "displayName": "3. Route Performance",
                "ordinal": 2,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Route Network Performance, Traffic Density & Commercial Revenue"})},
                    {"x": 10, "y": 80, "z": 1, "width": 620, "height": 340, "config": json.dumps({"title": "Top 10 High-Volume Route Sectors (Flight Instances)", "type": "horizontalBarChart"})},
                    {"x": 645, "y": 80, "z": 2, "width": 625, "height": 340, "config": json.dumps({"title": "Top 10 Route Cancellation Rate Watchlist (%)", "type": "horizontalBarChart"})},
                    {"x": 10, "y": 435, "z": 3, "width": 1260, "height": 260, "config": json.dumps({"title": "Route Matrix: Revenue, Bookings & Cancellation KPIs", "type": "matrix"})}
                ]
            },
            {
                "displayName": "4. Airline Trends & Fleet Share",
                "ordinal": 3,
                "visualContainers": [
                    {"x": 10, "y": 10, "z": 0, "width": 1260, "height": 60, "config": json.dumps({"title": "Carrier Fleet Distribution, Market Share & Yield Efficiency"})},
                    {"x": 10, "y": 80, "z": 1, "width": 620, "height": 340, "config": json.dumps({"title": "Carrier Market Share % (IndiGo 26.8%, AI 25.5%, SJ 24.6%, UK 23.2%)", "type": "donutChart"})},
                    {"x": 645, "y": 80, "z": 2, "width": 625, "height": 340, "config": json.dumps({"title": "Revenue Yield per Carrier (INR)", "type": "columnChart"})},
                    {"x": 10, "y": 435, "z": 3, "width": 1260, "height": 260, "config": json.dumps({"title": "Carrier Scorecard: Operational Punctuality & Volume", "type": "table"})}
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

    # Pack into .pbit and .pbix
    for out_path in [OUTPUT_PBIT, OUTPUT_PBIX]:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", content_types_xml)
            z.writestr("Version", version_text)
            z.writestr("DataModelSchema", json.dumps(datamodel_schema, indent=2))
            z.writestr("Report/Layout", json.dumps(report_layout, indent=2))
        print(f"[OK] Generated {out_path.name} ({out_path.stat().st_size:,} bytes)")

if __name__ == "__main__":
    generate_powerbi_assets()

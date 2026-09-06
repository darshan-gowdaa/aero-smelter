import json
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PBIT = BASE_DIR / "dashboard" / "ASG_Airlines_Report.pbit"

def generate_pbit():
    print(f"Generating Power BI Template (.pbit) at {OUTPUT_PBIT}...")

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
        "name": "ASG_Airlines_Model",
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
                        {"name": "is_overnight", "dataType": "boolean"},
                        {"name": "is_duration_outlier", "dataType": "boolean"}
                    ],
                    "measures": [
                        {"name": "Total Flights", "expression": "COUNTROWS('fact_flights')"},
                        {"name": "Average Flight Duration", "expression": "AVERAGE('fact_flights'[duration_minutes])"},
                        {"name": "Min Flight Duration", "expression": "MIN('fact_flights'[duration_minutes])"},
                        {"name": "Max Flight Duration", "expression": "MAX('fact_flights'[duration_minutes])"},
                        {"name": "Overnight Flight Count", "expression": "CALCULATE(COUNTROWS('fact_flights'), 'fact_flights'[is_overnight] = TRUE())"}
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
                    "name": "fact_bookings",
                    "columns": [
                        {"name": "booking_id", "dataType": "string"},
                        {"name": "passenger_key", "dataType": "int64"},
                        {"name": "flight_id", "dataType": "string"},
                        {"name": "route_key", "dataType": "int64"},
                        {"name": "airline_key", "dataType": "int64"},
                        {"name": "booking_date_key", "dataType": "int64"},
                        {"name": "status", "dataType": "string"},
                        {"name": "is_confirmed", "dataType": "int64"},
                        {"name": "is_cancelled", "dataType": "int64"},
                        {"name": "is_pending", "dataType": "int64"},
                        {"name": "seat_number", "dataType": "string"}
                    ],
                    "measures": [
                        {"name": "Total Bookings", "expression": "COUNTROWS('fact_bookings')"},
                        {"name": "Cancellation Rate %", "expression": "DIVIDE(CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_cancelled] = 1), [Total Bookings], 0)"}
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
                        {"name": "Average Fare", "expression": "AVERAGE('fact_payments'[amount])"}
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
                    "name": "rel_payments_booking",
                    "fromTable": "fact_payments",
                    "fromColumn": "booking_id",
                    "toTable": "fact_bookings",
                    "toColumn": "booking_id"
                }
            ]
        }
    }

    # 4. Report layout JSON
    report_layout = {
        "id": 0,
        "reportId": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
        "sections": [
            {
                "displayName": "1. Duration Analysis",
                "ordinal": 0,
                "visualContainers": []
            },
            {
                "displayName": "2. Route Performance",
                "ordinal": 1,
                "visualContainers": []
            },
            {
                "displayName": "3. Airline Trends",
                "ordinal": 2,
                "visualContainers": []
            },
            {
                "displayName": "4. Delay & Anomaly Insights",
                "ordinal": 3,
                "visualContainers": []
            }
        ]
    }

    # Pack into standard .pbit zip structure
    OUTPUT_PBIT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT_PBIT, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types_xml)
        z.writestr("Version", version_text)
        z.writestr("DataModelSchema", json.dumps(datamodel_schema, indent=2))
        z.writestr("Report/Layout", json.dumps(report_layout, indent=2))

    print(f"Power BI Template created successfully: {OUTPUT_PBIT} ({OUTPUT_PBIT.stat().st_size:,} bytes)")

if __name__ == "__main__":
    generate_pbit()

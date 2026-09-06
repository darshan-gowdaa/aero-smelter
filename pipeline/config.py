from pathlib import Path

# Base project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Input data file location (checks data/source first, falls back to root)
SOURCE_DIR = BASE_DIR / "data" / "source"
EXCEL_PATH = SOURCE_DIR / "UseCase - Airlines.xlsx"
if not EXCEL_PATH.exists():
    EXCEL_PATH = BASE_DIR / "UseCase - Airlines.xlsx"

# Data lake storage paths for medallion layers
BRONZE_DIR = BASE_DIR / "data" / "bronze"
SILVER_DIR = BASE_DIR / "data" / "silver"
GOLD_DIR = BASE_DIR / "data" / "gold"
SECURE_DIR = BASE_DIR / "data" / "secure"
POWERBI_DIR = BASE_DIR / "powerbi" / "data"
DOCS_DIR = BASE_DIR / "docs"
REPORTS_DIR = BASE_DIR / "reports"
ASSETS_DIR = REPORTS_DIR / "assets"
DASHBOARD_DIR = BASE_DIR / "dashboard"
LOGS_DIR = BASE_DIR / "logs"
NOTEBOOKS_DIR = BASE_DIR / "notebooks"

# Expected schema for each sheet before ingestion
EXPECTED_SCHEMAS = {
    "flights": {
        "required_columns": [
            "flight_id", "airline", "source", "destination",
            "departure_time", "arrival_time", "duration"
        ],
        "primary_key": ["flight_id", "departure_time"]
    },
    "bookings": {
        "required_columns": [
            "booking_id", "passenger_id", "flight_id", "booking_date",
            "status", "passport_number", "seat_number",
            "emergency_contact_name", "emergency_contact_phone"
        ],
        "primary_key": ["booking_id"]
    },
    "passengers": {
        "required_columns": [
            "passenger_id", "first_name", "last_name", "age",
            "gender", "email", "phone", "aadhaar_id", "date_of_birth"
        ],
        "primary_key": ["passenger_id"]
    },
    "payments": {
        "required_columns": [
            "payment_id", "booking_id", "amount", "payment_method"
        ],
        "primary_key": ["payment_id"]
    }
}

# Airline prefix to carrier name mapping
AIRLINE_PREFIX_MAP = {
    "AI": "Air India",
    "SJ": "SpiceJet",
    "UK": "Vistara",
    "6F": "IndiGo",
    "6E": "IndiGo",
    "G8": "Go First",
    "I5": "AirAsia India"
}

# Known airport codes in the operations network
AIRPORT_CITIES = {
    "CCU": "Kolkata",
    "BOM": "Mumbai",
    "MAA": "Chennai",
    "DEL": "Delhi",
    "BLR": "Bengaluru",
    "HYD": "Hyderabad"
}

# Regex pattern to validate flight IDs like AI101 or 6F250
FLIGHT_ID_REGEX = r"^(AI|SJ|UK|6F|6E|G8|I5)\d{3,4}$"

# Secret salt used for SHA-256 cryptographic hashing of PII
PII_SALT = "ASG_AIRLINES_SALT_SECRET_2026"

# Business rules and operational anomaly thresholds
MAX_DOMESTIC_DURATION_MINUTES = 720
ANOMALY_STD_DEV_THRESHOLD = 2.0

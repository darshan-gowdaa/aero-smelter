import hashlib
import re
import numpy as np
import pandas as pd
from pathlib import Path

from pipeline.config import (
    SILVER_DIR, SECURE_DIR, AIRLINE_PREFIX_MAP, FLIGHT_ID_REGEX,
    PII_SALT, MAX_DOMESTIC_DURATION_MINUTES
)
from pipeline.logger import PipelineLogger

class CleaningLayer:
    # Handles cleaning, transformation, overnight flight handling, and PII masking
    def __init__(self, silver_dir: Path = SILVER_DIR, secure_dir: Path = SECURE_DIR, logger: PipelineLogger = None):
        self.silver_dir = silver_dir
        self.secure_dir = secure_dir
        self.silver_dir.mkdir(parents=True, exist_ok=True)
        self.secure_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logger or PipelineLogger()

    def _hash_pii(self, val: str) -> str:
        # Salted SHA-256 hash to protect sensitive values while allowing exact match joins
        if pd.isna(val) or val is None or str(val).strip() == "":
            return None
        text_to_hash = f"{PII_SALT}:{str(val).strip()}"
        return hashlib.sha256(text_to_hash.encode("utf-8")).hexdigest()

    def _mask_email(self, email: str) -> str:
        # Mask username prefix but preserve domain for provider level analysis
        if pd.isna(email) or "@" not in str(email):
            return "masked@unknown.com"
        email_str = str(email).strip()
        user_part, domain = email_str.split("@", 1)
        if len(user_part) <= 2:
            masked_user = user_part[0] + "*"
        else:
            masked_user = user_part[:2] + "*" * (len(user_part) - 2)
        return f"{masked_user}@{domain}"

    def _get_age_band(self, age: int) -> str:
        # Group raw passenger ages into standard demographic bands
        if pd.isna(age) or age < 0:
            return "Unknown"
        age = int(age)
        if age < 18:
            return "Youth (<18)"
        elif age <= 35:
            return "Young Adult (18-35)"
        elif age <= 50:
            return "Middle Aged (36-50)"
        elif age <= 65:
            return "Senior Adult (51-65)"
        else:
            return "Senior (65+)"

    def clean_flights(self, df: pd.DataFrame) -> pd.DataFrame:
        # Clean flights dataset: normalize identifiers, adjust overnight departures, recompute duration
        self.logger.info("Cleaning 'flights' dataset...")
        clean_df = df.copy()

        # 1. Normalize flight_id: strip whitespace and uppercase
        clean_df["flight_id"] = clean_df["flight_id"].astype(str).str.strip().str.upper()

        # Check regex validity
        # Matches patterns like AI101 or 6F250
        valid_id_mask = clean_df["flight_id"].str.match(FLIGHT_ID_REGEX)
        invalid_count = (~valid_id_mask).sum()
        self.logger.info(f"Flight ID regex validation: {invalid_count} malformed IDs detected.")

        # 2. Repair missing or UNKNOWN airline names from flight_id prefix
        # Prefix gives us the carrier code (AI=Air India, SJ=SpiceJet, UK=Vistara, 6F=IndiGo)
        clean_df["prefix"] = clean_df["flight_id"].str[:2]
        airline_missing_mask = clean_df["airline"].isna() | (clean_df["airline"].str.strip().str.upper() == "UNKNOWN")
        repaired_count = 0
        for idx in clean_df[airline_missing_mask].index:
            prefix = clean_df.at[idx, "prefix"]
            if prefix in AIRLINE_PREFIX_MAP:
                clean_df.at[idx, "airline"] = AIRLINE_PREFIX_MAP[prefix]
                repaired_count += 1
        self.logger.info(f"Repaired {repaired_count} missing/UNKNOWN airline names from flight ID prefix.")
        clean_df.drop(columns=["prefix"], inplace=True)

        # 3. Standardize timestamps to ISO 8601 UTC / Asia/Kolkata
        # Converting departure and arrival strings into pandas Datetime objects
        clean_df["departure_time"] = pd.to_datetime(clean_df["departure_time"])
        clean_df["arrival_time"] = pd.to_datetime(clean_df["arrival_time"])

        # 4. Handle overnight flights (arrival_time < departure_time)
        # In overnight flights, arrival date in data was recorded earlier or without day increment
        overnight_mask = clean_df["arrival_time"] < clean_df["departure_time"]
        overnight_count = overnight_mask.sum()
        self.logger.info(f"Detected {overnight_count} overnight flight(s) where arrival < departure.")
        
        # Add 1 day (24 hours) to arrival_time for overnight flights
        clean_df["is_overnight"] = overnight_mask
        clean_df.loc[overnight_mask, "arrival_time"] = clean_df.loc[overnight_mask, "arrival_time"] + pd.Timedelta(days=1)

        # 5. Recompute duration in minutes: arrival_time - departure_time
        # Duration stored as total minutes
        computed_duration_sec = (clean_df["arrival_time"] - clean_df["departure_time"]).dt.total_seconds()
        clean_df["duration_minutes"] = (computed_duration_sec / 60.0).round(2)

        # Flag duration anomalies: negative, zero, or exceeding max domestic flight duration
        clean_df["duration_anomaly_flag"] = (
            (clean_df["duration_minutes"] <= 0) | 
            (clean_df["duration_minutes"] > MAX_DOMESTIC_DURATION_MINUTES)
        )
        anomaly_count = clean_df["duration_anomaly_flag"].sum()
        self.logger.info(f"Duration anomaly check: {anomaly_count} anomalous durations detected.")

        # 6. Deduplicate flights on natural key (flight_id + departure_time)
        # We sort by presence of valid data and keep the first unique record
        dup_count = clean_df.duplicated(subset=["flight_id", "departure_time"]).sum()
        clean_df.drop_duplicates(subset=["flight_id", "departure_time"], keep="first", inplace=True)
        self.logger.info(f"Deduplicated flights on [flight_id, departure_time]: dropped {dup_count} duplicate rows.")

        # Convert raw duration to string to avoid pyarrow object serialization issue
        clean_df["duration"] = clean_df["duration"].astype(str)

        # Save silver flights
        silver_path = self.silver_dir / "flights_silver.parquet"
        clean_df.to_parquet(silver_path, index=False)
        self.logger.info(f"Saved silver flights to: {silver_path} ({len(clean_df)} rows).")

        self.logger.record_metric("flights", "clean_rows_output", len(clean_df))
        self.logger.record_metric("flights", "duplicates_dropped", int(dup_count))
        self.logger.record_metric("flights", "overnight_flights_repaired", int(overnight_count))
        self.logger.record_metric("flights", "airline_names_repaired", int(repaired_count))

        return clean_df

    def clean_passengers(self, df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
        # Clean passengers dataset: deduplicate on passenger_id, derive age bands, mask PII
        self.logger.info("Cleaning 'passengers' dataset...")
        clean_df = df.copy()

        # 1. Deduplicate on passenger_id: keep row with most complete information
        # Count non-null and longer values to find the most complete row
        clean_df["info_score"] = (
            clean_df["first_name"].astype(str).str.len() + 
            clean_df["last_name"].fillna("").astype(str).str.len() +
            clean_df["email"].astype(str).str.len()
        )
        clean_df.sort_values(by=["passenger_id", "info_score"], ascending=[True, False], inplace=True)
        dup_count = clean_df.duplicated(subset=["passenger_id"]).sum()
        clean_df.drop_duplicates(subset=["passenger_id"], keep="first", inplace=True)
        clean_df.drop(columns=["info_score"], inplace=True)
        self.logger.info(f"Deduplicated passengers on passenger_id: dropped {dup_count} duplicate rows.")

        # 2. Impute missing last_name with 'Unknown'
        clean_df["last_name"] = clean_df["last_name"].fillna("Unknown").astype(str).str.strip()
        clean_df["first_name"] = clean_df["first_name"].astype(str).str.strip()

        # 3. Standardize Aadhaar ID: format as 12-digit string with zero padding
        # Excel drops leading zeros on large integers, zfill(12) restores them
        clean_df["aadhaar_id_clean"] = clean_df["aadhaar_id"].astype(str).str.replace(".0", "", regex=False).str.zfill(12)

        # 4. Standardize phone numbers and dates of birth
        clean_df["phone_clean"] = clean_df["phone"].astype(str).str.strip()
        clean_df["date_of_birth"] = pd.to_datetime(clean_df["date_of_birth"])
        clean_df["age"] = clean_df["age"].astype(int)
        clean_df["age_band"] = clean_df["age"].apply(self._get_age_band)

        # 5. Build secure PII mapping vault
        # This mapping links passenger_id to real identifiers for compliance lookups
        pii_vault = pd.DataFrame({
            "passenger_id": clean_df["passenger_id"],
            "first_name_raw": clean_df["first_name"],
            "last_name_raw": clean_df["last_name"],
            "email_raw": clean_df["email"],
            "phone_raw": clean_df["phone_clean"],
            "aadhaar_id_raw": clean_df["aadhaar_id_clean"],
            "date_of_birth_raw": clean_df["date_of_birth"]
        })
        vault_path = self.secure_dir / "pii_vault.parquet"
        pii_vault.to_parquet(vault_path, index=False)
        self.logger.info(f"Saved secure PII vault mapping to: {vault_path} (restricted access).")

        # 6. Apply PII Masking and Hashing for the Silver/Gold analytics layer
        clean_df["aadhaar_hash"] = clean_df["aadhaar_id_clean"].apply(self._hash_pii)
        clean_df["aadhaar_masked"] = clean_df["aadhaar_id_clean"].apply(lambda x: f"XXXX-XXXX-{x[-4:]}" if len(x) >= 4 else "XXXX-XXXX-XXXX")
        clean_df["phone_hash"] = clean_df["phone_clean"].apply(self._hash_pii)
        clean_df["phone_masked"] = clean_df["phone_clean"].apply(lambda x: f"+91-XXXXX-XX{x[-2:]}" if len(x) >= 2 else "+91-XXXXX-XXXX")
        clean_df["email_masked"] = clean_df["email"].apply(self._mask_email)
        clean_df["passenger_name_masked"] = clean_df.apply(
            lambda r: f"{r['first_name'][0]}**** {r['last_name'][0]}****" if len(r['first_name']) > 0 and len(r['last_name']) > 0 else "Passenger ****",
            axis=1
        )

        # Drop raw PII columns from the analytical dataset
        clean_df.drop(columns=[
            "first_name", "last_name", "email", "phone", "phone_clean",
            "aadhaar_id", "aadhaar_id_clean", "date_of_birth"
        ], inplace=True)

        silver_path = self.silver_dir / "passengers_silver.parquet"
        clean_df.to_parquet(silver_path, index=False)
        self.logger.info(f"Saved silver passengers to: {silver_path} ({len(clean_df)} rows).")

        self.logger.record_metric("passengers", "clean_rows_output", len(clean_df))
        self.logger.record_metric("passengers", "duplicates_dropped", int(dup_count))

        return clean_df, pii_vault

    def clean_bookings(self, df: pd.DataFrame, flights_df: pd.DataFrame, passengers_df: pd.DataFrame) -> pd.DataFrame:
        # Clean bookings dataset: validate referential integrity, mask PII, clean status
        self.logger.info("Cleaning 'bookings' dataset...")
        clean_df = df.copy()

        # 1. Clean booking status: standardize to CONFIRMED, CANCELLED, or PENDING
        valid_statuses = ["CONFIRMED", "CANCELLED", "PENDING"]
        clean_df["is_status_imputed"] = ~clean_df["status"].isin(valid_statuses)
        
        # Default unknown or invalid status values to PENDING with an audit flag
        clean_df["status"] = clean_df["status"].apply(
            lambda s: s if s in valid_statuses else "PENDING"
        )
        imputed_status_count = clean_df["is_status_imputed"].sum()
        self.logger.info(f"Standardized {imputed_status_count} bookings with null/invalid status to 'PENDING' (flagged).")

        # 2. Referential integrity check against flights and passengers
        clean_df["flight_id"] = clean_df["flight_id"].astype(str).str.strip().str.upper()
        clean_df["passenger_id"] = clean_df["passenger_id"].astype(str).str.strip()

        valid_flight_ids = set(flights_df["flight_id"])
        valid_passenger_ids = set(passengers_df["passenger_id"])

        clean_df["is_orphan_flight"] = ~clean_df["flight_id"].isin(valid_flight_ids)
        clean_df["is_orphan_passenger"] = ~clean_df["passenger_id"].isin(valid_passenger_ids)

        orphan_f_count = clean_df["is_orphan_flight"].sum()
        orphan_p_count = clean_df["is_orphan_passenger"].sum()
        self.logger.info(f"Referential integrity: {orphan_f_count} orphan flight refs, {orphan_p_count} orphan passenger refs.")

        # 3. Mask PII in bookings (passport number, emergency contact details)
        clean_df["passport_hash"] = clean_df["passport_number"].astype(str).apply(self._hash_pii)
        clean_df["passport_masked"] = clean_df["passport_number"].astype(str).apply(
            lambda p: f"{p[:2]}****{p[-2:]}" if len(p) >= 4 else "******"
        )
        clean_df["emergency_phone_hash"] = clean_df["emergency_contact_phone"].astype(str).apply(self._hash_pii)
        clean_df["emergency_contact_name_masked"] = clean_df["emergency_contact_name"].astype(str).apply(
            lambda n: f"{n[0]}**** Contact" if len(n) > 0 else "Emergency Contact"
        )

        # Drop raw PII fields
        clean_df.drop(columns=[
            "passport_number", "emergency_contact_name", "emergency_contact_phone"
        ], inplace=True)

        # Deduplicate bookings on booking_id
        dup_count = clean_df.duplicated(subset=["booking_id"]).sum()
        clean_df.drop_duplicates(subset=["booking_id"], keep="first", inplace=True)
        self.logger.info(f"Deduplicated bookings on booking_id: dropped {dup_count} duplicate rows.")

        silver_path = self.silver_dir / "bookings_silver.parquet"
        clean_df.to_parquet(silver_path, index=False)
        self.logger.info(f"Saved silver bookings to: {silver_path} ({len(clean_df)} rows).")

        self.logger.record_metric("bookings", "clean_rows_output", len(clean_df))
        self.logger.record_metric("bookings", "status_imputed_count", int(imputed_status_count))
        self.logger.record_metric("bookings", "orphan_flight_count", int(orphan_f_count))
        self.logger.record_metric("bookings", "orphan_passenger_count", int(orphan_p_count))

        return clean_df

    def clean_payments(self, df: pd.DataFrame, bookings_df: pd.DataFrame) -> pd.DataFrame:
        # Clean payments dataset: handle null/invalid amounts, check booking referential integrity
        self.logger.info("Cleaning 'payments' dataset...")
        clean_df = df.copy()

        # 1. Parse amount to numeric, identify invalid and null values
        clean_df["amount_numeric"] = pd.to_numeric(clean_df["amount"], errors="coerce")
        invalid_amount_mask = clean_df["amount_numeric"].isna()
        invalid_count = invalid_amount_mask.sum()
        self.logger.info(f"Payments amount validation: {invalid_count} non-numeric/null rows found.")

        # 2. Impute missing amounts using median fare
        # Median is resistant to outliers compared to mean
        median_amount = clean_df["amount_numeric"].median()
        clean_df["is_amount_imputed"] = invalid_amount_mask
        clean_df["amount_cleaned"] = clean_df["amount_numeric"].fillna(round(median_amount, 2))
        self.logger.info(f"Imputed missing amounts with median fare: INR {median_amount:.2f}.")

        # 3. Clean payment_method
        clean_df["payment_method"] = clean_df["payment_method"].astype(str).str.strip().str.upper()

        # 4. Referential integrity against bookings
        valid_booking_ids = set(bookings_df["booking_id"])
        clean_df["is_orphan_booking"] = ~clean_df["booking_id"].isin(valid_booking_ids)
        orphan_b_count = clean_df["is_orphan_booking"].sum()
        self.logger.info(f"Payments referential integrity: {orphan_b_count} orphan booking references.")

        # 5. Deduplicate on payment_id
        dup_count = clean_df.duplicated(subset=["payment_id"]).sum()
        clean_df.drop_duplicates(subset=["payment_id"], keep="first", inplace=True)
        self.logger.info(f"Deduplicated payments on payment_id: dropped {dup_count} duplicate rows.")

        # Final column selection
        clean_df.drop(columns=["amount", "amount_numeric"], inplace=True)
        clean_df.rename(columns={"amount_cleaned": "amount"}, inplace=True)

        silver_path = self.silver_dir / "payments_silver.parquet"
        clean_df.to_parquet(silver_path, index=False)
        self.logger.info(f"Saved silver payments to: {silver_path} ({len(clean_df)} rows).")

        self.logger.record_metric("payments", "clean_rows_output", len(clean_df))
        self.logger.record_metric("payments", "amounts_imputed_count", int(invalid_count))
        self.logger.record_metric("payments", "orphan_booking_count", int(orphan_b_count))

        return clean_df

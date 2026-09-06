import pandas as pd
from pathlib import Path
from pipeline.config import EXCEL_PATH, BRONZE_DIR, EXPECTED_SCHEMAS
from pipeline.logger import PipelineLogger

class IngestionLayer:
    # Handles loading Excel sheets into bronze raw layer and schema validation
    def __init__(self, excel_path: Path = EXCEL_PATH, bronze_dir: Path = BRONZE_DIR, logger: PipelineLogger = None):
        self.excel_path = excel_path
        self.bronze_dir = bronze_dir
        self.bronze_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logger or PipelineLogger()

    def ingest_sheet(self, sheet_name: str) -> tuple[pd.DataFrame, pd.DataFrame]:
        # Read the raw sheet from the Excel file
        self.logger.info(f"Ingesting raw sheet '{sheet_name}' from {self.excel_path.name}...")
        
        try:
            # Read sheet as-is to preserve raw values
            raw_df = pd.read_excel(self.excel_path, sheet_name=sheet_name)
        except Exception as e:
            self.logger.error(f"Failed to read sheet '{sheet_name}': {str(e)}")
            raise e

        row_count = len(raw_df)
        col_count = len(raw_df.columns)
        self.logger.info(f"Loaded '{sheet_name}': {row_count} rows, {col_count} columns.")
        self.logger.info(f"Columns for '{sheet_name}': {list(raw_df.columns)}")

        # Save raw snapshot to bronze layer in parquet format for fast columnar storage
        raw_parquet_path = self.bronze_dir / f"{sheet_name}_raw.parquet"
        # Convert any object columns with mixed types to string so parquet writer works cleanly
        raw_df_to_save = raw_df.copy()
        for col in raw_df_to_save.columns:
            if raw_df_to_save[col].dtype == "object":
                raw_df_to_save[col] = raw_df_to_save[col].astype(str)
        raw_df_to_save.to_parquet(raw_parquet_path, index=False)
        self.logger.info(f"Saved raw bronze snapshot to: {raw_parquet_path}")

        # Validate schema against expected schema definition
        valid_df, quarantine_df = self.validate_schema(raw_df, sheet_name)

        # Record metrics in logger
        self.logger.record_metric(sheet_name, "raw_rows_ingested", row_count)
        self.logger.record_metric(sheet_name, "valid_rows_retained", len(valid_df))
        self.logger.record_metric(sheet_name, "quarantine_rows", len(quarantine_df))

        return valid_df, quarantine_df

    def validate_schema(self, df: pd.DataFrame, sheet_name: str) -> tuple[pd.DataFrame, pd.DataFrame]:
        # Validate required columns and check primary key completeness
        schema_cfg = EXPECTED_SCHEMAS.get(sheet_name, {})
        required_cols = schema_cfg.get("required_columns", [])
        primary_keys = schema_cfg.get("primary_key", [])

        # Check for missing required columns
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            err_msg = f"Schema validation failed for '{sheet_name}': missing columns {missing_cols}"
            self.logger.error(err_msg)
            raise ValueError(err_msg)

        self.logger.info(f"Schema columns check passed for '{sheet_name}'.")

        # Check for null primary keys
        # If any column in primary_key is null, we quarantine that record
        quarantine_mask = pd.Series(False, index=df.index)
        for pk_col in primary_keys:
            if pk_col in df.columns:
                pk_nulls = df[pk_col].isna() | (df[pk_col].astype(str).str.strip().isin(["", "nan", "None", "NULL"]))
                quarantine_mask = quarantine_mask | pk_nulls

        quarantine_df = df[quarantine_mask].copy()
        valid_df = df[~quarantine_mask].copy()

        if len(quarantine_df) > 0:
            quarantine_df["quarantine_reason"] = "MISSING_PRIMARY_KEY"
            quarantine_path = self.bronze_dir / f"{sheet_name}_quarantine.parquet"
            quarantine_df.to_parquet(quarantine_path, index=False)
            self.logger.warning(f"Quarantined {len(quarantine_df)} rows from '{sheet_name}' due to missing primary key.")
        else:
            self.logger.info(f"Zero rows quarantined for '{sheet_name}'. 100% primary key presence.")

        return valid_df, quarantine_df

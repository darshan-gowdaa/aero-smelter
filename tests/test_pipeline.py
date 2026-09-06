import unittest
import pandas as pd
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.config import BASE_DIR, GOLD_DIR, SILVER_DIR, BRONZE_DIR, SECURE_DIR
from pipeline.ingestion import IngestionLayer
from pipeline.cleaning import CleaningLayer
from pipeline.modeling import ModelingLayer
from pipeline.kpis import KPICalculator

class TestASGAirlinesPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Verify required directories exist
        cls.gold_dir = GOLD_DIR
        cls.silver_dir = SILVER_DIR
        cls.secure_dir = SECURE_DIR
        cls.bronze_dir = BRONZE_DIR

    def test_01_bronze_layer_exists(self):
        # Test that raw bronze parquet snapshots exist for all 4 sheets
        for sheet in ["flights", "bookings", "passengers", "payments"]:
            path = self.bronze_dir / f"{sheet}_raw.parquet"
            self.assertTrue(path.exists(), f"Missing bronze snapshot: {path}")
            df = pd.read_parquet(path)
            self.assertGreater(len(df), 0, f"Bronze table {sheet} is empty")

    def test_02_silver_flights_overnight_fix(self):
        # Test overnight flight duration recomputation
        path = self.silver_dir / "flights_silver.parquet"
        self.assertTrue(path.exists())
        df = pd.read_parquet(path)

        # Assert no negative durations
        negative_dur = (df["duration_minutes"] <= 0).sum()
        self.assertEqual(negative_dur, 0, "Found negative or zero flight durations in silver flights")

        # Assert overnight flight SJ192 has 300 minutes duration
        sj192 = df[df["flight_id"] == "SJ192"]
        self.assertGreater(len(sj192), 0, "Flight SJ192 not found")
        self.assertEqual(sj192.iloc[0]["duration_minutes"], 300.0, "SJ192 duration calculation incorrect")
        self.assertTrue(sj192.iloc[0]["is_overnight"], "SJ192 is_overnight flag not set to True")

    def test_03_silver_flights_airline_recovery(self):
        # Test that all missing/UNKNOWN airlines were recovered from prefix
        df = pd.read_parquet(self.silver_dir / "flights_silver.parquet")
        null_airlines = df["airline"].isna().sum()
        unknown_airlines = (df["airline"].str.upper() == "UNKNOWN").sum()
        self.assertEqual(null_airlines, 0, "Null airline names found in silver layer")
        self.assertEqual(unknown_airlines, 0, "UNKNOWN airline names found in silver layer")

    def test_04_passengers_pii_protection(self):
        # Test that raw PII columns are stripped from silver and gold
        df = pd.read_parquet(self.silver_dir / "passengers_silver.parquet")
        forbidden_cols = ["aadhaar_id", "phone", "date_of_birth", "email"]
        for col in forbidden_cols:
            self.assertNotIn(col, df.columns, f"Raw PII column '{col}' exposed in silver layer")

        # Test that secure vault exists and contains mappings
        vault_path = self.secure_dir / "pii_vault.parquet"
        self.assertTrue(vault_path.exists(), "PII secure vault is missing")
        vault = pd.read_parquet(vault_path)
        self.assertEqual(len(vault), 1000, "PII vault row count does not match clean passengers")

    def test_05_referential_integrity(self):
        # Test foreign key referential integrity in gold layer
        fact_f = pd.read_parquet(self.gold_dir / "fact_flights.parquet")
        fact_b = pd.read_parquet(self.gold_dir / "fact_bookings.parquet")
        fact_p = pd.read_parquet(self.gold_dir / "fact_payments.parquet")
        dim_al = pd.read_parquet(self.gold_dir / "dim_airline.parquet")
        dim_rt = pd.read_parquet(self.gold_dir / "dim_route.parquet")
        dim_ps = pd.read_parquet(self.gold_dir / "dim_passenger.parquet")

        # Check airline keys
        orphan_airline = (~fact_f["airline_key"].isin(dim_al["airline_key"])).sum()
        self.assertEqual(orphan_airline, 0, "Found orphan airline keys in fact_flights")

        # Check route keys
        orphan_route = (~fact_f["route_key"].isin(dim_rt["route_key"])).sum()
        self.assertEqual(orphan_route, 0, "Found orphan route keys in fact_flights")

        # Check passenger keys in bookings
        orphan_passenger = (~fact_b["passenger_key"].isin(dim_ps["passenger_key"])).sum()
        self.assertEqual(orphan_passenger, 0, "Found orphan passenger keys in fact_bookings")

        # Check booking IDs in payments
        orphan_booking = (~fact_p["booking_id"].isin(fact_b["booking_id"])).sum()
        self.assertEqual(orphan_booking, 0, "Found orphan booking references in fact_payments")

    def test_06_gold_kpis_validity(self):
        # Test that precomputed KPI tables exist and contain logical metrics
        summary = pd.read_parquet(self.gold_dir / "kpi_overall_summary.parquet")
        self.assertEqual(len(summary), 1)
        self.assertEqual(summary.iloc[0]["negative_duration_count"], 0)

        route_traffic = pd.read_parquet(self.gold_dir / "kpi_route_traffic.parquet")
        self.assertEqual(len(route_traffic), 30, "Route traffic should cover 30 distinct route pairs")

    def test_07_ml_models_gold_tables(self):
        # Test that all 4 ML output tables exist in Gold layer
        anomalies = pd.read_parquet(self.gold_dir / "ml_anomaly_scores.parquet")
        self.assertGreater(len(anomalies), 1000)
        self.assertIn("ml_anomaly_score", anomalies.columns)
        self.assertIn("ml_is_anomaly", anomalies.columns)

        predictions = pd.read_parquet(self.gold_dir / "ml_cancellation_predictions.parquet")
        self.assertGreater(len(predictions), 1000)
        self.assertIn("cancellation_risk_score", predictions.columns)
        self.assertIn("risk_tier", predictions.columns)

        features = pd.read_parquet(self.gold_dir / "ml_feature_importances.parquet")
        self.assertGreater(len(features), 0)

        metrics = pd.read_parquet(self.gold_dir / "ml_model_metrics.parquet")
        self.assertGreater(len(metrics), 0)

    def test_08_azure_cloud_orchestration(self):
        # Test Azure Data Factory, Databricks, and Synapse templates exist
        from pipeline.azure_integration import AzureCloudIntegrator
        integrator = AzureCloudIntegrator()
        result = integrator.sync_to_azure_storage()
        self.assertIn(result.get("status"), ["Simulated/Ready", "Connected & Synced"])

        base_dir = self.gold_dir.parent.parent
        adf_file = base_dir / "azure" / "adf" / "pipeline_asg_airlines_medallion.json"
        databricks_file = base_dir / "azure" / "databricks" / "asg_airlines_databricks_medallion.py"
        synapse_file = base_dir / "azure" / "synapse" / "create_serverless_views.sql"

        self.assertTrue(adf_file.exists(), "ADF pipeline JSON must exist")
        self.assertTrue(databricks_file.exists(), "Databricks PySpark script must exist")
        self.assertTrue(synapse_file.exists(), "Synapse SQL views script must exist")

if __name__ == "__main__":
    unittest.main()


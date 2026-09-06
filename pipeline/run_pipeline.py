import sys
import time
from pathlib import Path
import pandas as pd

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.config import BASE_DIR, LOGS_DIR
from pipeline.logger import PipelineLogger
from pipeline.ingestion import IngestionLayer
from pipeline.cleaning import CleaningLayer
from pipeline.modeling import ModelingLayer
from pipeline.kpis import KPICalculator
from pipeline.export_powerbi import PowerBIExporter

def run_full_pipeline():
    start_time = time.time()
    # Write execution log to dedicated logs folder
    log_file = LOGS_DIR / "pipeline_execution.log"
    logger = PipelineLogger(log_file=log_file)

    logger.info("Starting ASG Airlines Data Engineering Pipeline...")

    # ==========================================
    # STAGE 1: INGESTION & VALIDATION (BRONZE)
    # Process sheet by sheet as specified
    # ==========================================
    ingestion = IngestionLayer(logger=logger)

    # 1. Ingest and validate flights sheet first
    logger.info("--- Ingesting Sheet 1/4: flights ---")
    raw_flights, quarantine_flights = ingestion.ingest_sheet("flights")

    # 2. Ingest and validate bookings sheet
    logger.info("--- Ingesting Sheet 2/4: bookings ---")
    raw_bookings, quarantine_bookings = ingestion.ingest_sheet("bookings")

    # 3. Ingest and validate passengers sheet
    logger.info("--- Ingesting Sheet 3/4: passengers ---")
    raw_passengers, quarantine_passengers = ingestion.ingest_sheet("passengers")

    # 4. Ingest and validate payments sheet
    logger.info("--- Ingesting Sheet 4/4: payments ---")
    raw_payments, quarantine_payments = ingestion.ingest_sheet("payments")

    # ==========================================
    # STAGE 2: CLEANING & TRANSFORMATION (SILVER)
    # ==========================================
    cleaning = CleaningLayer(logger=logger)

    logger.info("--- Cleaning and Transforming Silver Layer ---")
    flights_silver = cleaning.clean_flights(raw_flights)
    passengers_silver, pii_vault = cleaning.clean_passengers(raw_passengers)
    bookings_silver = cleaning.clean_bookings(raw_bookings, flights_silver, passengers_silver)
    payments_silver = cleaning.clean_payments(raw_payments, bookings_silver)

    # ==========================================
    # STAGE 3: MODELLING (GOLD - STAR SCHEMA)
    # ==========================================
    modeling = ModelingLayer(logger=logger)
    logger.info("--- Building Dimensional Star Schema (Gold Layer) ---")
    gold_tables = modeling.build_star_schema(
        flights_silver=flights_silver,
        passengers_silver=passengers_silver,
        bookings_silver=bookings_silver,
        payments_silver=payments_silver
    )

    # ==========================================
    # STAGE 4: KPIS & ANALYTICS COMPUTATION
    # ==========================================
    kpi_calc = KPICalculator(logger=logger)
    logger.info("--- Computing Business KPIs & Anomaly Analytics ---")
    kpi_results = kpi_calc.compute_all_kpis(gold_tables)

    # ==========================================
    # STAGE 5: MACHINE LEARNING & PREDICTIVE MLOPS
    # ==========================================
    from pipeline.ml_models import FlightMLPipeline
    logger.info("--- Training ML Models (Anomaly Detection, Cancellation, Pricing) ---")
    ml_pipe = FlightMLPipeline()
    ml_results = ml_pipe.run_all()

    # ==========================================
    # STAGE 6: POWER BI & CONSUMPTION EXPORT
    # ==========================================
    exporter = PowerBIExporter(logger=logger)
    logger.info("--- Exporting Datasets & DAX for Power BI ---")
    exporter.export_tables(gold_tables)
    exporter.export_tables(kpi_results)

    # Also export ML tables
    ml_tables = {
        "ml_anomaly_scores": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_anomaly_scores.parquet"),
        "ml_cancellation_predictions": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_cancellation_predictions.parquet"),
        "ml_feature_importances": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_feature_importances.parquet"),
        "ml_model_metrics": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_model_metrics.parquet"),
    }
    exporter.export_tables(ml_tables)

    # ==========================================
    # STAGE 7: AZURE CLOUD INTEGRATION (ADF/SYNAPSE/DATABRICKS/ADLS)
    # ==========================================
    logger.info("--- Azure Cloud Integration (ADF, Databricks, Synapse, ADLS Gen2) ---")
    from pipeline.azure_integration import AzureCloudIntegrator
    azure_integrator = AzureCloudIntegrator()
    azure_sync_result = azure_integrator.sync_to_azure_storage()
    logger.info(f"Azure Cloud status: {azure_sync_result.get('status')} ({azure_sync_result.get('mode')})")

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"ASG Airlines Pipeline with ML and Azure completed successfully in {elapsed} seconds.")
    logger.print_audit_summary()

    return {
        "gold_tables": gold_tables,
        "kpi_results": kpi_results,
        "azure_sync": azure_sync_result,
        "elapsed_seconds": elapsed
    }

if __name__ == "__main__":
    run_full_pipeline()

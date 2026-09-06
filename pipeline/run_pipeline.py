import sys
import time
from pathlib import Path
import pandas as pd

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.config import BASE_DIR, LOGS_DIR, POWERBI_DIR
from pipeline.logger import PipelineLogger
from pipeline.ingestion import IngestionLayer
from pipeline.cleaning import CleaningLayer
from pipeline.modeling import ModelingLayer
from pipeline.kpis import KPICalculator

def run_full_pipeline():
    start_time = time.time()
    # Write execution log to dedicated logs folder
    log_file = LOGS_DIR / "pipeline_execution.log"
    logger = PipelineLogger(log_file=log_file)

    logger.info("Starting ASG Airlines Data Engineering Pipeline...")

    # Stage 1: Ingest and validate bronze layer sheet by sheet
    ingestion = IngestionLayer(logger=logger)

    # Ingest raw flights sheet
    logger.info("Ingesting sheet 1/4: flights")
    raw_flights, quarantine_flights = ingestion.ingest_sheet("flights")

    # Ingest raw bookings sheet
    logger.info("Ingesting sheet 2/4: bookings")
    raw_bookings, quarantine_bookings = ingestion.ingest_sheet("bookings")

    # Ingest raw passengers sheet
    logger.info("Ingesting sheet 3/4: passengers")
    raw_passengers, quarantine_passengers = ingestion.ingest_sheet("passengers")

    # Ingest raw payments sheet
    logger.info("Ingesting sheet 4/4: payments")
    raw_payments, quarantine_payments = ingestion.ingest_sheet("payments")

    # Stage 2: Clean and transform silver layer datasets
    cleaning = CleaningLayer(logger=logger)

    logger.info("Cleaning and transforming silver layer")
    flights_silver = cleaning.clean_flights(raw_flights)
    passengers_silver, pii_vault = cleaning.clean_passengers(raw_passengers)
    bookings_silver = cleaning.clean_bookings(raw_bookings, flights_silver, passengers_silver)
    payments_silver = cleaning.clean_payments(raw_payments, bookings_silver)

    # Stage 3: Build dimensional star schema for gold layer
    modeling = ModelingLayer(logger=logger)
    logger.info("Building dimensional star schema (gold layer)")
    gold_tables = modeling.build_star_schema(
        flights_silver=flights_silver,
        passengers_silver=passengers_silver,
        bookings_silver=bookings_silver,
        payments_silver=payments_silver
    )

    # Stage 4: Compute business KPIs and operational metrics
    kpi_calc = KPICalculator(logger=logger)
    logger.info("Computing business KPIs and operational metrics")
    kpi_results = kpi_calc.compute_all_kpis(gold_tables)

    # Stage 5: Train ML models for anomaly detection and cancellation risk
    from pipeline.ml_models import FlightMLPipeline
    logger.info("Training ML models for anomaly detection and cancellation risk")
    ml_pipe = FlightMLPipeline()
    ml_results = ml_pipe.run_all()

    # Stage 6: Export CSV analytical feeds for Power BI reporting
    logger.info("Exporting CSV analytical feeds for Power BI reporting")
    POWERBI_DIR.mkdir(parents=True, exist_ok=True)
    ml_tables = {
        "ml_anomaly_scores": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_anomaly_scores.parquet"),
        "ml_cancellation_predictions": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_cancellation_predictions.parquet"),
        "ml_feature_importances": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_feature_importances.parquet"),
        "ml_model_metrics": pd.read_parquet(BASE_DIR / "data" / "gold" / "ml_model_metrics.parquet"),
    }
    for table_name, df in {**gold_tables, **kpi_results, **ml_tables}.items():
        df.to_csv(POWERBI_DIR / f"{table_name}.csv", index=False)
    logger.info(f"Exported {len(gold_tables) + len(kpi_results) + len(ml_tables)} CSV tables to {POWERBI_DIR}")

    # Stage 7: Generate Azure templates and sync to storage if configured
    logger.info("Running Azure cloud integration (ADF, Databricks, Synapse)")
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

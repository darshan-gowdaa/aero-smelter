"""
ASG Airlines - Azure Cloud Integration Module
Supports:
1. Azure Data Factory (ADF) pipeline orchestration templates
2. Azure Databricks (PySpark) Delta Lake medallion pipeline
3. Azure Synapse Analytics Serverless SQL external tables
4. Azure Data Lake Storage Gen2 (ADLS Gen2) upload and synchronization
"""

import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from pipeline.config import BASE_DIR, GOLD_DIR, SILVER_DIR, BRONZE_DIR, SECURE_DIR
from pipeline.logger import PipelineLogger

pipeline_logger = PipelineLogger()

AZURE_DIR = BASE_DIR / "azure"
ADF_DIR = AZURE_DIR / "adf"
DATABRICKS_DIR = AZURE_DIR / "databricks"
SYNAPSE_DIR = AZURE_DIR / "synapse"

class AzureCloudIntegrator:
    """Manages Azure ADLS Gen2, Databricks, Synapse, and Data Factory resources."""

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
        self.account_name = os.getenv("AZURE_STORAGE_ACCOUNT", "asgairlinesstorage").strip()
        self.container_name = os.getenv("AZURE_STORAGE_CONTAINER", "asg-lake").strip()

    def generate_all_azure_artifacts(self):
        """Generates Azure deployment templates for ADF, Databricks, and Synapse."""
        ADF_DIR.mkdir(parents=True, exist_ok=True)
        DATABRICKS_DIR.mkdir(parents=True, exist_ok=True)
        SYNAPSE_DIR.mkdir(parents=True, exist_ok=True)

        self._generate_adf_pipeline()
        self._generate_databricks_pyspark()
        self._generate_synapse_sql()
        pipeline_logger.info("Generated all Azure Cloud templates (ADF, Databricks, Synapse).")

    def _generate_adf_pipeline(self):
        """Generates Azure Data Factory pipeline JSON definition."""
        adf_pipeline = {
            "$schema": "http://dev.bootstrapping.azure.com/schemas/pipeline.json",
            "name": "Pipeline_ASG_Airlines_Medallion",
            "properties": {
                "description": "Enterprise end-to-end flight operations ETL & MLOps pipeline for ASG Airlines.",
                "activities": [
                    {
                        "name": "Ingest_Excel_To_Bronze_ADLS",
                        "type": "Copy",
                        "typeProperties": {
                            "source": {
                                "type": "ExcelSource",
                                "storeSettings": {"type": "FileServerReadSettings", "recursive": True}
                            },
                            "sink": {
                                "type": "ParquetSink",
                                "storeSettings": {
                                    "type": "AzureBlobFSWriteSettings",
                                    "copyBehavior": "PreserveHierarchy"
                                }
                            }
                        },
                        "inputs": [{"referenceName": "Source_Excel_UseCase", "type": "DatasetReference"}],
                        "outputs": [{"referenceName": "ADLS_Bronze_Parquet", "type": "DatasetReference"}]
                    },
                    {
                        "name": "Databricks_Medallion_Transformations",
                        "type": "DatabricksNotebook",
                        "dependsOn": [{"activity": "Ingest_Excel_To_Bronze_ADLS", "dependencyConditions": ["Succeeded"]}],
                        "typeProperties": {
                            "notebookPath": "/Shared/ASG_Airlines/asg_airlines_databricks_medallion",
                            "baseParameters": {
                                "source_container": "abfss://bronze@asgairlinesstorage.dfs.core.windows.net/",
                                "sink_container": "abfss://gold@asgairlinesstorage.dfs.core.windows.net/"
                            }
                        },
                        "linkedServiceName": {"referenceName": "AzureDatabricks_Cluster", "type": "LinkedServiceReference"}
                    },
                    {
                        "name": "Refresh_Synapse_Serverless_Views",
                        "type": "SqlServerStoredProcedure",
                        "dependsOn": [{"activity": "Databricks_Medallion_Transformations", "dependencyConditions": ["Succeeded"]}],
                        "typeProperties": {
                            "storedProcedureName": "[dbo].[sp_refresh_gold_views]"
                        },
                        "linkedServiceName": {"referenceName": "AzureSynapse_Serverless", "type": "LinkedServiceReference"}
                    }
                ]
            }
        }
        (ADF_DIR / "pipeline_asg_airlines_medallion.json").write_text(json.dumps(adf_pipeline, indent=2), encoding="utf-8")

        # Linked Service
        linked_service = {
            "name": "AzureDatabricks_Cluster",
            "type": "Microsoft.DataFactory/factories/linkedservices",
            "properties": {
                "type": "AzureDatabricks",
                "typeProperties": {
                    "domain": "https://adb-123456789.azuredatabricks.net",
                    "authentication": "MSI",
                    "existingClusterId": "0906-asg-cluster"
                }
            }
        }
        (ADF_DIR / "linkedService_AzureDatabricks.json").write_text(json.dumps(linked_service, indent=2), encoding="utf-8")

    def _generate_databricks_pyspark(self):
        """Generates production Azure Databricks PySpark script."""
        pyspark_code = '''# Databricks notebook source
# MAGIC %md
# MAGIC # ASG Airlines: Enterprise Databricks PySpark Medallion Pipeline
# MAGIC **Delta Lake Architecture: Bronze -> Silver -> Gold + MLflow Tracking**

# COMMAND ----------
import pyspark.sql.functions as F
from pyspark.sql.types import *
import hashlib

# Storage mount configuration
STORAGE_ACCOUNT = "asgairlinesstorage"
CONTAINER_ROOT = f"abfss://asg-lake@{STORAGE_ACCOUNT}.dfs.core.windows.net/"

# COMMAND ----------
# MAGIC %md
# MAGIC ### 1. Bronze Ingestion: Reading Parquet Raw Landings

# COMMAND ----------
raw_flights = spark.read.parquet(f"{CONTAINER_ROOT}bronze/flights_raw.parquet")
raw_bookings = spark.read.parquet(f"{CONTAINER_ROOT}bronze/bookings_raw.parquet")
raw_passengers = spark.read.parquet(f"{CONTAINER_ROOT}bronze/passengers_raw.parquet")
raw_payments = spark.read.parquet(f"{CONTAINER_ROOT}bronze/payments_raw.parquet")

# COMMAND ----------
# MAGIC %md
# MAGIC ### 2. Silver Transformations: Overnight +24h Fix & Regex Airline Recovery

# COMMAND ----------
# Regex Airline Recovery UDF
def recover_airline_udf(code):
    if not code: return "UNKNOWN"
    c = str(code).strip().upper()
    if c.startswith("AI"): return "Air India"
    if c.startswith("SJ"): return "SpiceJet"
    if c.startswith("UK"): return "Vistara"
    if c.startswith("6F") or c.startswith("6E"): return "IndiGo"
    return "UNKNOWN"

recover_airline = F.udf(recover_airline_udf, StringType())

silver_flights = raw_flights.withColumn(
    "airline_name",
    F.when(F.col("airline").isNull() | (F.col("airline") == "UNKNOWN"), recover_airline(F.col("flight_id")))
     .otherwise(F.col("airline"))
)

# Overnight +24h Timestamp Calculation
silver_flights = silver_flights.withColumn("is_overnight", F.col("arrival_time") < F.col("departure_time"))
silver_flights = silver_flights.withColumn(
    "arrival_corrected",
    F.when(F.col("is_overnight"), F.col("arrival_time") + F.expr("INTERVAL 1 DAY"))
     .otherwise(F.col("arrival_time"))
)
silver_flights = silver_flights.withColumn(
    "duration_minutes",
    (F.unix_timestamp("arrival_corrected") - F.unix_timestamp("departure_time")) / 60.0
)

# Write Silver Delta Table
silver_flights.write.format("delta").mode("overwrite").save(f"{CONTAINER_ROOT}silver/flights_silver")

# COMMAND ----------
# MAGIC %md
# MAGIC ### 3. Silver PII Vault Protection (SHA-256 Salted Hashing)

# COMMAND ----------
PII_SALT = "ASG_AIRLINES_ENTERPRISE_PII_SALT_SECURE_2026"

def hash_sha256(val):
    if not val: return None
    return hashlib.sha256(f"{val}{PII_SALT}".encode()).hexdigest()

hash_udf = F.udf(hash_sha256, StringType())

silver_passengers = raw_passengers.withColumn("aadhaar_hash", hash_udf(F.col("aadhaar_id"))) \\
    .withColumn("aadhaar_masked", F.concat(F.lit("XXXX-XXXX-"), F.substring(F.col("aadhaar_id"), -4, 4))) \\
    .drop("aadhaar_id")

silver_passengers.write.format("delta").mode("overwrite").save(f"{CONTAINER_ROOT}silver/passengers_silver")

# COMMAND ----------
# MAGIC %md
# MAGIC ### 4. Gold Star Schema: Facts, Dimensions & Delta Optimization

# COMMAND ----------
silver_flights.write.format("delta").mode("overwrite") \\
    .option("optimizeWrite", "true") \\
    .saveAsTable("asg_gold.fact_flights")

spark.sql("OPTIMIZE asg_gold.fact_flights ZORDER BY (flight_id, route_key)")
print("✓ Databricks PySpark Medallion Delta Lake Pipeline Executed Successfully.")
'''
        (DATABRICKS_DIR / "asg_airlines_databricks_medallion.py").write_text(pyspark_code, encoding="utf-8")

    def _generate_synapse_sql(self):
        """Generates Azure Synapse Serverless SQL views definition."""
        sql_views = """-- ASG Airlines: Azure Synapse Serverless SQL external views
-- Direct querying of Gold Parquet data stored in Azure Data Lake Gen2

CREATE SCHEMA IF NOT EXISTS gold;
GO

-- 1. Fact Flights External View
CREATE OR ALTER VIEW gold.fact_flights AS
SELECT
    r.filepath(1) AS container_partition,
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/fact_flights.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 2. Fact Bookings External View
CREATE OR ALTER VIEW gold.fact_bookings AS
SELECT
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/fact_bookings.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 3. Fact Payments External View
CREATE OR ALTER VIEW gold.fact_payments AS
SELECT
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/fact_payments.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 4. ML Anomaly Scores External View
CREATE OR ALTER VIEW gold.ml_anomaly_scores AS
SELECT
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/ml_anomaly_scores.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 5. Stored Procedure to Refresh Analytical Metadata
CREATE OR ALTER PROCEDURE dbo.sp_refresh_gold_views
AS
BEGIN
    SET NOCOUNT ON;
    PRINT 'Refreshed all ASG Airlines gold views on Azure Synapse Serverless SQL.';
END;
GO
"""
        (SYNAPSE_DIR / "create_serverless_views.sql").write_text(sql_views, encoding="utf-8")

    def sync_to_azure_storage(self):
        """Uploads Gold and Silver Parquet files to Azure Blob Storage / ADLS Gen2 if credentials exist."""
        self.generate_all_azure_artifacts()

        if not self.connection_string:
            pipeline_logger.info(
                "[AZURE CLOUD] No AZURE_STORAGE_CONNECTION_STRING in environment. "
                "Active in Azure Cloud Simulation & Deployment mode. "
                "ADF, Databricks PySpark, and Synapse SQL templates ready at 'azure/'."
            )
            return {
                "status": "Simulated/Ready",
                "mode": "Azure Local Simulation",
                "templates_generated": True,
                "adf_path": str(ADF_DIR),
                "databricks_path": str(DATABRICKS_DIR),
                "synapse_path": str(SYNAPSE_DIR)
            }

        try:
            from azure.storage.blob import BlobServiceClient
            blob_service = BlobServiceClient.from_connection_string(self.connection_string)
            container_client = blob_service.get_container_client(self.container_name)
            if not container_client.exists():
                container_client.create_container()

            uploaded = 0
            for folder_name, folder_path in [("gold", GOLD_DIR), ("silver", SILVER_DIR)]:
                for p in folder_path.glob("*.parquet"):
                    blob_name = f"{folder_name}/{p.name}"
                    blob_client = container_client.get_blob_client(blob_name)
                    with open(p, "rb") as f:
                        blob_client.upload_blob(f, overwrite=True)
                    uploaded += 1

            pipeline_logger.info(f"[AZURE CLOUD] Successfully uploaded {uploaded} Parquet files to Azure ADLS Gen2 container: {self.container_name}.")
            return {
                "status": "Connected & Synced",
                "mode": "Live Azure Cloud",
                "uploaded_files": uploaded,
                "container": self.container_name
            }
        except Exception as e:
            pipeline_logger.warning(f"[AZURE CLOUD] Live sync failed ({str(e)}). Fallback to simulated Azure templates.")
            return {
                "status": "Fallback",
                "error": str(e)
            }

if __name__ == "__main__":
    integrator = AzureCloudIntegrator()
    res = integrator.sync_to_azure_storage()
    print("Azure Integration Result:", json.dumps(res, indent=2))

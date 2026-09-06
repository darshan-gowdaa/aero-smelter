# Databricks notebook source
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

silver_passengers = raw_passengers.withColumn("aadhaar_hash", hash_udf(F.col("aadhaar_id"))) \
    .withColumn("aadhaar_masked", F.concat(F.lit("XXXX-XXXX-"), F.substring(F.col("aadhaar_id"), -4, 4))) \
    .drop("aadhaar_id")

silver_passengers.write.format("delta").mode("overwrite").save(f"{CONTAINER_ROOT}silver/passengers_silver")

# COMMAND ----------
# MAGIC %md
# MAGIC ### 4. Gold Star Schema: Facts, Dimensions & Delta Optimization

# COMMAND ----------
silver_flights.write.format("delta").mode("overwrite") \
    .option("optimizeWrite", "true") \
    .saveAsTable("asg_gold.fact_flights")

spark.sql("OPTIMIZE asg_gold.fact_flights ZORDER BY (flight_id, route_key)")
print("✓ Databricks PySpark Medallion Delta Lake Pipeline Executed Successfully.")

import pandas as pd
from pathlib import Path

from pipeline.config import POWERBI_DIR
from pipeline.logger import PipelineLogger

class PowerBIExporter:
    # Exports gold layer star schema to Parquet and CSV for Power BI ingestion
    def __init__(self, output_dir: Path = POWERBI_DIR, logger: PipelineLogger = None):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logger or PipelineLogger()

    def export_tables(self, gold_tables: dict[str, pd.DataFrame]):
        self.logger.info("Exporting Gold layer tables for Power BI ingestion...")

        for table_name, df in gold_tables.items():
            # Export to Parquet (best for performance in modern Power BI)
            parquet_path = self.output_dir / f"{table_name}.parquet"
            df.to_parquet(parquet_path, index=False)

            # Export to CSV (for standard Power BI text/CSV connector)
            csv_path = self.output_dir / f"{table_name}.csv"
            df.to_csv(csv_path, index=False)

            self.logger.info(f"Exported {table_name}: Parquet & CSV ({len(df)} rows).")

        # Generate DAX measures reference file
        dax_path = self.output_dir / "powerbi_dax_measures.dax"
        dax_content = """// ==========================================
// ASG AIRLINES POWER BI DAX MEASURES
// ==========================================

// PAGE 1: DURATION ANALYSIS
Total Flights = COUNTROWS('fact_flights')

Average Flight Duration = AVERAGE('fact_flights'[duration_minutes])

Min Flight Duration = MIN('fact_flights'[duration_minutes])

Max Flight Duration = MAX('fact_flights'[duration_minutes])

Overnight Flight Count = CALCULATE(COUNTROWS('fact_flights'), 'fact_flights'[is_overnight] = TRUE())

Overnight Flight % = DIVIDE([Overnight Flight Count], [Total Flights], 0)

// PAGE 2: ROUTE PERFORMANCE
Total Active Routes = DISTINCTCOUNT('dim_route'[route_key])

Total Bookings = COUNTROWS('fact_bookings')

Confirmed Bookings = CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_confirmed] = 1)

Cancelled Bookings = CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_cancelled] = 1)

Cancellation Rate % = DIVIDE([Cancelled Bookings], [Total Bookings], 0)

Total Operational Revenue = SUM('fact_payments'[amount])

Average Fare Per Booking = AVERAGE('fact_payments'[amount])

// PAGE 3: AIRLINE TRENDS
Flight Share % = 
DIVIDE(
    [Total Flights],
    CALCULATE([Total Flights], ALL('dim_airline'))
)

Airline Revenue = SUM('fact_payments'[amount])

Airline Revenue Share % = 
DIVIDE(
    [Airline Revenue],
    CALCULATE([Airline Revenue], ALL('dim_airline'))
)

// PAGE 4: DELAY & ANOMALY INSIGHTS
Duration Outlier Count = CALCULATE(COUNTROWS('fact_flights'), 'fact_flights'[is_duration_outlier] = TRUE())

Duration Outlier % = DIVIDE([Duration Outlier Count], [Total Flights], 0)

Duration Anomaly Count = CALCULATE(COUNTROWS('fact_flights'), 'fact_flights'[duration_anomaly_flag] = TRUE())

Imputed Status Count = CALCULATE(COUNTROWS('fact_bookings'), 'fact_bookings'[is_status_imputed] = TRUE())

Imputed Payment Amount Count = CALCULATE(COUNTROWS('fact_payments'), 'fact_payments'[is_amount_imputed] = TRUE())
"""
        with open(dax_path, "w", encoding="utf-8") as f:
            f.write(dax_content)

        self.logger.info(f"Generated DAX measures definition file: {dax_path}")

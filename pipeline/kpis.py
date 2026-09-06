import pandas as pd
from pathlib import Path

from pipeline.config import GOLD_DIR
from pipeline.logger import PipelineLogger

class KPICalculator:
    # Computes business metrics, anomaly stats, and aggregations for reporting
    def __init__(self, gold_dir: Path = GOLD_DIR, logger: PipelineLogger = None):
        self.gold_dir = gold_dir
        self.logger = logger or PipelineLogger()

    def compute_all_kpis(self, gold_tables: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
        self.logger.info("Computing business KPIs and aggregations...")

        fact_flights = gold_tables["fact_flights"]
        dim_airline = gold_tables["dim_airline"]
        dim_route = gold_tables["dim_route"]
        fact_bookings = gold_tables["fact_bookings"]
        fact_payments = gold_tables["fact_payments"]
        dim_passenger = gold_tables["dim_passenger"]

        # Join facts with dimensions for readable reporting
        flights_enriched = fact_flights.merge(dim_airline, on="airline_key", how="left")
        flights_enriched = flights_enriched.merge(dim_route, on="route_key", how="left")

        # 1. Average flight duration overall, by route, and by airline
        overall_avg_duration = flights_enriched["duration_minutes"].mean()
        self.logger.info(f"Overall Average Flight Duration: {overall_avg_duration:.2f} minutes.")

        avg_dur_airline = flights_enriched.groupby(["airline_name", "airline_code"])["duration_minutes"].agg(
            flight_count="count",
            avg_duration_min="mean",
            min_duration_min="min",
            max_duration_min="max"
        ).round(2).reset_index()

        avg_dur_route = flights_enriched.groupby(["route_name", "route_full_name"])["duration_minutes"].agg(
            flight_count="count",
            avg_duration_min="mean",
            min_duration_min="min",
            max_duration_min="max"
        ).round(2).reset_index().sort_values(by="flight_count", ascending=False)

        # 2. Route-wise traffic (flight count per source-destination pair)
        route_traffic = flights_enriched.groupby(["source", "destination", "route_name"])["flight_instance_id"].agg(
            total_flights="count"
        ).reset_index().sort_values(by="total_flights", ascending=False)
        route_traffic["traffic_share_pct"] = (route_traffic["total_flights"] / len(flights_enriched) * 100).round(2)

        # 3. Flight distribution by airline percentage
        airline_dist = flights_enriched.groupby(["airline_name", "airline_code"])["flight_instance_id"].agg(
            total_flights="count"
        ).reset_index()
        airline_dist["share_pct"] = (airline_dist["total_flights"] / len(flights_enriched) * 100).round(2)
        airline_dist.sort_values(by="total_flights", ascending=False, inplace=True)

        # 4. Delay and anomaly summary
        total_flights = len(flights_enriched)
        outlier_count = flights_enriched["is_duration_outlier"].sum()
        negative_duration_count = (flights_enriched["duration_minutes"] <= 0).sum()
        overnight_count = flights_enriched["is_overnight"].sum()

        anomaly_summary = pd.DataFrame([{
            "total_flights_analyzed": total_flights,
            "overnight_flights_repaired": overnight_count,
            "duration_outliers_count": outlier_count,
            "duration_outliers_pct": round(outlier_count / total_flights * 100, 2),
            "negative_duration_count": negative_duration_count,
            "anomalous_duration_count": flights_enriched["duration_anomaly_flag"].sum()
        }])

        # Outlier flights detail list
        outlier_flights = flights_enriched[flights_enriched["is_duration_outlier"]][[
            "flight_id", "airline_name", "route_name", "departure_time",
            "arrival_time", "duration_minutes", "route_mean_duration", "route_std_duration"
        ]].copy()

        # 5. Cancellation rate by route
        bookings_enriched = fact_bookings.merge(dim_route, on="route_key", how="left")
        route_cancellations = bookings_enriched.groupby(["route_name", "route_full_name"]).agg(
            total_bookings=("booking_id", "count"),
            confirmed_bookings=("is_confirmed", "sum"),
            cancelled_bookings=("is_cancelled", "sum"),
            pending_bookings=("is_pending", "sum")
        ).reset_index()
        route_cancellations["cancellation_rate_pct"] = (
            route_cancellations["cancelled_bookings"] / route_cancellations["total_bookings"] * 100
        ).round(2)
        route_cancellations.sort_values(by="total_bookings", ascending=False, inplace=True)

        # 6. Revenue and average fare per route
        payments_enriched = fact_payments.merge(dim_route, on="route_key", how="left")
        route_revenue = payments_enriched.groupby(["route_name", "route_full_name"]).agg(
            total_transactions=("payment_id", "count"),
            total_revenue=("amount", "sum"),
            avg_fare=("amount", "mean")
        ).round(2).reset_index().sort_values(by="total_revenue", ascending=False)

        # 7. Average fare and transaction volume by payment method
        fare_by_payment = fact_payments.groupby("payment_method").agg(
            transaction_count=("payment_id", "count"),
            total_amount=("amount", "sum"),
            avg_amount=("amount", "mean"),
            imputed_transactions=("is_amount_imputed", "sum")
        ).round(2).reset_index().sort_values(by="total_amount", ascending=False)

        # 8. Flight departure distribution by hour
        hourly_traffic = flights_enriched.groupby("departure_hour")["flight_instance_id"].agg(
            flights_count="count"
        ).reset_index().sort_values(by="departure_hour")

        # 9. Passenger age band distribution across routes
        bp = fact_bookings.merge(dim_passenger, on="passenger_key", how="left").merge(dim_route, on="route_key", how="left")
        age_band_route = bp.groupby(["route_name", "age_band"])["booking_id"].agg(
            passenger_count="count"
        ).reset_index()

        kpi_results = {
            "kpi_overall_summary": anomaly_summary,
            "kpi_airline_duration": avg_dur_airline,
            "kpi_route_duration": avg_dur_route,
            "kpi_route_traffic": route_traffic,
            "kpi_airline_distribution": airline_dist,
            "kpi_duration_outliers": outlier_flights,
            "kpi_route_cancellations": route_cancellations,
            "kpi_route_revenue": route_revenue,
            "kpi_fare_by_payment_method": fare_by_payment,
            "kpi_hourly_traffic": hourly_traffic,
            "kpi_age_band_by_route": age_band_route
        }

        # Save KPI tables as Parquet in Gold layer
        for name, df in kpi_results.items():
            path = self.gold_dir / f"{name}.parquet"
            df.to_parquet(path, index=False)

        self.logger.info("All business KPIs computed and exported successfully.")
        return kpi_results

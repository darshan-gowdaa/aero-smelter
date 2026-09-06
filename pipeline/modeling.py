import pandas as pd
from pathlib import Path

from pipeline.config import GOLD_DIR, AIRPORT_CITIES, ANOMALY_STD_DEV_THRESHOLD
from pipeline.logger import PipelineLogger

class ModelingLayer:
    # Builds dimensional star schema model from silver tables
    def __init__(self, gold_dir: Path = GOLD_DIR, logger: PipelineLogger = None):
        self.gold_dir = gold_dir
        self.gold_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logger or PipelineLogger()

    def build_star_schema(
        self,
        flights_silver: pd.DataFrame,
        passengers_silver: pd.DataFrame,
        bookings_silver: pd.DataFrame,
        payments_silver: pd.DataFrame
    ) -> dict[str, pd.DataFrame]:
        self.logger.info("Building dimensional star schema in gold layer...")

        # 1. Dimension: dim_airline
        airlines = sorted(flights_silver["airline"].unique())
        dim_airline = pd.DataFrame({
            "airline_key": range(1, len(airlines) + 1),
            "airline_name": airlines
        })
        # Map back airline prefix
        prefix_lookup = {"Air India": "AI", "IndiGo": "6E", "SpiceJet": "SJ", "Vistara": "UK"}
        dim_airline["airline_code"] = dim_airline["airline_name"].map(prefix_lookup).fillna("XX")
        dim_airline["country"] = "India"
        airline_map = dict(zip(dim_airline["airline_name"], dim_airline["airline_key"]))

        # 2. Dimension: dim_route
        routes = flights_silver[["source", "destination"]].drop_duplicates().reset_index(drop=True)
        routes["route_key"] = range(1, len(routes) + 1)
        routes["source_city"] = routes["source"].map(AIRPORT_CITIES).fillna(routes["source"])
        routes["dest_city"] = routes["destination"].map(AIRPORT_CITIES).fillna(routes["destination"])
        routes["route_name"] = routes["source"] + " -> " + routes["destination"]
        routes["route_full_name"] = routes["source_city"] + " to " + routes["dest_city"]
        dim_route = routes[["route_key", "source", "source_city", "destination", "dest_city", "route_name", "route_full_name"]]
        
        # Route mapping dictionary
        route_map = {}
        for _, r in dim_route.iterrows():
            route_map[(r["source"], r["destination"])] = r["route_key"]

        # 3. Dimension: dim_date
        # Gather all dates across flights and bookings
        flight_dates = pd.to_datetime(flights_silver["departure_time"]).dt.date
        booking_dates = pd.to_datetime(bookings_silver["booking_date"]).dt.date
        all_dates = sorted(pd.Series(list(flight_dates) + list(booking_dates)).dropna().unique())
        
        date_records = []
        for d in all_dates:
            dt = pd.Timestamp(d)
            date_records.append({
                "date_key": int(dt.strftime("%Y%m%d")),
                "full_date": dt.date(),
                "year": dt.year,
                "month": dt.month,
                "month_name": dt.strftime("%B"),
                "day": dt.day,
                "day_name": dt.strftime("%A"),
                "is_weekend": dt.dayofweek >= 5
            })
        dim_date = pd.DataFrame(date_records)

        # 4. Dimension: dim_passenger
        passengers_silver["passenger_key"] = range(1, len(passengers_silver) + 1)
        dim_passenger = passengers_silver[[
            "passenger_key", "passenger_id", "gender", "age", "age_band",
            "email_masked", "phone_masked", "aadhaar_masked", "passenger_name_masked"
        ]].copy()
        passenger_map = dict(zip(dim_passenger["passenger_id"], dim_passenger["passenger_key"]))

        # 5. Fact: fact_flights
        fact_f = flights_silver.copy()
        fact_f["flight_instance_id"] = range(1, len(fact_f) + 1)
        fact_f["airline_key"] = fact_f["airline"].map(airline_map)
        fact_f["route_key"] = fact_f.apply(lambda r: route_map.get((r["source"], r["destination"])), axis=1)
        fact_f["departure_date_key"] = pd.to_datetime(fact_f["departure_time"]).dt.strftime("%Y%m%d").astype(int)
        fact_f["departure_hour"] = pd.to_datetime(fact_f["departure_time"]).dt.hour

        # Calculate route-wise duration statistics to identify statistical outliers (> 2 standard deviations)
        route_stats = fact_f.groupby("route_key")["duration_minutes"].agg(["mean", "std"]).reset_index()
        route_stats.rename(columns={"mean": "route_mean_duration", "std": "route_std_duration"}, inplace=True)
        # Handle zero standard deviation if only 1 flight exists
        route_stats["route_std_duration"] = route_stats["route_std_duration"].fillna(0)
        fact_f = fact_f.merge(route_stats, on="route_key", how="left")

        # Outlier flag if duration is outside mean +/- 2 standard deviations
        fact_f["is_duration_outlier"] = (
            (fact_f["duration_minutes"] > fact_f["route_mean_duration"] + ANOMALY_STD_DEV_THRESHOLD * fact_f["route_std_duration"]) |
            (fact_f["duration_minutes"] < fact_f["route_mean_duration"] - ANOMALY_STD_DEV_THRESHOLD * fact_f["route_std_duration"])
        ) & (fact_f["route_std_duration"] > 0)

        fact_flights = fact_f[[
            "flight_instance_id", "flight_id", "airline_key", "route_key",
            "departure_date_key", "departure_time", "arrival_time", "departure_hour",
            "duration_minutes", "route_mean_duration", "route_std_duration",
            "is_overnight", "duration_anomaly_flag", "is_duration_outlier"
        ]].copy()

        # 6. Fact: fact_bookings
        fact_b = bookings_silver.copy()
        fact_b["passenger_key"] = fact_b["passenger_id"].map(passenger_map)
        fact_b["booking_date_key"] = pd.to_datetime(fact_b["booking_date"]).dt.strftime("%Y%m%d").astype(int)
        fact_b["is_confirmed"] = (fact_b["status"] == "CONFIRMED").astype(int)
        fact_b["is_cancelled"] = (fact_b["status"] == "CANCELLED").astype(int)
        fact_b["is_pending"] = (fact_b["status"] == "PENDING").astype(int)
        
        # Merge route_key from flights for route analytics
        flight_to_route = dict(zip(fact_flights["flight_id"], fact_flights["route_key"]))
        flight_to_airline = dict(zip(fact_flights["flight_id"], fact_flights["airline_key"]))
        fact_b["route_key"] = fact_b["flight_id"].map(flight_to_route)
        fact_b["airline_key"] = fact_b["flight_id"].map(flight_to_airline)

        fact_bookings = fact_b[[
            "booking_id", "passenger_key", "flight_id", "route_key", "airline_key",
            "booking_date_key", "booking_date", "status", "is_confirmed",
            "is_cancelled", "is_pending", "is_status_imputed", "seat_number",
            "passport_masked"
        ]].copy()

        # 7. Fact: fact_payments
        fact_p = payments_silver.copy()
        # Merge booking info
        booking_to_route = dict(zip(fact_bookings["booking_id"], fact_bookings["route_key"]))
        booking_to_airline = dict(zip(fact_bookings["booking_id"], fact_bookings["airline_key"]))
        fact_p["route_key"] = fact_p["booking_id"].map(booking_to_route)
        fact_p["airline_key"] = fact_p["booking_id"].map(booking_to_airline)

        fact_payments = fact_p[[
            "payment_id", "booking_id", "route_key", "airline_key",
            "payment_method", "amount", "is_amount_imputed"
        ]].copy()

        # Save all Gold layer tables to disk as Parquet
        tables = {
            "dim_airline": dim_airline,
            "dim_route": dim_route,
            "dim_date": dim_date,
            "dim_passenger": dim_passenger,
            "fact_flights": fact_flights,
            "fact_bookings": fact_bookings,
            "fact_payments": fact_payments
        }

        for table_name, table_df in tables.items():
            path = self.gold_dir / f"{table_name}.parquet"
            table_df.to_parquet(path, index=False)
            self.logger.info(f"Gold table saved: {table_name} ({len(table_df)} rows) -> {path}")

        return tables

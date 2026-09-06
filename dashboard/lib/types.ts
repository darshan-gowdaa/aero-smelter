// TypeScript interfaces for ASG Airlines Flight Operations & MLOps Analytics

export interface DimAirline {
  airline_key: number;
  airline_name: string;
  airline_code: string;
  country: string;
}

export interface DimRoute {
  route_key: number;
  source: string;
  source_city: string;
  destination: string;
  dest_city: string;
  route_name: string;
  route_full_name: string;
}

export interface KpiOverallSummary {
  total_flights_analyzed: number;
  overnight_flights_repaired: number;
  duration_outliers_count: number;
  duration_outliers_pct: number;
  negative_duration_count: number;
  anomalous_duration_count: number;
}

export interface KpiAirlineDistribution {
  airline_name: string;
  airline_code: string;
  total_flights: number;
  share_pct: number;
}

export interface KpiAirlineDuration {
  airline_name: string;
  airline_code: string;
  flight_count: number;
  avg_duration_min: number;
  min_duration_min: number;
  max_duration_min: number;
}

export interface KpiRouteDuration {
  route_name: string;
  route_full_name: string;
  flight_count: number;
  avg_duration_min: number;
  min_duration_min: number;
  max_duration_min: number;
}

export interface KpiRouteTraffic {
  source: string;
  destination: string;
  route_name: string;
  total_flights: number;
  traffic_share_pct: number;
}

export interface KpiRouteRevenue {
  route_name: string;
  route_full_name: string;
  total_transactions: number;
  total_revenue: number;
  avg_fare: number;
}

export interface KpiRouteCancellations {
  route_name: string;
  route_full_name: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  cancellation_rate_pct: number;
}

export interface KpiFareByPaymentMethod {
  payment_method: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  imputed_transactions: number;
}

export interface KpiHourlyTraffic {
  departure_hour: number;
  flights_count: number;
}

export interface KpiAgeBandByRoute {
  route_name: string;
  age_band: string;
  passenger_count: number;
}

export interface KpiDurationOutlier {
  flight_id: string;
  airline_name: string;
  route_name: string;
  departure_time: string | null;
  arrival_time: string | null;
  duration_minutes: number;
  route_mean_duration: number;
  route_std_duration: number;
}

export interface FactFlightItem {
  flight_instance_id: number;
  flight_id: string;
  airline_key: number;
  route_key: number;
  departure_date_key: number;
  departure_time: string;
  arrival_time: string;
  departure_hour: number;
  duration_minutes: number;
  route_mean_duration: number;
  route_std_duration: number;
  is_overnight: number;
  duration_anomaly_flag: number;
  is_duration_outlier: number;
}

export interface FactBookingItem {
  booking_id: string;
  passenger_key: number;
  flight_id: string;
  route_key: number;
  airline_key: number;
  booking_date_key: number;
  booking_date: string;
  status: string;
  is_confirmed: number;
  is_cancelled: number;
  is_pending: number;
  is_status_imputed: number;
  seat_number: string;
  passport_masked: string;
}

export interface FactPaymentItem {
  payment_id: string;
  booking_id: string;
  route_key: number;
  airline_key: number;
  payment_method: string;
  amount: number;
  is_amount_imputed: number;
}

export interface MlAnomalyScore {
  flight_id: string;
  airline_code: string;
  airline_name: string;
  route_name: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  route_mean_duration: number;
  ml_is_anomaly: number;
  ml_anomaly_score: number;
}

export interface MlCancellationPrediction {
  booking_id: string;
  flight_id: string;
  airline_code: string;
  route_name: string;
  payment_method: string;
  amount_clean: number;
  is_cancelled: number;
  cancellation_risk_score: number;
  risk_tier: string;
}

export interface MlFeatureImportance {
  feature: string;
  importance: number;
  percentage: number;
}

export interface MlModelMetric {
  model: string;
  task: string;
  primary_metric: string;
  score: number;
  status: string;
}

export interface AsgDataset {
  kpi_overall_summary: KpiOverallSummary[];
  kpi_airline_distribution: KpiAirlineDistribution[];
  kpi_airline_duration: KpiAirlineDuration[];
  kpi_route_duration: KpiRouteDuration[];
  kpi_route_traffic: KpiRouteTraffic[];
  kpi_route_revenue: KpiRouteRevenue[];
  kpi_route_cancellations: KpiRouteCancellations[];
  kpi_fare_by_payment_method: KpiFareByPaymentMethod[];
  kpi_hourly_traffic: KpiHourlyTraffic[];
  kpi_age_band_by_route: KpiAgeBandByRoute[];
  kpi_duration_outliers: KpiDurationOutlier[];
  dim_airline: DimAirline[];
  dim_route: DimRoute[];
  fact_flights: FactFlightItem[];
  fact_bookings: FactBookingItem[];
  fact_payments: FactPaymentItem[];
  ml_anomaly_scores: MlAnomalyScore[];
  ml_cancellation_predictions: MlCancellationPrediction[];
  ml_feature_importances: MlFeatureImportance[];
  ml_model_metrics: MlModelMetric[];
}

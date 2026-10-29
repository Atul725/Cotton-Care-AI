export interface HealthStatus {
  status: string;
  project: string;
  version: string;
  database_connected: boolean;
  ai_configured: boolean;
  model_loaded: boolean;
  timestamp: string;
}

export interface FarmerProfile {
  id?: number;
  identifier: string;
  name: string;
  location: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  contact_number?: string;
  land_acres: number;
}

export interface DatasetSummary {
  id: number;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  columns: string[];
  null_count: number;
  duplicate_count: number;
  created_at: string;
}

export interface DatasetUploadResult {
  message: string;
  dataset: DatasetSummary;
  preview: Record<string, any>[];
  summary_stats: Record<string, any>;
}

export interface AnalyticsSummary {
  total_records: number;
  key_factors: {
    factor: string;
    impact: string;
    importance_pct: number;
    recommendation: string;
  }[];
  correlations: Record<string, number>;
  distributions: {
    yield_bins: { range: string; count: number }[];
    temperature_vs_yield: { temp: number; avg_yield: number }[];
  };
  summary_text: string;
}

export interface YieldPredictionInput {
  user_identifier: string;
  acres: number;
  growth_cycle: number;
  sunlight_hours: number;
  precipitation: number;
  temperature: number;
  soil_moisture: number;
  soil_ph: number;
  co2_concentration: number;
  drought_days: number;
  flood_days: number;
  soil_type?: string;
  water_source?: string;
}

export interface YieldPredictionResult {
  predicted_yield_per_acre_kg: number;
  total_predicted_yield_quintals: number;
  model_name: string;
  evaluation_metrics: {
    r2_score?: number;
    mae?: number;
    rmse?: number;
  };
  confidence_level: string;
  top_influencing_factors: { feature: string; importance: number }[];
  agronomic_advisory: string;
  input_parameters: Record<string, any>;
  disclaimer: string;
}

export interface ModelInfo {
  model_name: string;
  target_variable: string;
  trained_on_rows: number;
  features: string[];
  metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
  feature_importances: { feature: string; importance: number }[];
  training_date: string;
}

export interface DiseaseDetectionResult {
  condition_detected: string;
  confidence_score: number;
  severity_level: string;
  diagnostic_report: string;
  immediate_actions: string[];
  preventive_measures: string[];
  detection_engine: string;
  disclaimer: string;
  is_valid_cotton_leaf?: boolean;
  validation_message?: string;
}

export interface AssistantResponse {
  answer: string;
  language: string;
  provider: string;
  suggested_followups: string[];
  error?: string | null;
}

export interface RecommendationResult {
  growth_stage: string;
  stage_description: string;
  fertilizer_schedule: {
    urea_kg: number;
    dap_kg: number;
    potash_mop_kg: number;
    micronutrients: string;
    application_method: string;
  };
  irrigation_schedule: {
    frequency: string;
    volume_level: string;
    soil_adaptation: string;
    method: string;
  };
  pest_disease_watch: { pest: string; action: string }[];
  expert_precautions: string[];
}

export interface HistoryData {
  yield_predictions: {
    id: number;
    acres: number;
    growth_cycle: number;
    temperature: number;
    precipitation: number;
    predicted_yield_per_acre: number;
    total_predicted_yield_quintals: number;
    model_name: string;
    created_at: string;
  }[];
  disease_scans: {
    id: number;
    condition_detected: string;
    severity_level: string;
    confidence_score: number;
    diagnostic_report: string;
    image_data_url?: string;
    detection_engine: string;
    created_at: string;
  }[];
}

export interface WeatherDaily {
  date: string;
  weathercode: number;
  condition: string;
  temp_max?: number;
  temp_min?: number;
  precipitation_sum_mm: number;
  precipitation_probability_max: number;
  wind_max_kmh: number;
}

export interface WeatherHourly {
  time: string;
  temperature?: number;
  humidity?: number;
  precip_prob: number;
  precipitation_mm: number;
  wind_kmh: number;
  weathercode: number;
}

export interface WeatherAlert {
  id: number;
  user_identifier: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'danger';
  title_en: string;
  message_en: string;
  title_mr?: string;
  message_mr?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  forecast_value?: number;
  forecast_unit?: string;
  expected_time?: string;
  is_read: boolean;
  notification_sent: boolean;
  created_at: string;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  location_name: string;
  timezone: string;
  fetched_at: string;
  current: {
    temperature?: number;
    apparent_temperature?: number;
    humidity?: number;
    precipitation?: number;
    windspeed?: number;
    weathercode?: number;
    condition?: string;
  };
  daily_forecast: WeatherDaily[];
  hourly_next24: WeatherHourly[];
  active_alerts: WeatherAlert[];
  advisory_summary: string;
  disclaimer: string;
}

export interface NotificationPrefs {
  user_identifier: string;
  rain_alerts: boolean;
  heavy_rain_alerts: boolean;
  wind_alerts: boolean;
  heat_alerts: boolean;
  dry_spell_alerts: boolean;
  humidity_alerts: boolean;
  preferred_language: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  push_enabled: boolean;
}

export interface LocationOption {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

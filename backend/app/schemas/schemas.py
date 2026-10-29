from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Health Schema ---
class HealthResponse(BaseModel):
    status: str = "healthy"
    project: str = "CottonCare AI"
    version: str = "2.0.0"
    database_connected: bool = True
    ai_configured: bool = False
    model_loaded: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Farmer Profile Schemas ---
class FarmerProfileBase(BaseModel):
    name: str = "शेतकरी मित्र"
    location: str = "छत्रपती संभाजीनगर"
    location_name: Optional[str] = "छत्रपती संभाजीनगर (Chh. Sambhajinagar)"
    latitude: Optional[float] = 19.8762
    longitude: Optional[float] = 75.3433
    contact_number: Optional[str] = None
    land_acres: float = Field(default=2.0, ge=0.1, le=500.0)

class FarmerProfileUpdate(FarmerProfileBase):
    pass

class FarmerProfileResponse(FarmerProfileBase):
    id: int
    identifier: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Dataset & Analytics Schemas ---
class DatasetSummarySchema(BaseModel):
    id: int
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    columns: list[str]
    null_count: int
    duplicate_count: int
    created_at: datetime

class DatasetUploadResponse(BaseModel):
    message: str
    dataset: DatasetSummarySchema
    preview: list[dict[str, Any]]
    summary_stats: dict[str, Any]

class AnalyticsSummaryResponse(BaseModel):
    total_records: int
    key_factors: list[dict[str, Any]]
    correlations: dict[str, float]
    distributions: dict[str, Any]
    summary_text: str

# --- Yield Prediction Schemas ---
class YieldPredictRequest(BaseModel):
    user_identifier: str = "guest_farmer"
    acres: float = Field(default=2.0, ge=0.1, le=100.0, description="Farm area in acres")
    growth_cycle: float = Field(default=120.0, ge=30.0, le=220.0, description="Crop cycle in days")
    sunlight_hours: float = Field(default=7.5, ge=1.0, le=14.0, description="Average sunlight hours per day")
    precipitation: float = Field(default=520.0, ge=50.0, le=1500.0, description="Total season precipitation in mm")
    temperature: float = Field(default=26.0, ge=10.0, le=48.0, description="Average temperature in Celsius")
    soil_moisture: float = Field(default=68.0, ge=10.0, le=100.0, description="Soil moisture percentage")
    soil_ph: float = Field(default=6.5, ge=4.0, le=9.5, description="Soil pH level")
    co2_concentration: float = Field(default=415.0, ge=350.0, le=600.0, description="CO2 concentration ppm")
    drought_days: float = Field(default=25.0, ge=0.0, le=120.0, description="Number of drought days")
    flood_days: float = Field(default=10.0, ge=0.0, le=60.0, description="Number of excess water/flood days")
    soil_type: Optional[str] = "काळी माती (Black Soil)"
    water_source: Optional[str] = "विहीर / बोरवेल (Irrigated)"

class YieldPredictResponse(BaseModel):
    predicted_yield_per_acre_kg: float
    total_predicted_yield_quintals: float
    model_name: str
    evaluation_metrics: dict[str, Optional[float]]
    confidence_level: str
    top_influencing_factors: list[dict[str, Any]]
    agronomic_advisory: str
    input_parameters: dict[str, Any]
    disclaimer: str

class ModelInfoResponse(BaseModel):
    model_name: str
    target_variable: str
    trained_on_rows: int
    features: list[str]
    metrics: dict[str, float]
    feature_importances: list[dict[str, Any]]
    training_date: str

# --- Disease Detection Schemas ---
class DiseasePredictResponse(BaseModel):
    is_valid_cotton_leaf: bool = True
    validation_message: Optional[str] = None
    condition_detected: str
    confidence_score: float
    severity_level: str
    diagnostic_report: str
    immediate_actions: list[str]
    preventive_measures: list[str]
    detection_engine: str
    disclaimer: str

# --- Assistant Chat Schemas ---
class AssistantChatRequest(BaseModel):
    question: str
    language: str = "English"  # "English", "Hindi", "Marathi"
    context: Optional[str] = None

class AssistantChatResponse(BaseModel):
    answer: str
    language: str
    provider: str
    suggested_followups: list[str] = []
    error: Optional[str] = None

# --- Recommendations Schemas ---
class RecommendationsRequest(BaseModel):
    crop_days: int = Field(default=45, ge=1, le=180)
    land_acres: float = Field(default=2.0, ge=0.1, le=100.0)
    soil_type: str = "काळी माती (Black Soil)"
    water_source: str = "विहीर / बोरवेल (Irrigated)"
    recent_weather: Optional[dict[str, Any]] = None

class RecommendationsResponse(BaseModel):
    growth_stage: str
    stage_description: str
    fertilizer_schedule: dict[str, Any]
    irrigation_schedule: dict[str, Any]
    pest_disease_watch: list[dict[str, Any]]
    expert_precautions: list[str]

# --- Weather & Alert Schemas ---
class WeatherCurrentSchema(BaseModel):
    temperature: Optional[float] = None
    apparent_temperature: Optional[float] = None
    humidity: Optional[float] = None
    precipitation: Optional[float] = 0.0
    windspeed: Optional[float] = 0.0
    weathercode: Optional[int] = 0
    condition: Optional[str] = "Clear"

class WeatherDailySchema(BaseModel):
    date: str
    weathercode: int
    condition: str
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    precipitation_sum_mm: float = 0.0
    precipitation_probability_max: int = 0
    wind_max_kmh: float = 0.0

class WeatherHourlySchema(BaseModel):
    time: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    precip_prob: int = 0
    precipitation_mm: float = 0.0
    wind_kmh: float = 0.0
    weathercode: int = 0

class WeatherAlertSchema(BaseModel):
    id: int
    user_identifier: str
    alert_type: str
    severity: str
    title_en: str
    message_en: str
    title_mr: Optional[str] = None
    message_mr: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    forecast_value: Optional[float] = None
    forecast_unit: Optional[str] = None
    expected_time: Optional[str] = None
    is_read: bool = False
    notification_sent: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = "Selected Location"
    timezone: str = "Asia/Kolkata"
    fetched_at: str
    current: WeatherCurrentSchema
    daily_forecast: list[WeatherDailySchema]
    hourly_next24: list[WeatherHourlySchema]
    active_alerts: list[WeatherAlertSchema] = []
    advisory_summary: str = ""
    disclaimer: str = "Weather forecasts are probabilistic estimates from Open-Meteo and do not guarantee field conditions."

# --- Notification Schemas ---
class NotificationPrefsSchema(BaseModel):
    user_identifier: str
    rain_alerts: bool = True
    heavy_rain_alerts: bool = True
    wind_alerts: bool = True
    heat_alerts: bool = True
    dry_spell_alerts: bool = True
    humidity_alerts: bool = False
    preferred_language: str = "English"
    quiet_hours_start: int = 22
    quiet_hours_end: int = 6
    push_enabled: bool = True

    model_config = ConfigDict(from_attributes=True)

class NotificationPrefsUpdate(BaseModel):
    rain_alerts: Optional[bool] = None
    heavy_rain_alerts: Optional[bool] = None
    wind_alerts: Optional[bool] = None
    heat_alerts: Optional[bool] = None
    dry_spell_alerts: Optional[bool] = None
    humidity_alerts: Optional[bool] = None
    preferred_language: Optional[str] = None
    quiet_hours_start: Optional[int] = None
    quiet_hours_end: Optional[int] = None
    push_enabled: Optional[bool] = None

class DeviceTokenRegisterRequest(BaseModel):
    user_identifier: str = "demo_farmer"
    expo_push_token: str
    device_id: Optional[str] = None
    platform: str = "android"

class DeviceTokenUnregisterRequest(BaseModel):
    expo_push_token: str

class TestPushRequest(BaseModel):
    user_identifier: str = "demo_farmer"
    title: str = "CottonCare AI Test Alert"
    body: str = "This is a test notification from your CottonCare smart farming backend."

class LocationOptionSchema(BaseModel):
    name: str
    state: str
    latitude: float
    longitude: float

# --- Authentication Schemas ---
class AuthRegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: Optional[str] = "शेतकरी मित्र"
    location: Optional[str] = "छत्रपती संभाजीनगर"
    land_acres: Optional[float] = 2.0
    contact_number: Optional[str] = None

class AuthLoginRequest(BaseModel):
    username_or_email: str
    password: str

class AuthGoogleRequest(BaseModel):
    id_token: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]
    message: str

class CurrentUserResponse(BaseModel):
    id: int
    identifier: str
    email: Optional[str] = None
    name: str
    location: str
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    contact_number: Optional[str] = None
    land_acres: float
    auth_provider: str


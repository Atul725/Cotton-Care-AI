"""
Weather-related SQLAlchemy ORM models.
- WeatherAlert: persisted alerts for farmers (with dedup + cooldown support)
- DeviceToken: Expo push tokens keyed by farmer identifier + device id
- NotificationPrefs: per-farmer alert preferences
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from backend.app.core.database import Base


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)   # rain, heavy_rain, wind, heat, dry_spell, humidity
    severity = Column(String(20), default="warning")  # info, warning, danger
    title_en = Column(String(200), nullable=False)
    message_en = Column(String(500), nullable=False)
    title_mr = Column(String(300), nullable=True)
    message_mr = Column(String(600), nullable=True)
    location_name = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    forecast_value = Column(Float, nullable=True)      # e.g., 15.2 mm expected rain
    forecast_unit = Column(String(20), nullable=True)  # mm, km/h, °C, %
    expected_time = Column(String(100), nullable=True) # "Next 3 hours", "Tomorrow morning"
    is_read = Column(Boolean, default=False)
    notification_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class DeviceToken(Base):
    __tablename__ = "device_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), index=True, nullable=False)
    expo_push_token = Column(String(200), unique=True, nullable=False)
    device_id = Column(String(100), nullable=True)
    platform = Column(String(20), default="android")   # android, ios
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)


class NotificationPrefs(Base):
    __tablename__ = "notification_prefs"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), unique=True, index=True, nullable=False)
    rain_alerts = Column(Boolean, default=True)
    heavy_rain_alerts = Column(Boolean, default=True)
    wind_alerts = Column(Boolean, default=True)
    heat_alerts = Column(Boolean, default=True)
    dry_spell_alerts = Column(Boolean, default=True)
    humidity_alerts = Column(Boolean, default=False)
    preferred_language = Column(String(20), default="English")  # English, Marathi, Hindi
    quiet_hours_start = Column(Integer, default=22)  # 10 PM
    quiet_hours_end = Column(Integer, default=6)     # 6 AM
    push_enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

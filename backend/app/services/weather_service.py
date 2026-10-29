"""
Weather service: fetches real forecasts from Open-Meteo (free, no API key required)
and generates contextually relevant cotton farming weather alerts.

Open-Meteo docs: https://open-meteo.com/en/docs
Rate limit: 10,000 calls/day, cacheable up to 1 hour.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
from sqlalchemy.orm import Session

from backend.app.models.weather import WeatherAlert, NotificationPrefs
from backend.app.models.farmer import FarmerUser

logger = logging.getLogger("cottoncare_weather")

# Open-Meteo API base — no key needed
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code → human readable description
WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

# Alert thresholds
THRESHOLDS = {
    "rain_prob_pct": 60,          # % precipitation probability in next 6 hours
    "heavy_rain_mm": 15,          # mm in next 24 hours
    "wind_kmh": 25,               # km/h
    "heat_celsius": 38,           # °C
    "dry_spell_days": 10,         # consecutive days with <1 mm
    "high_humidity_pct": 85,      # % relative humidity
    "alert_cooldown_hours": 6,    # minimum hours between same alert type per user
}


async def fetch_weather(latitude: float, longitude: float) -> dict:
    """
    Fetch current conditions + 7-day daily + 168-hour hourly forecasts from Open-Meteo.
    Returns a structured dict. Raises RuntimeError if the API call fails.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,weathercode,apparent_temperature",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,windspeed_10m,weathercode",
        "daily": "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max",
        "timezone": "Asia/Kolkata",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(OPEN_METEO_URL, params=params)
        resp.raise_for_status()
        raw = resp.json()

    current = raw.get("current", {})
    daily = raw.get("daily", {})
    hourly = raw.get("hourly", {})

    # Build structured daily forecast
    daily_forecast = []
    times = daily.get("time", [])
    for i, t in enumerate(times):
        daily_forecast.append({
            "date": t,
            "weathercode": daily.get("weathercode", [])[i] if i < len(daily.get("weathercode", [])) else 0,
            "condition": WMO_CODES.get(daily.get("weathercode", [0])[i] if i < len(daily.get("weathercode", [])) else 0, "Unknown"),
            "temp_max": daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else None,
            "temp_min": daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else None,
            "precipitation_sum_mm": daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else 0.0,
            "precipitation_probability_max": daily.get("precipitation_probability_max", [])[i] if i < len(daily.get("precipitation_probability_max", [])) else 0,
            "wind_max_kmh": daily.get("windspeed_10m_max", [])[i] if i < len(daily.get("windspeed_10m_max", [])) else 0.0,
        })

    # Build next-12-hour hourly slice
    hourly_times = hourly.get("time", [])
    hourly_slice = []
    now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
    started = False
    count = 0
    for i, t in enumerate(hourly_times):
        if t >= now_str:
            started = True
        if started and count < 24:
            hourly_slice.append({
                "time": t,
                "temperature": hourly.get("temperature_2m", [])[i] if i < len(hourly.get("temperature_2m", [])) else None,
                "humidity": hourly.get("relative_humidity_2m", [])[i] if i < len(hourly.get("relative_humidity_2m", [])) else None,
                "precip_prob": hourly.get("precipitation_probability", [])[i] if i < len(hourly.get("precipitation_probability", [])) else 0,
                "precipitation_mm": hourly.get("precipitation", [])[i] if i < len(hourly.get("precipitation", [])) else 0.0,
                "wind_kmh": hourly.get("windspeed_10m", [])[i] if i < len(hourly.get("windspeed_10m", [])) else 0.0,
                "weathercode": hourly.get("weathercode", [])[i] if i < len(hourly.get("weathercode", [])) else 0,
            })
            count += 1

    return {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "Asia/Kolkata",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "current": {
            "temperature": current.get("temperature_2m"),
            "apparent_temperature": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation", 0.0),
            "windspeed": current.get("windspeed_10m"),
            "weathercode": current.get("weathercode", 0),
            "condition": WMO_CODES.get(current.get("weathercode", 0), "Unknown"),
        },
        "daily_forecast": daily_forecast,
        "hourly_next24": hourly_slice,
    }


def _cooldown_ok(db: Session, user_id: str, alert_type: str) -> bool:
    """Returns True if enough time has passed since last same-type alert for this user."""
    cooldown = timedelta(hours=THRESHOLDS["alert_cooldown_hours"])
    cutoff = datetime.utcnow() - cooldown
    recent = db.query(WeatherAlert).filter(
        WeatherAlert.user_identifier == user_id,
        WeatherAlert.alert_type == alert_type,
        WeatherAlert.created_at >= cutoff
    ).first()
    return recent is None


def _prefs_allow(db: Session, user_id: str, alert_type: str) -> bool:
    """Check user notification preferences. Returns True if alert type is enabled."""
    prefs = db.query(NotificationPrefs).filter_by(user_identifier=user_id).first()
    if not prefs:
        return True  # Default: all alerts enabled
    mapping = {
        "rain": prefs.rain_alerts,
        "heavy_rain": prefs.heavy_rain_alerts,
        "wind": prefs.wind_alerts,
        "heat": prefs.heat_alerts,
        "dry_spell": prefs.dry_spell_alerts,
        "humidity": prefs.humidity_alerts,
    }
    return mapping.get(alert_type, True)


def generate_alerts_from_forecast(
    weather_data: dict,
    user_id: str,
    location_name: str,
    db: Session
) -> list[WeatherAlert]:
    """
    Analyse forecast data and create WeatherAlert records for significant events.
    Skips alerts if they are in cooldown or user has disabled that type.
    Returns list of newly created alert records.
    """
    alerts_created = []
    lat = weather_data.get("latitude")
    lon = weather_data.get("longitude")
    hourly = weather_data.get("hourly_next24", [])
    daily = weather_data.get("daily_forecast", [])
    current = weather_data.get("current", {})

    def save_alert(alert_type, severity, title_en, msg_en, title_mr, msg_mr, value, unit, expected_time):
        if not _prefs_allow(db, user_id, alert_type):
            return
        if not _cooldown_ok(db, user_id, alert_type):
            return
        alert = WeatherAlert(
            user_identifier=user_id,
            alert_type=alert_type,
            severity=severity,
            title_en=title_en,
            message_en=msg_en,
            title_mr=title_mr,
            message_mr=msg_mr,
            location_name=location_name,
            latitude=lat,
            longitude=lon,
            forecast_value=value,
            forecast_unit=unit,
            expected_time=expected_time,
            expires_at=datetime.utcnow() + timedelta(hours=12),
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alerts_created.append(alert)
        logger.info("Alert created: [%s] %s for %s", alert_type, title_en, user_id)

    # --- 1. Rain imminent (next 6 hours) ---
    rain_soon = [h for h in hourly[:6] if h.get("precip_prob", 0) >= THRESHOLDS["rain_prob_pct"]]
    if rain_soon:
        max_prob = max(h["precip_prob"] for h in rain_soon)
        save_alert(
            "rain", "warning",
            f"Rain likely in next {len(rain_soon)} hour(s) — {max_prob}% probability",
            f"Rain is forecast in your area in the next {len(rain_soon)} hour(s) with {max_prob}% probability. "
            "Consider postponing pesticide or fertilizer spraying. Ensure field drainage is clear.",
            f"पुढील {len(rain_soon)} तासांत पाऊस शक्य ({max_prob}% शक्यता)",
            f"तुमच्या शेताच्या परिसरात {len(rain_soon)} तासांत पाऊस पडण्याची {max_prob}% शक्यता आहे. "
            "फवारणी पुढे ढकलावी व पाण्याचा निचरा तपासा.",
            float(max_prob), "%", f"Next {len(rain_soon)} hour(s)"
        )

    # --- 2. Heavy rain (24 hours total) ---
    total_24h_rain = sum(h.get("precipitation_mm", 0.0) for h in hourly[:24])
    if total_24h_rain >= THRESHOLDS["heavy_rain_mm"]:
        save_alert(
            "heavy_rain", "danger",
            f"Heavy rain expected — {total_24h_rain:.1f} mm in next 24 hours",
            f"Heavy rainfall of {total_24h_rain:.1f} mm is forecast in the next 24 hours. "
            "Check field drainage channels. Waterlogging can damage cotton boll development. "
            "Avoid harvesting and heavy machinery on waterlogged soil.",
            f"पुढील 24 तासांत जड पाऊस: {total_24h_rain:.1f} मिमी अपेक्षित",
            f"पुढील 24 तासांत {total_24h_rain:.1f} मिमी पाऊस पडण्याची शक्यता. "
            "शेतातील पाण्याचा निचरा तातडीने तपासा. बोंड विकासाला पाणी साचणे हानिकारक आहे.",
            float(round(total_24h_rain, 1)), "mm", "Next 24 hours"
        )

    # --- 3. High wind ---
    wind_now = current.get("windspeed", 0) or 0
    wind_hours = [h for h in hourly[:6] if h.get("wind_kmh", 0) >= THRESHOLDS["wind_kmh"]]
    if wind_now >= THRESHOLDS["wind_kmh"] or len(wind_hours) >= 2:
        speed = max(wind_now, max((h["wind_kmh"] for h in wind_hours), default=0))
        save_alert(
            "wind", "warning",
            f"High wind speed — {speed:.0f} km/h",
            f"Wind speeds of {speed:.0f} km/h are expected. Avoid all pesticide and herbicide spraying "
            "as spray drift can damage cotton and neighbouring crops. Secure any light covers or nets.",
            f"वाऱ्याचा वेग जास्त: {speed:.0f} किमी/तास",
            f"वाऱ्याचा वेग {speed:.0f} किमी/तास आहे. कीटकनाशक फवारणी टाळावी. "
            "फवारणीचे थेंब वाऱ्यासोबत शेजारच्या पिकांवर जाऊ शकतात.",
            float(speed), "km/h", "Current / Next 6 hours"
        )

    # --- 4. Heat stress ---
    temp_now = current.get("temperature", 0) or 0
    if temp_now >= THRESHOLDS["heat_celsius"]:
        save_alert(
            "heat", "danger",
            f"Heat stress alert — {temp_now:.1f}°C",
            f"Temperature has reached {temp_now:.1f}°C. Cotton plants face heat stress above 38°C. "
            "Irrigate during early morning or late evening. Avoid midday field work.",
            f"उष्णतेचा ताण: {temp_now:.1f}°C",
            f"तापमान {temp_now:.1f}°C पर्यंत पोहोचले आहे. कापसावर उष्णतेचा ताण येऊ शकतो. "
            "सकाळी लवकर किंवा संध्याकाळी पाणी द्या. दुपारी शेतात काम टाळा.",
            float(temp_now), "°C", "Current conditions"
        )

    # --- 5. Dry spell (7-day window) ---
    total_7d_rain = sum(d.get("precipitation_sum_mm", 0.0) for d in daily)
    if total_7d_rain < 1.0:
        save_alert(
            "dry_spell", "info",
            "Dry spell expected — less than 1 mm rain in 7-day forecast",
            "No significant rainfall is expected in the next 7 days. Monitor soil moisture closely. "
            "Irrigate cotton based on growth stage requirements to prevent drought stress.",
            "पुढील 7 दिवस कोरडे: पाऊस नाही",
            "पुढील 7 दिवसांत पाऊस नाही. जमिनीतील ओलावा तपासा. "
            "कापसाच्या वाढीच्या टप्प्यानुसार सिंचन करावे.",
            float(round(total_7d_rain, 2)), "mm", "Next 7 days"
        )

    # --- 6. High humidity (disease risk) ---
    humid_hours = [h for h in hourly[:12] if h.get("humidity", 0) >= THRESHOLDS["high_humidity_pct"]]
    if len(humid_hours) >= 6:
        avg_hum = sum(h["humidity"] for h in humid_hours) / len(humid_hours)
        save_alert(
            "humidity", "warning",
            f"High humidity — {avg_hum:.0f}% average over next 12 hours",
            f"Relative humidity is forecast to remain above {THRESHOLDS['high_humidity_pct']}% for the next {len(humid_hours)} hours. "
            "Prolonged high humidity increases the risk of fungal diseases on cotton. "
            "Inspect leaves for early signs of grey mildew or Alternaria leaf spot.",
            f"जास्त आर्द्रता: {avg_hum:.0f}% ({len(humid_hours)} तास)",
            f"पुढील {len(humid_hours)} तासांत हवेतील आर्द्रता {avg_hum:.0f}% राहण्याची शक्यता. "
            "जास्त आर्द्रतेमुळे बुरशीजन्य रोगांचा धोका वाढतो. पाने तपासा.",
            float(round(avg_hum, 0)), "%", f"Next {len(humid_hours)} hours"
        )

    return alerts_created


def get_weather_based_recommendation_context(weather_data: dict) -> dict:
    """
    Extract a simplified weather context dict to pass into the recommendations engine.
    Maps to the `recent_weather` field in RecommendationsRequest.
    """
    current = weather_data.get("current", {})
    hourly = weather_data.get("hourly_next24", [])
    daily = weather_data.get("daily_forecast", [])

    rain_6h_prob = max((h.get("precip_prob", 0) for h in hourly[:6]), default=0)
    rain_24h_mm = sum(h.get("precipitation_mm", 0.0) for h in hourly[:24])
    rain_7d_mm = sum(d.get("precipitation_sum_mm", 0.0) for d in daily)

    return {
        "temperature_c": current.get("temperature"),
        "humidity_pct": current.get("humidity"),
        "wind_kmh": current.get("windspeed"),
        "rain_6h_probability_pct": rain_6h_prob,
        "rain_24h_mm": round(rain_24h_mm, 1),
        "rain_7d_mm": round(rain_7d_mm, 1),
        "condition": current.get("condition", "Unknown"),
        "weathercode": current.get("weathercode", 0),
    }

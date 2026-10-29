import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.weather_service import (
    generate_alerts_from_forecast,
    _cooldown_ok,
    _prefs_allow,
)
from backend.app.core.database import SessionLocal
from backend.app.models.weather import WeatherAlert, NotificationPrefs

client = TestClient(app)


def test_weather_locations_list():
    """Verify predefined cotton-growing locations are returned."""
    res = client.get("/api/weather/locations")
    assert res.status_code == 200
    locations = res.json()
    assert len(locations) >= 15
    assert any("Sambhajinagar" in loc["name"] for loc in locations)
    assert any(loc["state"] == "Maharashtra" for loc in locations)


def test_weather_forecast_live_api():
    """Verify live Open-Meteo forecast endpoint returns valid data structure."""
    res = client.get("/api/weather/forecast?user_identifier=test_weather_user")
    assert res.status_code == 200
    data = res.json()
    assert "current" in data
    assert "daily_forecast" in data
    assert "hourly_next24" in data
    assert len(data["daily_forecast"]) == 7
    assert data["latitude"] > 0
    assert "advisory_summary" in data


def test_weather_alert_dedup_and_cooldown():
    """Verify alerts are not duplicated within cooldown window."""
    db = SessionLocal()
    try:
        user_id = "test_cooldown_farmer"
        # Clean previous alerts for test user
        db.query(WeatherAlert).filter_by(user_identifier=user_id).delete()
        db.commit()

        synthetic_forecast = {
            "latitude": 19.8762,
            "longitude": 75.3433,
            "current": {"windspeed": 28.0, "temperature": 32.0, "humidity": 60},
            "hourly_next24": [
                {"precip_prob": 75, "precipitation_mm": 2.5, "wind_kmh": 28.0, "humidity": 65}
                for _ in range(6)
            ],
            "daily_forecast": [{"precipitation_sum_mm": 10.0} for _ in range(7)]
        }

        # First run creates alerts
        first_run = generate_alerts_from_forecast(synthetic_forecast, user_id, "Test Location", db)
        assert len(first_run) >= 1

        # Second immediate run should be blocked by cooldown
        second_run = generate_alerts_from_forecast(synthetic_forecast, user_id, "Test Location", db)
        assert len(second_run) == 0, "Duplicate alerts must be suppressed by cooldown"
    finally:
        db.close()


def test_notification_preferences_get_and_put():
    """Verify reading and updating farmer notification preferences."""
    user_id = "test_prefs_user"
    # Get initial prefs
    get_res = client.get(f"/api/weather/preferences?user_identifier={user_id}")
    assert get_res.status_code == 200
    prefs = get_res.json()
    assert prefs["rain_alerts"] is True

    # Update prefs: disable wind alerts
    put_res = client.put(f"/api/weather/preferences?user_identifier={user_id}", json={
        "wind_alerts": False,
        "preferred_language": "Marathi"
    })
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["wind_alerts"] is False
    assert updated["preferred_language"] == "Marathi"


def test_device_token_lifecycle():
    """Verify push token registration and deactivation."""
    token = "ExponentPushToken[unit_test_token_12345]"
    user = "test_device_user"

    # Register
    reg_res = client.post("/api/notifications/register-token", json={
        "user_identifier": user,
        "expo_push_token": token,
        "device_id": "test_phone_x",
        "platform": "android"
    })
    assert reg_res.status_code == 200
    assert reg_res.json()["status"] == "registered"

    # Unregister
    unreg_res = client.post("/api/notifications/unregister-token", json={
        "expo_push_token": token
    })
    assert unreg_res.status_code == 200
    assert unreg_res.json()["status"] == "unregistered"


def test_weather_adaptive_recommendations():
    """Verify that recent_weather modifies recommendations appropriately."""
    # Test rain alert in recommendations
    res = client.post("/api/recommendations", json={
        "crop_days": 50,
        "land_acres": 2.5,
        "soil_type": "काळी माती (Black Soil)",
        "water_source": "विहीर / बोरवेल (Irrigated)",
        "recent_weather": {
            "temperature_c": 31.0,
            "humidity_pct": 85.0,
            "wind_kmh": 22.0,
            "rain_6h_probability_pct": 70,
            "rain_24h_mm": 12.0,
            "rain_7d_mm": 18.0
        }
    })
    assert res.status_code == 200
    data = res.json()
    precautions_text = " ".join(data["expert_precautions"])
    assert "पाऊस" in precautions_text or "फवारणी" in precautions_text
    # Check fungal watch was added due to high humidity
    pest_names = [p["pest"] for p in data["pest_disease_watch"]]
    assert any("दहिया" in name or "Fungal" in name or "करपा" in name for name in pest_names)

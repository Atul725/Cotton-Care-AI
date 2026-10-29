import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "CottonCare AI"
    assert data["database_connected"] is True
    assert data["model_loaded"] is True

def test_yield_model_info():
    response = client.get("/api/yield/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "RandomForestRegressor"
    assert "metrics" in data
    assert "mae" in data["metrics"]
    assert "r2_score" in data["metrics"]
    assert len(data["features"]) == 9

def test_yield_prediction():
    payload = {
        "user_identifier": "test_farmer",
        "acres": 3.0,
        "growth_cycle": 120.0,
        "sunlight_hours": 7.5,
        "precipitation": 520.0,
        "temperature": 27.0,
        "soil_moisture": 68.0,
        "soil_ph": 6.8,
        "co2_concentration": 415.0,
        "drought_days": 20.0,
        "flood_days": 5.0,
        "soil_type": "काळी माती (Black Soil)",
        "water_source": "विहीर / बोरवेल (Irrigated)"
    }
    response = client.post("/api/yield/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_yield_per_acre_kg"] > 0
    assert data["total_predicted_yield_quintals"] > 0
    assert len(data["top_influencing_factors"]) > 0
    assert len(data["agronomic_advisory"]) > 0

def test_recommendations():
    payload = {
        "crop_days": 45,
        "land_acres": 2.5,
        "soil_type": "काळी माती (Black Soil)",
        "water_source": "विहीर / बोरवेल (Irrigated)"
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "growth_stage" in data
    assert "fertilizer_schedule" in data
    assert data["fertilizer_schedule"]["urea_kg"] > 0
    assert "irrigation_schedule" in data

def test_farmer_profile():
    response = client.get("/api/users/profile?identifier=test_farmer")
    assert response.status_code == 200
    data = response.json()
    assert data["identifier"] == "test_farmer"

    update_payload = {
        "name": "दिनेश ताडके (Dinesh Thadke)",
        "location": "छत्रपती संभाजीनगर",
        "contact_number": "+91 98765 00000",
        "land_acres": 5.0
    }
    put_res = client.put("/api/users/profile?identifier=test_farmer", json=update_payload)
    assert put_res.status_code == 200
    updated_data = put_res.json()
    assert updated_data["name"] == "दिनेश ताडके (Dinesh Thadke)"
    assert updated_data["land_acres"] == 5.0

def test_analytics_summary():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] > 0
    assert len(data["key_factors"]) > 0

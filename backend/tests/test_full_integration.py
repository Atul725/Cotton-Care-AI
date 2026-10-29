import sys
import pytest
import io
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

client = TestClient(app)

# ==============================================================================
# 1. YIELD PREDICTION: Valid Low, Medium, High & Invalid Inputs
# ==============================================================================
def test_yield_prediction_low_medium_high_variation():
    """Verify that changing input agronomic values produces different, realistic model predictions."""
    low_payload = {
        "acres": 1.0,
        "growth_cycle": 70.0,
        "sunlight_hours": 4.0,
        "precipitation": 250.0,
        "temperature": 34.0,
        "soil_moisture": 35.0,
        "soil_ph": 8.5,
        "co2_concentration": 410.0,
        "drought_days": 35.0,
        "flood_days": 0.0,
        "soil_type": "हलकी / बरड माती (Sandy / Loamy)",
        "water_source": "कोरडवाहू (Rainfed)"
    }
    
    med_payload = {
        "acres": 5.0,
        "growth_cycle": 130.0,
        "sunlight_hours": 8.0,
        "precipitation": 650.0,
        "temperature": 27.0,
        "soil_moisture": 68.0,
        "soil_ph": 7.0,
        "co2_concentration": 415.0,
        "drought_days": 10.0,
        "flood_days": 2.0,
        "soil_type": "काळी माती (Black Soil)",
        "water_source": "ठिबक सिंचन (Drip)"
    }
    
    high_payload = {
        "acres": 10.0,
        "growth_cycle": 160.0,
        "sunlight_hours": 9.0,
        "precipitation": 800.0,
        "temperature": 26.0,
        "soil_moisture": 75.0,
        "soil_ph": 6.8,
        "co2_concentration": 420.0,
        "drought_days": 2.0,
        "flood_days": 1.0,
        "soil_type": "काळी माती (Black Soil)",
        "water_source": "विहीर / बोरवेल (Irrigated)"
    }
    
    r_low = client.post("/api/yield/predict", json=low_payload)
    r_med = client.post("/api/yield/predict", json=med_payload)
    r_high = client.post("/api/yield/predict", json=high_payload)
    
    assert r_low.status_code == 200, r_low.text
    assert r_med.status_code == 200, r_med.text
    assert r_high.status_code == 200, r_high.text
    
    yield_low = r_low.json()["predicted_yield_per_acre_kg"]
    yield_med = r_med.json()["predicted_yield_per_acre_kg"]
    yield_high = r_high.json()["predicted_yield_per_acre_kg"]
    
    # Verify outputs are different and derived from real model evaluation
    assert yield_low != yield_med, "Model must produce distinct outputs for different agronomic inputs"
    assert yield_med != yield_high, "Model must differentiate between medium and high conditions"
    assert yield_low < yield_med, f"Low moisture/drought conditions ({yield_low}) should yield less than optimal ({yield_med})"

def test_yield_prediction_invalid_and_out_of_range():
    """Verify input validation rejects invalid, negative, or out-of-range values."""
    # 1. Negative acres
    neg_acres = client.post("/api/yield/predict", json={"acres": -5.0})
    assert neg_acres.status_code == 422, "Negative acres should return 422 Validation Error"
    
    # 2. Extreme temperature out of range
    extreme_temp = client.post("/api/yield/predict", json={"temperature": 150.0})
    assert extreme_temp.status_code == 422, "Extreme temperature should fail Pydantic bounds (le=48)"
    
    # 3. Non-numeric input
    bad_type = client.post("/api/yield/predict", json={"growth_cycle": "invalid_string"})
    assert bad_type.status_code == 422, "Non-numeric input must fail type validation"

# ==============================================================================
# 2. WEATHER FORECAST & ALERTS
# ==============================================================================
def test_weather_forecast_and_alerts():
    """Verify live weather forecast and alert generation."""
    res = client.get("/api/weather/forecast?latitude=19.8762&longitude=75.3433&location_name=Chhatrapati%20Sambhajinagar")
    assert res.status_code == 200
    data = res.json()
    assert "current" in data
    assert "daily_forecast" in data
    assert len(data["daily_forecast"]) == 7
    assert data["latitude"] == 19.8762
    assert "location_name" in data

def test_weather_locations_list():
    """Verify cotton districts list is populated with 19 locations."""
    res = client.get("/api/weather/locations")
    assert res.status_code == 200
    locs = res.json()
    assert len(locs) >= 15
    assert any("Sambhajinagar" in l["name"] for l in locs)

# ==============================================================================
# 3. RECOMMENDATIONS ACROSS GROWTH STAGES
# ==============================================================================
def test_recommendations_crop_stages():
    """Verify stage-dependent recommendations for 25 days (vegetative), 60 days (flowering), and 120 days (boll maturation)."""
    # Vegetative stage
    r_veg = client.post("/api/recommendations", json={"crop_days": 25, "land_acres": 3.0})
    assert r_veg.status_code == 200
    data_veg = r_veg.json()
    assert "वाढ" in data_veg["growth_stage"] or "Vegetative" in data_veg["growth_stage"] or "शाकीय" in data_veg["growth_stage"]
    
    # Flowering stage
    r_flow = client.post("/api/recommendations", json={"crop_days": 65, "land_acres": 3.0})
    assert r_flow.status_code == 200
    data_flow = r_flow.json()
    assert "फुलोरा" in data_flow["growth_stage"] or "Flowering" in data_flow["growth_stage"]
    
    # Boll development stage
    r_boll = client.post("/api/recommendations", json={"crop_days": 110, "land_acres": 3.0})
    assert r_boll.status_code == 200
    data_boll = r_boll.json()
    assert "बोंड" in data_boll["growth_stage"] or "Boll" in data_flow["growth_stage"] or "परिपक्वता" in data_boll["growth_stage"]

# ==============================================================================
# 4. MULTILINGUAL VOICE ASSISTANT
# ==============================================================================
def test_assistant_marathi_irrigation_question():
    """Test: 'माझ्या कापसाच्या पिकाला किती पाणी द्यावे?'"""
    res = client.post("/api/assistant/chat", json={
        "question": "माझ्या कापसाच्या पिकाला किती पाणी द्यावे?",
        "language": "Marathi"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "Marathi"
    assert len(data["answer"]) > 30
    assert any(k in data["answer"] for k in ["पाणी", "सिंचन", "कापूस", "ओलावा"])

def test_assistant_hindi_rain_probability_question():
    """Test: 'कपास की फसल में बारिश की संभावना कितनी है?'"""
    res = client.post("/api/assistant/chat", json={
        "question": "कपास की फसल में बारिश की संभावना कितनी है?",
        "language": "Hindi"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "Hindi"
    assert len(data["answer"]) > 30
    assert any(k in data["answer"] for k in ["बारिश", "मौसम", "तापमान", "कपास"])

def test_assistant_english_improve_yield_question():
    """Test: 'How can I improve cotton yield?'"""
    res = client.post("/api/assistant/chat", json={
        "question": "How can I improve cotton yield?",
        "language": "English"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "English"
    assert len(data["answer"]) > 30
    assert any(k in data["answer"].lower() for k in ["yield", "moisture", "cotton", "fertilizer"])

def test_assistant_english_heavy_rain_question():
    """Test: 'What should I do if heavy rain is forecast?'"""
    res = client.post("/api/assistant/chat", json={
        "question": "What should I do if heavy rain is forecast?",
        "language": "English"
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["answer"]) > 30
    assert any(k in data["answer"].lower() for k in ["drainage", "water", "rain", "spray"])

# ==============================================================================
# 5. DEVICE TOKEN & PUSH NOTIFICATIONS
# ==============================================================================
def test_device_token_and_test_push():
    """Verify device registration, push dispatch, and unregistration lifecycle."""
    # 1. Register device
    reg = client.post("/api/notifications/register-token", json={
        "user_identifier": "integration_tester",
        "expo_push_token": "ExponentPushToken[IntegrationTestKey999]",
        "platform": "android",
        "device_id": "test_pixel_7"
    })
    assert reg.status_code == 200
    assert reg.json()["status"] == "registered"
    
    # 2. Test push dispatch
    push = client.post("/api/notifications/test-push", json={
        "user_identifier": "integration_tester",
        "title": "Integration Test Alert",
        "body": "Rain alert test message"
    })
    assert push.status_code == 200
    assert push.json()["status"] == "completed"
    assert push.json()["devices_notified"] >= 1
    
    # 3. Unregister
    unreg = client.post("/api/notifications/unregister-token", json={
        "expo_push_token": "ExponentPushToken[IntegrationTestKey999]"
    })
    assert unreg.status_code == 200
    assert unreg.json()["status"] == "unregistered"

# ==============================================================================
# 6. FARMER PROFILE PERSISTENCE
# ==============================================================================
def test_farmer_profile_get_and_put():
    """Verify farmer profile update and retrieval in SQLite."""
    update_res = client.put("/api/users/profile?identifier=demo_farmer", json={
        "name": "Atul Patil",
        "location": "Chhatrapati Sambhajinagar",
        "land_acres": 6.5,
        "contact_number": "+91 9876543210"
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Atul Patil"
    assert update_res.json()["land_acres"] == 6.5
    
    get_res = client.get("/api/users/profile?identifier=demo_farmer")
    assert get_res.status_code == 200
    assert get_res.json()["land_acres"] == 6.5

# ==============================================================================
# 7. CROP DISEASE IMAGE DIAGNOSIS
# ==============================================================================
def test_disease_detection_image_upload():
    """Verify image diagnostic endpoint accepts valid images and rejects non-images."""
    # Create a small valid test JPEG in-memory
    img = Image.new("RGB", (100, 100), color="green")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_bytes = img_byte_arr.getvalue()
    
    files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
    res = client.post("/api/disease/predict?user_identifier=demo_farmer", files=files)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "condition_detected" in data
    assert "severity_level" in data
    assert "confidence_score" in data
    assert "diagnostic_report" in data
    assert len(data["diagnostic_report"]) > 20
    
    # Reject non-image file
    bad_file = {"file": ("bad_script.txt", b"not an image", "text/plain")}
    bad_res = client.post("/api/disease/predict", files=bad_file)
    assert bad_res.status_code == 400

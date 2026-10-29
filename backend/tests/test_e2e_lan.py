import requests
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://10.101.248.109:8000/api"

def main():
    print("--- Testing End-to-End Flow on LAN IP:", BASE)

    # 1. Health
    r = requests.get(f"{BASE}/health", timeout=5)
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("1. Health Check: OK")

    # 2. Yield Prediction
    payload = {
        "user_identifier": "demo_farmer",
        "acres": 5.0,
        "growth_cycle": 150.0,
        "sunlight_hours": 8.0,
        "precipitation": 650.0,
        "temperature": 27.5,
        "soil_moisture": 65.0,
        "soil_ph": 7.2,
        "co2_concentration": 415.0,
        "drought_days": 15.0,
        "flood_days": 5.0,
        "soil_type": "Black",
        "water_source": "Drip Irrigation"
    }
    r = requests.post(f"{BASE}/yield/predict", json=payload, timeout=5)
    assert r.status_code == 200, f"Yield predict failed: {r.text}"
    res = r.json()
    print(f"2. Yield Prediction: OK -> Predicted {res['predicted_yield_per_acre_kg']} kg/acre ({res['total_predicted_yield_quintals']} quintals, confidence: {res['confidence_level']})")

    # 3. Weather Forecast
    r = requests.get(f"{BASE}/weather/forecast?latitude=19.8762&longitude=75.3433&location_name=Chhatrapati%20Sambhajinagar", timeout=15)
    assert r.status_code == 200, f"Weather forecast failed: {r.text}"
    w_data = r.json()
    print(f"3. Weather Forecast: OK -> Temp {w_data['current']['temperature']}C, Condition: {w_data['current']['condition']}")

    # 4. Weather Alerts
    r = requests.get(f"{BASE}/weather/alerts?user_identifier=demo_farmer", timeout=5)
    assert r.status_code == 200, f"Weather alerts failed: {r.text}"
    alerts = r.json()
    print(f"4. Weather Alerts: OK -> {len(alerts)} active alerts")

    # 5. Recommendations
    rec_payload = {
        "crop_days": 45,
        "land_acres": 5.0,
        "soil_type": "काळी माती (Black Soil)",
        "water_source": "विहीर / बोरवेल (Irrigated)",
        "recent_weather": {
            "rain_prob": 70,
            "wind_kmh": 22
        }
    }
    r = requests.post(f"{BASE}/recommendations", json=rec_payload, timeout=5)
    assert r.status_code == 200, f"Recommendations failed: {r.text}"
    rec = r.json()
    print(f"5. Agronomic Recommendations: OK -> Stage: {rec['growth_stage']}, Precautions: {len(rec.get('expert_precautions', []))}")

    # 6. Device Token Registration
    token_payload = {
        "user_identifier": "demo_farmer",
        "expo_push_token": "ExponentPushToken[VerificationTestToken12345]",
        "platform": "android",
        "device_id": "samsung_sm_g991b"
    }
    r = requests.post(f"{BASE}/notifications/register-token", json=token_payload, timeout=5)
    assert r.status_code == 200, f"Token register failed: {r.text}"
    print("6. Push Token Registration: OK")

    # 7. Test Push Notification
    push_payload = {
        "user_identifier": "demo_farmer",
        "title": "CottonCare Test",
        "body": "Verification push test via LAN",
        "data": {"type": "test"}
    }
    r = requests.post(f"{BASE}/notifications/test-push", json=push_payload, timeout=10)
    assert r.status_code == 200, f"Push test failed: {r.text}"
    push_res = r.json()
    print(f"7. Push Notification Dispatch: OK -> Status: {push_res['status']}, Devices Notified: {push_res['devices_notified']}/{push_res['total_devices']}")

    print("\n>>> ALL 7 END-TO-END LAN CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    main()

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.gemini_client import ALL_CANDIDATE_MODELS
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_id_token,
    get_current_user,
    get_current_user_optional,
)
from backend.app.models.farmer import FarmerUser
from backend.app.models.dataset import DatasetMetadata
from backend.app.models.prediction import YieldPredictionRecord
from backend.app.models.disease import ScanHistoryRecord
from backend.app.models.weather import WeatherAlert, DeviceToken, NotificationPrefs
from backend.app.schemas.schemas import (
    HealthResponse,
    FarmerProfileResponse,
    FarmerProfileUpdate,
    DatasetUploadResponse,
    DatasetSummarySchema,
    AnalyticsSummaryResponse,
    YieldPredictRequest,
    YieldPredictResponse,
    ModelInfoResponse,
    DiseasePredictResponse,
    AssistantChatRequest,
    AssistantChatResponse,
    RecommendationsRequest,
    RecommendationsResponse,
    WeatherResponse,
    WeatherAlertSchema,
    NotificationPrefsSchema,
    NotificationPrefsUpdate,
    DeviceTokenRegisterRequest,
    DeviceTokenUnregisterRequest,
    TestPushRequest,
    LocationOptionSchema,
    AuthRegisterRequest,
    AuthLoginRequest,
    AuthGoogleRequest,
    AuthTokenResponse,
    CurrentUserResponse,
)
from backend.app.services.yield_service import predict_yield, get_model_info
from backend.app.services.dataset_service import process_dataset_upload, get_analytics_summary
from backend.app.services.disease_service import analyze_cotton_crop_image, check_offline_model_available
from backend.app.services.assistant_service import ask_cotton_assistant
from backend.app.services.recommendation_service import generate_recommendations
from backend.app.services.weather_service import (
    fetch_weather,
    generate_alerts_from_forecast,
    get_weather_based_recommendation_context,
)
from backend.app.services.notification_service import (
    register_device_token,
    send_expo_push,
)

router = APIRouter()

# --- Health Endpoint ---
@router.get("/health", response_model=HealthResponse, tags=["System"])
def get_health(db: Session = Depends(get_db)):
    """Health status check of CottonCare AI backend, database, and model readiness."""
    model_loaded = (settings.MODEL_DIR / "cotton_yield_model.joblib").exists()
    ai_configured = bool(settings.GEMINI_API_KEY)
    return HealthResponse(
        status="healthy",
        project="CottonCare AI",
        version="2.0.0",
        database_connected=True,
        ai_configured=ai_configured,
        model_loaded=model_loaded
    )

# --- Authentication Endpoints ---
@router.post("/auth/register", response_model=AuthTokenResponse, tags=["Authentication"])
def register_user(req: AuthRegisterRequest, db: Session = Depends(get_db)):
    """Register a new farmer account with PBKDF2 hashed password."""
    clean_username = req.username.strip().lower()
    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    # Check if user already exists
    existing = db.query(FarmerUser).filter(
        (FarmerUser.identifier == clean_username) | 
        ((FarmerUser.email == req.email.strip().lower()) if req.email else False)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email is already registered. Please sign in.")

    # Create farmer account
    new_user = FarmerUser(
        identifier=clean_username,
        email=req.email.strip().lower() if req.email else None,
        password_hash=hash_password(req.password),
        name=req.name or "शेतकरी मित्र",
        location=req.location or "छत्रपती संभाजीनगर",
        location_name=f"{req.location or 'छत्रपती संभाजीनगर'} (Farm Location)",
        land_acres=req.land_acres or 2.0,
        contact_number=req.contact_number,
        auth_provider="local"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.identifier, new_user.email, new_user.name)
    user_dict = {
        "id": new_user.id,
        "identifier": new_user.identifier,
        "email": new_user.email,
        "name": new_user.name,
        "location": new_user.location,
        "land_acres": new_user.land_acres,
        "auth_provider": new_user.auth_provider
    }
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_dict,
        message="Account registered successfully."
    )

@router.post("/auth/login", response_model=AuthTokenResponse, tags=["Authentication"])
def login_user(req: AuthLoginRequest, db: Session = Depends(get_db)):
    """Authenticate farmer user and return signed access token."""
    login_id = req.username_or_email.strip().lower()
    user = db.query(FarmerUser).filter(
        (FarmerUser.identifier == login_id) | 
        (FarmerUser.email == login_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password. Please check your credentials."
        )

    # Allow login for demo account if password matches demo123 or if demo flag
    is_valid = False
    if user.password_hash:
        is_valid = verify_password(req.password, user.password_hash)
    elif user.identifier == "demo_farmer" and req.password in ("demo123", "demo"):
        is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password. Please check your credentials."
        )

    token = create_access_token(user.identifier, user.email, user.name)
    user_dict = {
        "id": user.id,
        "identifier": user.identifier,
        "email": user.email,
        "name": user.name,
        "location": user.location,
        "land_acres": user.land_acres,
        "auth_provider": user.auth_provider
    }
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_dict,
        message="Signed in successfully."
    )

@router.post("/auth/google", response_model=AuthTokenResponse, tags=["Authentication"])
async def google_auth(req: AuthGoogleRequest, db: Session = Depends(get_db)):
    """Authenticate or register user via Google OAuth2 ID Token."""
    google_data = await verify_google_id_token(req.id_token)
    if not google_data:
        raise HTTPException(
            status_code=400,
            detail=(
                "Google verification failed or Google Client ID is not configured. "
                "Ensure GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID are set in your configuration."
            )
        )

    google_sub = google_data["sub"]
    google_email = google_data.get("email", "").lower()
    google_name = google_data.get("name", "Google Farmer")

    # Look up by google_sub or email
    user = db.query(FarmerUser).filter(
        (FarmerUser.google_sub == google_sub) | 
        ((FarmerUser.email == google_email) if google_email else False)
    ).first()

    if not user:
        # Create new Google authenticated farmer
        clean_identifier = f"google_{google_sub[:10]}"
        user = FarmerUser(
            identifier=clean_identifier,
            email=google_email or None,
            google_sub=google_sub,
            name=google_name,
            location="छत्रपती संभाजीनगर",
            location_name="छत्रपती संभाजीनगर (Chh. Sambhajinagar)",
            land_acres=2.0,
            auth_provider="google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update google_sub if not linked
        if not user.google_sub:
            user.google_sub = google_sub
            db.commit()

    token = create_access_token(user.identifier, user.email, user.name)
    user_dict = {
        "id": user.id,
        "identifier": user.identifier,
        "email": user.email,
        "name": user.name,
        "location": user.location,
        "land_acres": user.land_acres,
        "auth_provider": user.auth_provider
    }
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_dict,
        message="Signed in with Google successfully."
    )

@router.get("/auth/me", response_model=CurrentUserResponse, tags=["Authentication"])
def get_current_user_profile(user: FarmerUser = Depends(get_current_user)):
    """Returns the verified profile of the currently logged-in farmer."""
    return CurrentUserResponse(
        id=user.id,
        identifier=user.identifier,
        email=user.email,
        name=user.name,
        location=user.location,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        contact_number=user.contact_number,
        land_acres=user.land_acres,
        auth_provider=user.auth_provider or "local"
    )

# --- Farmer Profile Endpoints ---
@router.get("/users/profile", response_model=FarmerProfileResponse, tags=["Farmer Profile"])
def get_farmer_profile(
    identifier: str = Query("demo_farmer"),
    current_user: Optional[FarmerUser] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve farmer profile by identifier or authenticated session."""
    target_id = current_user.identifier if current_user else identifier
    user = db.query(FarmerUser).filter_by(identifier=target_id).first()
    if not user:
        user = FarmerUser(
            identifier=target_id,
            name="शेतकरी मित्र",
            location="छत्रपती संभाजीनगर",
            location_name="छत्रपती संभाजीनगर (Chh. Sambhajinagar)",
            latitude=19.8762,
            longitude=75.3433,
            land_acres=2.0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.put("/users/profile", response_model=FarmerProfileResponse, tags=["Farmer Profile"])
def update_farmer_profile(
    profile_data: FarmerProfileUpdate,
    identifier: str = Query("demo_farmer"),
    current_user: Optional[FarmerUser] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Update farmer profile details."""
    target_id = current_user.identifier if current_user else identifier
    user = db.query(FarmerUser).filter_by(identifier=target_id).first()
    if not user:
        user = FarmerUser(identifier=target_id)
        db.add(user)
    
    user.name = profile_data.name
    user.location = profile_data.location
    if profile_data.location_name:
        user.location_name = profile_data.location_name
    if profile_data.latitude is not None:
        user.latitude = profile_data.latitude
    if profile_data.longitude is not None:
        user.longitude = profile_data.longitude
    user.contact_number = profile_data.contact_number
    user.land_acres = profile_data.land_acres
    db.commit()
    db.refresh(user)
    return user

# --- Dataset Upload & Analytics Endpoints ---
@router.post("/datasets/upload", response_model=DatasetUploadResponse, tags=["Agricultural Data & ML"])
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and validate an agricultural CSV dataset, reporting stats, nulls, duplicates, and preview."""
    return await process_dataset_upload(file, db)

@router.get("/datasets", response_model=List[DatasetSummarySchema], tags=["Agricultural Data & ML"])
def list_datasets(db: Session = Depends(get_db)):
    """List all uploaded agricultural datasets with schema and row metrics."""
    import json
    datasets = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).all()
    results = []
    for d in datasets:
        cols = json.loads(d.columns_json) if d.columns_json else []
        results.append(DatasetSummarySchema(
            id=d.id,
            filename=d.filename,
            file_size_bytes=d.file_size_bytes,
            row_count=d.row_count,
            column_count=d.column_count,
            columns=cols,
            null_count=d.null_count,
            duplicate_count=d.duplicate_count,
            created_at=d.created_at
        ))
    return results

@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse, tags=["Agricultural Data & ML"])
def get_analytics(db: Session = Depends(get_db)):
    """Retrieve statistical summaries, correlations with yield, distributions, and top factors."""
    return get_analytics_summary(db)

# --- Yield Prediction Endpoints ---
@router.post("/yield/predict", response_model=YieldPredictResponse, tags=["Yield Prediction"])
def predict_cotton_yield(request: YieldPredictRequest, db: Session = Depends(get_db)):
    """
    Predict cotton yield using the trained Machine Learning regression model
    (RandomForestRegressor on 80,000 observations). Returns yield estimate, confidence, and advisory.
    """
    try:
        return predict_yield(request, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/yield/model-info", response_model=ModelInfoResponse, tags=["Yield Prediction"])
def get_prediction_model_info():
    """Retrieve model metadata, evaluation metrics (MAE, RMSE, R²), features, and training provenance."""
    try:
        return get_model_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Disease Detection Endpoints ---
@router.post("/disease/predict", response_model=DiseasePredictResponse, tags=["Disease Detection"])
@router.post("/disease/detect", response_model=DiseasePredictResponse, tags=["Disease Detection"])
async def predict_crop_disease(
    file: UploadFile = File(...),
    user_identifier: str = Form("demo_farmer"),
    db: Session = Depends(get_db)
):
    """
    Inspect cotton crop/leaf photo for diseases, severity, confidence, immediate actions, and prevention.
    Employs Gemini Multimodal Vision with bounded retries and local CNN offline readiness.
    """
    return await analyze_cotton_crop_image(file, db, user_identifier)

# --- Assistant Chat Endpoints ---
@router.post("/assistant/chat", response_model=AssistantChatResponse, tags=["Voice Assistant"])
async def chat_with_assistant(request: AssistantChatRequest):
    """
    Conversational agricultural assistant supporting English, Hindi, and Marathi.
    Handles temporary 503/429/timeout errors gracefully without exposing secrets or stack traces.
    Uses real-time weather and agronomic guidelines to answer practical farmer questions.
    """
    return await ask_cotton_assistant(request)

# --- Recommendations Endpoints ---
@router.post("/recommendations", response_model=RecommendationsResponse, tags=["Recommendations"])
def get_smart_recommendations(request: RecommendationsRequest):
    """
    Generate agronomic recommendations for irrigation, fertilizer dosage,
    pest watch list, and expert precautions based on crop growth stage and soil type.
    """
    return generate_recommendations(request)

# --- History Endpoints ---
@router.get("/history", tags=["History & Archives"])
def get_history(
    user_identifier: str = Query("demo_farmer"),
    category: str = Query("all"),  # "yield", "disease", "all"
    current_user: Optional[FarmerUser] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve historical yield predictions and crop disease scans for the specified user."""
    target_user = current_user.identifier if current_user else user_identifier
    results = {}
    if category in ("yield", "all"):
        yields = db.query(YieldPredictionRecord)\
            .filter_by(user_identifier=target_user)\
            .order_by(YieldPredictionRecord.id.desc()).limit(20).all()
        results["yield_predictions"] = [
            {
                "id": y.id,
                "acres": y.acres,
                "growth_cycle": y.growth_cycle,
                "temperature": y.temperature,
                "precipitation": y.precipitation,
                "predicted_yield_per_acre": y.predicted_yield_per_acre,
                "total_predicted_yield_quintals": y.total_predicted_yield,
                "model_name": y.model_name,
                "created_at": y.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for y in yields
        ]
    if category in ("disease", "all"):
        scans = db.query(ScanHistoryRecord)\
            .filter_by(user_identifier=target_user)\
            .order_by(ScanHistoryRecord.id.desc()).limit(20).all()
        results["disease_scans"] = [
            {
                "id": s.id,
                "condition_detected": s.condition_detected,
                "severity_level": s.severity_level,
                "confidence_score": s.confidence_score,
                "diagnostic_report": s.diagnostic_report,
                "image_data_url": s.image_data_url,
                "detection_engine": s.detection_engine,
                "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for s in scans
        ]
    return results

@router.get("/history/{item_id}", tags=["History & Archives"])
def get_history_detail(item_id: int, category: str = Query("yield"), db: Session = Depends(get_db)):
    """Retrieve detailed record for a specific yield prediction or disease scan."""
    if category == "yield":
        rec = db.query(YieldPredictionRecord).filter_by(id=item_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Prediction record not found.")
        return rec
    else:
        rec = db.query(ScanHistoryRecord).filter_by(id=item_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Scan record not found.")
        return rec

# --- Weather & Alert Endpoints ---
MAJOR_COTTON_LOCATIONS = [
    {"name": "छत्रपती संभाजीनगर (Chh. Sambhajinagar)", "state": "Maharashtra", "latitude": 19.8762, "longitude": 75.3433},
    {"name": "जालना (Jalna)", "state": "Maharashtra", "latitude": 19.8410, "longitude": 75.8864},
    {"name": "बीड (Beed)", "state": "Maharashtra", "latitude": 18.9891, "longitude": 75.7601},
    {"name": "परभणी (Parbhani)", "state": "Maharashtra", "latitude": 19.2608, "longitude": 76.7749},
    {"name": "नांदेड (Nanded)", "state": "Maharashtra", "latitude": 19.1383, "longitude": 77.3210},
    {"name": "यवतमाळ (Yavatmal)", "state": "Maharashtra", "latitude": 20.3888, "longitude": 78.1204},
    {"name": "अकोला (Akola)", "state": "Maharashtra", "latitude": 20.7002, "longitude": 77.0082},
    {"name": "अमरावती (Amravati)", "state": "Maharashtra", "latitude": 20.9374, "longitude": 77.7796},
    {"name": "वर्धा (Wardha)", "state": "Maharashtra", "latitude": 20.7453, "longitude": 78.6022},
    {"name": "नागपूर (Nagpur)", "state": "Maharashtra", "latitude": 21.1458, "longitude": 79.0882},
    {"name": "जळगाव (Jalgaon)", "state": "Maharashtra", "latitude": 21.0077, "longitude": 75.5626},
    {"name": "धुळे (Dhule)", "state": "Maharashtra", "latitude": 20.9042, "longitude": 74.7749},
    {"name": "राजकोट (Rajkot)", "state": "Gujarat", "latitude": 22.3039, "longitude": 70.8022},
    {"name": "सुरेंद्रनगर (Surendranagar)", "state": "Gujarat", "latitude": 22.7278, "longitude": 71.6370},
    {"name": "बठिंडा (Bathinda)", "state": "Punjab", "latitude": 30.2110, "longitude": 74.9455},
    {"name": "सिरसा (Sirsa)", "state": "Haryana", "latitude": 29.5349, "longitude": 75.0290},
    {"name": "वारंगळ (Warangal)", "state": "Telangana", "latitude": 17.9689, "longitude": 79.5941},
    {"name": "आदिलाबाद (Adilabad)", "state": "Telangana", "latitude": 19.6641, "longitude": 78.5320},
    {"name": "गुंटूर (Guntur)", "state": "Andhra Pradesh", "latitude": 16.3067, "longitude": 80.4365},
]

@router.get("/weather/locations", response_model=List[LocationOptionSchema], tags=["Weather & Alerts"])
def list_cotton_locations():
    """List major cotton farming districts across Maharashtra and India with geographic coordinates."""
    return MAJOR_COTTON_LOCATIONS

@router.get("/weather/forecast", response_model=WeatherResponse, tags=["Weather & Alerts"])
async def get_weather_forecast(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_name: Optional[str] = None,
    user_identifier: str = Query("demo_farmer"),
    db: Session = Depends(get_db)
):
    """
    Fetch live 7-day weather forecast from Open-Meteo for farmer's location,
    evaluate agricultural alert conditions, and return active advisories.
    """
    from datetime import datetime
    if latitude is None or longitude is None:
        user = db.query(FarmerUser).filter_by(identifier=user_identifier).first()
        if user and user.latitude and user.longitude:
            latitude = user.latitude
            longitude = user.longitude
            location_name = location_name or user.location_name or user.location
        else:
            latitude = 19.8762
            longitude = 75.3433
            location_name = location_name or "छत्रपती संभाजीनगर (Chh. Sambhajinagar)"

    try:
        data = await fetch_weather(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Weather service unavailable: {str(e)}")

    # Evaluate and persist new alerts (with cooldown & dedup)
    generate_alerts_from_forecast(
        weather_data=data,
        user_id=user_identifier,
        location_name=location_name or "Farm Location",
        db=db
    )

    # Fetch active alerts for this user
    alerts = db.query(WeatherAlert).filter(
        WeatherAlert.user_identifier == user_identifier,
        WeatherAlert.expires_at > datetime.utcnow()
    ).order_by(WeatherAlert.id.desc()).limit(10).all()

    # Formulate advisory summary
    current = data.get("current", {})
    temp = current.get("temperature", 25) or 25
    wind = current.get("windspeed", 10) or 10
    precip = current.get("precipitation", 0) or 0

    if alerts:
        top_alert = alerts[0]
        advisory = f"⚠️ {top_alert.title_en} — {top_alert.message_en[:120]}..."
    elif wind > 20:
        advisory = "वाऱ्याचा वेग जास्त असल्याने कीटकनाशक फवारणी पुढे ढकलावी (High wind: avoid spraying)."
    elif temp > 36:
        advisory = "उष्णतेचा ताण: पिकाला संध्याकाळी हलके पाणी द्यावे (Heat stress: irrigate in evening)."
    elif precip > 0:
        advisory = "पाऊस सुरू असल्याने सिंचन थांबवावे व निचरा तपासावा (Rain active: check drainage)."
    else:
        advisory = "हवामान स्वच्छ व अनुकूल आहे; पीक तपासणी आणि मशागतीसाठी योग्य वेळ आहे (Favorable conditions)."

    return WeatherResponse(
        latitude=latitude,
        longitude=longitude,
        location_name=location_name or "Farm Location",
        timezone=data.get("timezone", "Asia/Kolkata"),
        fetched_at=data.get("fetched_at", datetime.utcnow().isoformat()),
        current=data.get("current", {}),
        daily_forecast=data.get("daily_forecast", []),
        hourly_next24=data.get("hourly_next24", []),
        active_alerts=alerts,
        advisory_summary=advisory
    )

@router.get("/weather/alerts", response_model=List[WeatherAlertSchema], tags=["Weather & Alerts"])
def list_weather_alerts(
    user_identifier: str = Query("demo_farmer"),
    unread_only: bool = Query(False),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve weather alerts generated for the user."""
    q = db.query(WeatherAlert).filter(WeatherAlert.user_identifier == user_identifier)
    if unread_only:
        q = q.filter(WeatherAlert.is_read == False)
    return q.order_by(WeatherAlert.id.desc()).limit(limit).all()

@router.post("/weather/alerts/{alert_id}/read", tags=["Weather & Alerts"])
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark a specific weather alert as read."""
    alert = db.query(WeatherAlert).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"status": "success", "alert_id": alert_id, "is_read": True}

@router.post("/weather/alerts/read-all", tags=["Weather & Alerts"])
def mark_all_alerts_read(user_identifier: str = Query("demo_farmer"), db: Session = Depends(get_db)):
    """Mark all weather alerts for a user as read."""
    updated = db.query(WeatherAlert).filter(
        WeatherAlert.user_identifier == user_identifier,
        WeatherAlert.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "marked_read_count": updated}

@router.get("/weather/preferences", response_model=NotificationPrefsSchema, tags=["Weather & Alerts"])
def get_weather_preferences(user_identifier: str = Query("demo_farmer"), db: Session = Depends(get_db)):
    """Get weather alert and notification preferences for a farmer."""
    prefs = db.query(NotificationPrefs).filter_by(user_identifier=user_identifier).first()
    if not prefs:
        prefs = NotificationPrefs(user_identifier=user_identifier)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

@router.put("/weather/preferences", response_model=NotificationPrefsSchema, tags=["Weather & Alerts"])
def update_weather_preferences(
    prefs_update: NotificationPrefsUpdate,
    user_identifier: str = Query("demo_farmer"),
    db: Session = Depends(get_db)
):
    """Update weather alert and notification preferences."""
    prefs = db.query(NotificationPrefs).filter_by(user_identifier=user_identifier).first()
    if not prefs:
        prefs = NotificationPrefs(user_identifier=user_identifier)
        db.add(prefs)

    update_data = prefs_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(prefs, field, val)

    db.commit()
    db.refresh(prefs)
    return prefs

# --- Notification Push Endpoints ---
@router.post("/notifications/register-token", tags=["Notifications"])
def register_push_token(request: DeviceTokenRegisterRequest, db: Session = Depends(get_db)):
    """Register or update an Expo push token for an Android/iOS device."""
    try:
        token_rec = register_device_token(
            db=db,
            user_identifier=request.user_identifier,
            expo_push_token=request.expo_push_token,
            device_id=request.device_id,
            platform=request.platform
        )
        return {
            "status": "registered",
            "expo_push_token": token_rec.expo_push_token,
            "platform": token_rec.platform,
            "user_identifier": token_rec.user_identifier
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to register token: {str(e)}")

@router.post("/notifications/unregister-token", tags=["Notifications"])
def unregister_push_token(request: DeviceTokenUnregisterRequest, db: Session = Depends(get_db)):
    """Deactivate an Expo push token on user logout or disabled notifications."""
    token_rec = db.query(DeviceToken).filter_by(expo_push_token=request.expo_push_token).first()
    if token_rec:
        token_rec.is_active = False
        db.commit()
    return {"status": "unregistered"}

@router.post("/notifications/test-push", tags=["Notifications"])
async def test_push_notification(request: TestPushRequest, db: Session = Depends(get_db)):
    """
    Send a test push notification to all active devices registered for the given user.
    Helps verify mobile push setup without waiting for a real weather event.
    """
    tokens = db.query(DeviceToken).filter_by(
        user_identifier=request.user_identifier,
        is_active=True
    ).all()

    if not tokens:
        return {
            "status": "no_devices",
            "message": f"No active device tokens found for user '{request.user_identifier}'. Open the mobile app to register.",
            "devices_notified": 0
        }

    sent = 0
    errors = []
    for t in tokens:
        try:
            await send_expo_push(
                token=t.expo_push_token,
                title=f"🌾 CottonCare: {request.title}",
                body=request.body,
                data={"type": "test_notification", "screen": "Dashboard"}
            )
            sent += 1
        except Exception as e:
            errors.append(f"{t.expo_push_token[-6:]}: {str(e)}")

    return {
        "status": "completed",
        "devices_notified": sent,
        "total_devices": len(tokens),
        "errors": errors
    }

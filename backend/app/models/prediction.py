from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.app.core.database import Base

class YieldPredictionRecord(Base):
    __tablename__ = "yield_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), default="guest_farmer")
    acres = Column(Float, nullable=False, default=1.0)
    growth_cycle = Column(Float, nullable=False)
    sunlight_hours = Column(Float, nullable=False)
    precipitation = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    co2_concentration = Column(Float, nullable=False)
    drought_days = Column(Float, default=0.0)
    flood_days = Column(Float, default=0.0)
    predicted_yield_per_acre = Column(Float, nullable=False)
    total_predicted_yield = Column(Float, nullable=False)
    model_name = Column(String(100), default="RandomForestRegressor")
    r2_score = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    advisory_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

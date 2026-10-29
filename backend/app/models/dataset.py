from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.app.core.database import Base

class DatasetMetadata(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    columns_json = Column(Text, nullable=False)
    null_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)
    summary_stats_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CropObservation(Base):
    __tablename__ = "crop_observations"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, nullable=True)
    farm_id = Column(String(50), nullable=True)
    growth_cycle = Column(Float, nullable=True)
    yield_val = Column(Float, nullable=True)
    sunlight_hours = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    average_temperature = Column(Float, nullable=True)
    drought_days = Column(Float, nullable=True)
    flood_days = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    soil_ph = Column(Float, nullable=True)
    co2_concentration = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

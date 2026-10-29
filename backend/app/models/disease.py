from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.app.core.database import Base

class ScanHistoryRecord(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), default="guest_farmer")
    image_filename = Column(String(255), nullable=True)
    image_data_url = Column(Text, nullable=True)
    condition_detected = Column(String(150), default="Healthy Cotton Crop")
    confidence_score = Column(Float, default=0.85)
    severity_level = Column(String(50), default="Low")
    diagnostic_report = Column(Text, nullable=False)
    immediate_actions = Column(Text, nullable=True)
    preventive_measures = Column(Text, nullable=True)
    detection_engine = Column(String(100), default="GeminiMultimodalVision")
    created_at = Column(DateTime, default=datetime.utcnow)

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.app.core.database import Base

class FarmerUser(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(150), default="शेतकरी मित्र")
    location = Column(String(200), default="छत्रपती संभाजीनगर")
    location_name = Column(String(200), default="छत्रपती संभाजीनगर (Chh. Sambhajinagar)")
    latitude = Column(Float, default=19.8762)
    longitude = Column(Float, default=75.3433)
    contact_number = Column(String(50), nullable=True)
    land_acres = Column(Float, default=2.0)
    auth_provider = Column(String(50), default="local")
    google_sub = Column(String(150), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

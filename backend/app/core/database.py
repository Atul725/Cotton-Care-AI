from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

connect_args = {"check_same_thread": False, "timeout": 20} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.app.models import farmer, dataset, prediction, disease, analytics, weather
    from sqlalchemy import text, inspect
    Base.metadata.create_all(bind=engine)

    # Safe additive schema migration for existing SQLite database
    with engine.connect() as conn:
        try:
            insp = inspect(conn)
            existing_cols = [c["name"] for c in insp.get_columns("farmers")]
            if "latitude" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN latitude FLOAT DEFAULT 19.8762"))
            if "longitude" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN longitude FLOAT DEFAULT 75.3433"))
            if "location_name" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN location_name VARCHAR(200) DEFAULT 'छत्रपती संभाजीनगर (Chh. Sambhajinagar)'"))
            if "email" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN email VARCHAR(200)"))
            if "password_hash" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN password_hash VARCHAR(255)"))
            if "auth_provider" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'"))
            if "google_sub" not in existing_cols:
                conn.execute(text("ALTER TABLE farmers ADD COLUMN google_sub VARCHAR(150)"))
            conn.commit()
        except Exception as e:
            conn.rollback()
    
    # Seed default user if not exists
    from backend.app.core.security import hash_password
    db = SessionLocal()
    try:
        user = db.query(farmer.FarmerUser).filter_by(identifier="demo_farmer").first()
        if not user:
            demo_user = farmer.FarmerUser(
                identifier="demo_farmer",
                email="demo@cottoncare.ai",
                password_hash=hash_password("demo123"),
                name="शेतकरी मित्र (Ramesh Patil)",
                location="छत्रपती संभाजीनगर (Chh. Sambhajinagar)",
                location_name="छत्रपती संभाजीनगर (Chh. Sambhajinagar)",
                latitude=19.8762,
                longitude=75.3433,
                contact_number="+91 98765 43210",
                land_acres=4.5,
                auth_provider="demo"
            )
            db.add(demo_user)
            db.commit()
        else:
            # Ensure demo_farmer has coordinates and password populated
            if user.latitude is None:
                user.latitude = 19.8762
            if user.longitude is None:
                user.longitude = 75.3433
            if not user.location_name:
                user.location_name = user.location or "छत्रपती संभाजीनगर (Chh. Sambhajinagar)"
            if not user.password_hash:
                user.password_hash = hash_password("demo123")
            if not user.email:
                user.email = "demo@cottoncare.ai"
            db.commit()
    finally:
        db.close()

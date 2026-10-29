import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.endpoints import router as api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("cottoncare_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    import sys, os
    is_testing = os.environ.get("TESTING") == "1" or "pytest" in sys.modules
    logger.info("Initializing CottonCare AI Database and Models...")
    init_db()
    if not is_testing:
        logger.info("Starting Weather Monitoring Scheduler...")
        from backend.app.services.scheduler_service import start_weather_scheduler, stop_weather_scheduler
        start_weather_scheduler()
    logger.info("CottonCare AI Backend Ready on %s", settings.API_V1_STR)
    yield
    if not is_testing:
        logger.info("Stopping Weather Monitoring Scheduler...")
        stop_weather_scheduler()
    logger.info("Shutting down CottonCare AI Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "CottonCare AI Backend — High-performance REST APIs for cotton yield prediction, "
        "agricultural analytics, crop disease diagnosis, agronomic recommendations, and voice assistance."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration - supports localhost, local LAN IPs (Wi-Fi testing from phone), and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$|^https://.*\.vercel\.app$|^https://.*\.netlify\.app$|^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global sanitized exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled Exception at %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again shortly.",
            "path": request.url.path
        }
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

# Production Dockerfile for CottonCare AI FastAPI Backend & Weather Scheduler
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (build-essential for C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend /app/backend
COPY models /app/models
COPY data /app/data

# Ensure data and upload directories exist
RUN mkdir -p /app/data/uploads /app/models

# Expose port (Render/Railway default is PORT env or 8000)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Run with single Uvicorn worker to ensure single instance of APScheduler
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]

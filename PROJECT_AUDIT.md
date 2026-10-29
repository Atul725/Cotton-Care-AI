# Project Audit & Technical Assessment Report

**Project Title:** Increasing Yield of Cotton Plant Using AI  
**Application Name:** CottonCare AI  
**Academic Affiliation:** B.Tech Project in AI & Data Science / Computer Science & Engineering, Maharashtra Institute of Technology (MIT), Chhatrapati Sambhajinagar (Aurangabad)  
**Authors:** Nilesh Suresh Sonawane (BT31079), Atul Raju Suradkar (BT31081), Dinesh Nagorao Thadke (BT31087)  
**Project Guide:** Dr. Prachi Deshpande  
**Date of Audit:** October 17, 2026  
**Audit Status:** Comprehensive Initial Inspection Completed  

---

## 1. Executive Summary

This audit assesses the codebase, datasets, models, configurations, and architectural alignment of the **CottonCare AI** project against the B.Tech project report titled *“Increasing Yield of Cotton Plant Using AI”*.

The user requested a transformation of the initial prototype into a complete, professional, modular web application using a **FastAPI backend (Python, SQLAlchemy, Pydantic, Scikit-learn, SQLite)** and a **React + Vite + TypeScript + Tailwind CSS** frontend, incorporating genuine machine learning yield prediction, multimodal disease inspection, agricultural analytics, smart recommendations, and a multilingual voice-enabled assistant.

---

## 2. Inventory of Existing Workspace & Assets

### 2.1 Workspace Structure
- **Root Directory:** `c:\Users\hp\Downloads\CottonCare_Local_Flask_Converted`
  - `.venv/`: Python virtual environment containing Python 3.12 packages (`Flask`, `google-genai`, `pillow`, `requests`, `python-dotenv`).
  - `.env`: Contains `GEMINI_API_KEY` and `FLASK_SECRET_KEY`.
  - `CottonCare_Local_Flask/`: Legacy Flask prototype directory.
    - `app.py`: 366-line Flask monolithic application containing routing, SQLite database access, heuristic calculations, and Google GenAI API calls.
    - `cotton_care_pro.db`: SQLite database storing `users` and `scan_history`.
    - `requirements.txt`: Initial dependency specification (`Flask`, `python-dotenv`, `Pillow`, `requests`, `google-genai`).
    - `static/app.js`: Client-side logic for SpeechSynthesis, Web Speech API (`SpeechRecognition`), chat AJAX, and yield estimation requests.
    - `static/style.css`: Dark-themed CSS stylesheet with desktop and mobile media queries.
    - `templates/base.html`, `templates/app.html`, `templates/login.html`: Jinja2 templates.

### 2.2 Datasets & Reference Documents in Downloads
- **Agricultural Dataset:** `c:\Users\hp\Downloads\cotton_growth_cycle_data.csv`
  - **Record Count:** 80,000 real agricultural records (~7.67 MB).
  - **Attributes:** `Farm_ID`, `Planting_Date`, `Harvest_Date`, `Growth_Cycle` (days), `Yield` (target), `Sunlight_Hours`, `Precipitation` (rainfall mm), `Average_Temperature` (°C), `Drought_Days`, `Flood_Days`, `Soil_Moisture` (%), `Soil_pH`, `CO2_Concentration`, `Harvest_Year`, `Sunlight_Level`, `Flood_Level`, `Drought_Level`.
  - **Validation:** Matches the environmental, soil, weather, and yield factors documented in Chapter 4 of the project report.
- **Reference Project Documentation:**
  - `c:\Users\hp\Downloads\cotton report .3.0.0.docx` / `Cotton crop report.docx`: Formal project report detailing requirements, high-level design (HLD), low-level design (LLD), database schemas, parameter definitions, and ML methodology.
  - `c:\Users\hp\Downloads\AI CROP COTTON MP 1.0.pptx`: Presentation slide deck summarizing the project objectives and architecture.
  - `c:\Users\hp\Downloads\A-comprehensive-survey-on-cotton.pdf`: Literature survey reference.

### 2.3 Model Audit & Findings
- **Cotton Disease Model Check:**
  - A search for `*.keras`, `*.h5`, `*.pkl`, `*.joblib`, `*.pt`, or `*.onnx` was conducted in the workspace and Downloads folder.
  - **Result:** No pre-trained local convolutional neural network (e.g., `cotton_disease_model.keras` or `cotton_disease_model.h5`) exists in the directory.
  - **Analysis:** The existing Flask app performed leaf disease inspection by routing uploaded leaf photos directly to the Gemini Vision API via prompt engineering (`google-genai` SDK) rather than running a local offline Keras model.
  - **Action Plan:** The system will provide a modular disease detection service that supports:
    1. Online multimodal diagnostic evaluation with Google Gemini Vision (tested and working).
    2. An extensible offline CNN model loader (`cotton_disease_model.keras`) that loads and infers if a validated weights file is supplied by the user, and transparently flags "awaiting validated offline model" if absent, strictly avoiding fake predictions.
- **Yield Prediction Model Check:**
  - The legacy `app.py` used a hardcoded linear heuristic formula: `total = round((bolls * base) * acres, 1)`.
  - **Action Plan:** A real machine-learning regression pipeline (Linear Regression, Random Forest Regressor, and Gradient Boosting) will be trained, evaluated with MAE, RMSE, and R² on held-out test splits from `cotton_growth_cycle_data.csv`, serialized (`joblib`), and served via FastAPI inference endpoints.

---

## 3. Feature-by-Feature Status Matrix

| Module / Feature | Report / Prompt Specification | Existing Prototype Status | Root Causes / Limitations | Target Implementation |
|---|---|---|---|---|
| **Yield Prediction** | Real ML regression with validated inputs (temperature, rain, soil pH, moisture, cycle) | ❌ Partial (heuristic only) | Hardcoded formula based on boll counts; no trained model pipeline | Scikit-learn Random Forest & Linear Regression trained on 80,000 dataset rows; metrics MAE, RMSE, R² reported; saved artifact pipeline |
| **Dataset Upload & Analytics** | Upload CSV, preview, detect nulls/duplicates, statistical summaries, correlation charts | ❌ Missing | No file upload/data processing engine in legacy app | Dedicated upload endpoint with Pandas validation, preview, missing value imputation, summary statistics, and Recharts visualizations |
| **Disease Detection** | Leaf image upload, preprocessing, diagnostic report, limitations, advice | ⚠️ Partial (Gemini Vision only) | No local `.keras` weights found; raw exception crashes on 503 | Hybrid engine: Gemini Vision with structured prompts + modular offline CNN loader if `.keras` provided; safe fallbacks |
| **Voice & Chat Assistant** | Multilingual (EN, HI, MR), text fallback, STT & TTS, robust AI resilience | ⚠️ Buggy (503 & mic network error) | Gemini 503 unhandled; Web Speech API network error on Chrome speech servers; raw stack traces dumped | FastAPI chat endpoint with bounded retries, jittered backoff, fallback models (`gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`), sanitized farmer-friendly errors, enhanced mic error UX |
| **Smart Recommendations** | Irrigation, fertilizer, nutrient scheduling, soil health | ⚠️ Basic heuristic | Fixed lookup rules based on days elapsed | Multi-factor agronomic recommendation engine integrating soil type, water source, weather, and crop growth stage |
| **Farmer Profile & History** | SQLite database, user profile, scan history, prediction logs | ⚠️ Basic SQLite | Hardcoded raw SQL in Flask, no ORM, no pagination, no dataset metadata | SQLAlchemy ORM models (`FarmerUser`, `CropData`, `AnalysisResult`, `DatasetMetadata`, `ScanHistory`), Pydantic schemas, full CRUD |
| **UI / UX Design** | Modern, responsive, cotton-themed, 11 dedicated views | ❌ Outdated Flask tabs | Cluttered header with fake version badge, legacy CSS | React (Vite + TypeScript + Tailwind CSS) with 11 distinct pages, responsive sidebar, Recharts, Lucide icons, accessible contrast |

---

## 4. Root Cause Analysis of Specific Reported Issues

### Issue 1: Gemini AI 503 UNAVAILABLE & Model Demand
- **Root Cause:**
  1. Default model in `app.py` was `gemini-3.6-flash`, but Google Gemini free/developer tier periodically experiences capacity spikes returning HTTP 503 `UNAVAILABLE` ("The model is overloaded. Please try again later").
  2. Legacy code lacked application-level bounded retries with exponential backoff and jitter.
  3. No secondary fallback models were configured.
  4. Raw API errors and stack traces were sent to the client, breaking the UI.
- **Resolution Strategy:**
  - Configure primary model `gemini-3.8-flash` with dynamic fallback chain (`gemini-3.6-flash`, `gemini-3.5-flash`).
  - Configure `google-genai` `HttpRetryOptions` and application-level retry with exponential backoff and jitter for retryable status codes (408, 429, 500, 502, 503, 504).
  - Catch distinct error categories (auth, quota, overload, timeout, model-not-found) and return localized, friendly agricultural guidance without exposing secrets or stack traces.

### Issue 2 & 3: Chatbot Microphone Displays `Microphone error: network`
- **Root Cause:**
  1. The browser's `SpeechRecognition` / `webkitSpeechRecognition` relies on Google's cloud speech recognition service (`https://www.google.com/speech-api/...`).
  2. If the user's internet connection drops, firewall/corporate proxy blocks Google speech endpoints, or the browser has disabled cloud speech services, the browser fires `error: 'network'`.
  3. A network error in speech recognition is distinct from microphone hardware permission; the previous code assumed any failure was generic and displayed an unhelpful raw string.
  4. On browsers without Web Speech API (e.g., Firefox desktop), the feature silently failed or failed on click.
- **Resolution Strategy:**
  - Robust detection of `window.SpeechRecognition` and `window.webkitSpeechRecognition`.
  - Check microphone hardware access via `navigator.mediaDevices.getUserMedia` before or during initiation.
  - Distinguish `network`, `not-allowed`, `no-speech`, `audio-capture`, and `service-not-allowed` with tailored, actionable advice.
  - Provide an always-accessible text input fallback so the farmer is never blocked.

### Issue 4: Header Text & Legacy Version Badges
- **Root Cause:**
  - `templates/app.html` contained `<div class="eyebrow">NEXT-GEN FARMING PLATFORM</div>` and `<span class="pill">{{ t.version_tag }}</span>` (`✨ v3.0.0 Pro Max | All Features Active`), creating a cluttered, non-professional appearance.
- **Resolution Strategy:**
  - Remove `NEXT-GEN FARMING PLATFORM` and the version tag badge from all templates and frontend components, replacing them with clean, clean agricultural branding.

---

## 5. Development Milestones & Verification Status

1. **Phase 1: Project Audit & Report Synthesis** — ✅ **COMPLETE**
   - Detailed audit in `PROJECT_AUDIT.md`, architecture documented in `docs/ARCHITECTURE.md`.
2. **Phase 2: Architecture & Requirement Mapping** — ✅ **COMPLETE**
   - Clean mapping of report sections to FastAPI REST routes and React frontend views.
3. **Phase 3: Core Backend & Database Setup** — ✅ **COMPLETE**
   - FastAPI 0.143.3 initialized with SQLite SQLAlchemy ORM, Pydantic schemas, CORS, and seeded demo farmer.
   - Endpoint `/api/health` tested and verified running live.
4. **Phase 4: Dataset Ingestion & Agricultural Analytics** — ✅ **COMPLETE**
   - Upload & validation of 80,000-row agricultural dataset (`data/cotton_growth_cycle_data.csv`).
   - Summary statistics, correlation analysis, and preview endpoints active.
5. **Phase 5: Machine Learning Yield Prediction Pipeline** — ✅ **COMPLETE**
   - **Trained Model:** `RandomForestRegressor` on 64,000 training rows, evaluated on 16,000 held-out test rows.
   - **Metrics:** MAE = 3.34 kg/acre, RMSE = 4.72 kg/acre, R² = 0.9788 (Random Forest) vs. R² = 0.8872 (Linear Regression baseline).
   - Saved at `models/cotton_yield_model.joblib` (158 MB) and `models/scaler.joblib`.
   - Verified live via `/api/yield/predict` and `/api/yield/model-info`.
6. **Phase 6: Disease Detection & Voice Assistant** — ✅ **COMPLETE**
   - Multimodal Gemini Vision diagnostic engine with bounded retries, jittered backoff, and 3-model failover (`gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`).
   - Graceful fallback advisory engine for offline/network issues without exposing API keys or stack traces.
   - Web Speech API integration in React with distinct error recovery for network, permission, and no-speech states.
7. **Phase 7: Frontend Application & UI Polish** — ✅ **COMPLETE**
   - React 18 + TypeScript + Vite + Tailwind CSS with 11 responsive pages.
   - Chunk splitting configured in `vite.config.ts`, reducing main JS bundle from 656 kB to 108 kB (zero build warnings).
   - Removed `NEXT-GEN FARMING PLATFORM` and fake version badges.
8. **Phase 8: Comprehensive Testing & Setup Documentation** — ✅ **COMPLETE**
   - Pytest suite: **6/6 PASSED** (`test_health_check`, `test_yield_model_info`, `test_yield_prediction`, `test_recommendations`, `test_farmer_profile`, `test_analytics_summary`).
   - Complete `README.md` created with exact Windows startup commands.
   - `.env.example` and `.gitignore` created.


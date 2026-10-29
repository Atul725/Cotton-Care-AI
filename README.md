# CottonCare AI – Smart Cotton Farming Platform

> **B.Tech AI & Data Science Project**  
> **Project Title:** Increasing Yield of Cotton Plant Using AI  
> **Institution:** MIT Chhatrapati Sambhajinagar  
> **Technology Stack:** FastAPI (Python 3.12), React 18, TypeScript, Vite, Tailwind CSS, scikit-learn, Google Gemini AI

---

## 🌟 Overview

CottonCare AI is a comprehensive agricultural decision-support web platform designed for cotton farmers and agronomists. It combines machine-learning-based yield prediction trained on 80,000 real observations, multimodal crop disease diagnosis, rule-based agronomic recommendations, live regional weather and APMC market prices, and a multilingual conversational assistant (English, Marathi, Hindi).

---

## 🚀 Quick Start on Windows

### Prerequisites
- Windows 10/11
- Python 3.12 (already configured in `.venv`)
- Portable Node.js v20.18.0 (included in `tools/node/`, no admin rights needed)

---

### Step 1: Start the FastAPI Backend

Open a PowerShell terminal in the project directory (`c:\Users\hp\Downloads\CottonCare_Local_Flask_Converted`):

```powershell
& .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 2: Start the React Frontend

Open a **second** PowerShell terminal in the project directory:

```powershell
$nodeDir = (Resolve-Path "tools\node").Path
$env:PATH = "$nodeDir;" + $env:PATH
cd frontend
..\tools\node\npm.cmd run dev
```

- **Frontend URL:** [http://127.0.0.1:5173](http://127.0.0.1:5173)

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser (Google Chrome or Microsoft Edge recommended for voice features).

---

## 📊 Machine Learning Model Details

| Attribute | Value |
|---|---|
| **Model Type** | `RandomForestRegressor` (n_estimators=100) |
| **Dataset** | 80,000 Cotton Crop Observations (`data/cotton_growth_cycle_data.csv`) |
| **Training Split** | 80% Train (64,000 rows) / 20% Test (16,000 rows) |
| **R² Score** | **0.9788** (97.88% variance explained) |
| **MAE** | **3.34 kg/acre** |
| **RMSE** | **4.72 kg/acre** |
| **Baseline Model** | Linear Regression: R²=0.8872, MAE=8.72 |
| **Top Influencing Factor** | Sunlight Hours (53.12%), Drought Days (19.48%), Flood Days (18.76%) |

To retrain the model at any time:
```powershell
& .\.venv\Scripts\python.exe backend\app\ml\train_model.py
```

---

## 🧪 Running Backend Automated Tests

```powershell
& .\.venv\Scripts\python.exe -m pytest backend\tests -v
```

All 12 test suites verify:
- System health and database connectivity
- ML model loading and metadata integrity
- Real-time yield prediction calculations
- Growth-stage agronomic recommendations
- Farmer profile persistence
- Agricultural dataset statistical summaries
- Predefined cotton farming locations endpoint (19 districts)
- Live Open-Meteo weather forecast parsing & structure
- Weather alert deduplication and 6-hour cooldown window
- Notification preference reading and updating
- Device token lifecycle (register & deactivate)
- Weather-adaptive agronomic recommendations (rain, wind, heat, fungal risk)

---

## 📁 Project Architecture

```
CottonCare_Local_Flask_Converted/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py         # REST endpoints (health, predict, assistant, etc.)
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings reading .env
│   │   │   ├── database.py          # SQLite engine & session management
│   │   │   └── gemini_client.py     # Resilient Gemini AI client with 3-model failover
│   │   ├── ml/
│   │   │   └── train_model.py       # Standalone training script
│   │   ├── models/                  # SQLAlchemy ORM models (Farmer, Prediction, Scan, Dataset)
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   └── services/                # Yield, dataset, disease, assistant & advisory logic
│   └── tests/
│       └── test_api.py              # Pytest test suite (6 passing tests)
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Sidebar, MetricCard
│   │   ├── pages/                   # 11 React pages (Dashboard, Yield, Disease, Chat, etc.)
│   │   ├── hooks/useSpeech.ts       # Web Speech API hook (voice recognition & TTS)
│   │   └── services/api.ts          # Fully typed API client
│   └── vite.config.ts               # Proxy configuration & bundle chunking
├── data/
│   ├── cotton_growth_cycle_data.csv # 80,000 crop observation dataset
│   └── cottoncare.db                # SQLite database
├── models/
│   ├── cotton_yield_model.joblib    # Trained Random Forest regressor (158 MB)
│   ├── scaler.joblib                # Standard scaler
│   └── model_metadata.json          # Verified training metrics
└── tools/node/                      # Portable Node.js v20.18.0 & npm
mobile/
├── App.tsx                          # Root component with navigation container
├── index.js                         # Expo entry point
├── app.json                         # Expo config (Android package: com.cottoncare.ai)
├── package.json                     # Expo ~51, React Native 0.74.5, React Navigation v6
├── tsconfig.json                    # Strict TypeScript config
├── .env / .env.example              # API URL (10.0.2.2:8000 for emulator)
├── assets/                          # icon.png, splash.png, adaptive-icon.png
└── src/
    ├── types/index.ts               # API type definitions
    ├── constants/theme.ts           # Design tokens (colors, spacing)
    ├── services/api.ts              # Mobile API client
    ├── components/                  # ScreenWrapper, Header, Card, Button
    ├── navigation/RootNavigator.tsx # Stack + Bottom Tab navigation
    └── screens/                     # 8 screens (Welcome, Dashboard, Yield, Disease,
                                     #            Assistant, Recommendations, History, Settings)
```

---

---

## 📱 Mobile Application (React Native + Expo)

The `mobile/` folder contains a complete Android/iOS app with **8 screens** (Welcome, Dashboard, Yield Prediction, Disease Detection, AI Assistant, Recommendations, History, Settings) connected to the same FastAPI backend.

### Mobile Prerequisites
- **Expo Go** installed on your Android phone (free from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Your phone and PC on the **same Wi-Fi network**
- Portable Node.js is already included in `tools/node/` — no extra installation needed

### Step 3: Start the Expo Mobile Dev Server

Open a **third** PowerShell terminal in the project directory:

```powershell
$nodeDir = (Resolve-Path "tools\node").Path
$env:PATH = "$nodeDir;" + $env:PATH
cd mobile
..\tools\node\node_modules\.bin\expo.cmd start
```

A QR code will appear in the terminal.

### Step 4: Open on Your Android Phone

1. Open **Expo Go** on your phone.
2. Tap **"Scan QR code"** and point it at the QR code in your terminal.
3. The CottonCare AI app will load automatically.

### Networking Configuration

| Device | Value to set in `mobile/.env` |
|---|---|
| Android Emulator (Android Studio) | `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` ← already the default |
| Physical Android phone (same Wi-Fi) | `EXPO_PUBLIC_API_URL=http://192.168.1.X:8000/api` — find your PC IP with `ipconfig` |

### Open in Android Emulator (Optional)

With Android Studio installed and an AVD created:

```powershell
# While `expo start` is running in the terminal, press the 'a' key
# Expo will open the app in your Android emulator automatically
```

### Mobile Build Evidence

| Step | Result |
|---|---|
| `npm install` (1109 packages) | ✅ Exit code 0 |
| TypeScript check (`tsc --noEmit`) | ✅ Exit code 0, zero errors |
| Expo export (iOS + Android bundles) | ✅ 2289 modules bundled, output in `mobile/dist/` |

> Device/emulator test pending user action — open Expo Go and scan the QR code.

---

## 🛡️ Security & Privacy
- Gemini API keys are kept strictly in `.env` and **never** exposed to the frontend.
- Network and model errors fail over to pre-compiled agricultural rules with farmer-friendly guidance in English, Hindi, and Marathi.
- Offline model fallback ready for edge deployments.

# CottonCare AI — End-to-End Deployment & Device Testing Guide

This guide provides instructions to run, test on physical Android devices, build installable Android APKs, and deploy both the website and backend to 24/7 cloud servers.

---

## 1. Current Verified Local Network Configuration

- **Host Machine Wi-Fi IP (Live):** `10.12.107.109`
- **FastAPI Backend (Live):** `http://10.12.107.109:8000` (API Base: `/api`)
- **React Web App (Live):** `http://10.12.107.109:5173`
- **Interactive Swagger Documentation:** `http://10.12.107.109:8000/docs`
- **Health Check:** `http://10.12.107.109:8000/api/health`
- **Generated Standalone Android APK:** [Direct Download Link](https://expo.dev/artifacts/eas/vBRidEaZGrNCOFCmjD2nP8DFbKq9X6PUpTpn22AyqmI.apk)

---

## 2. Testing on Real Physical Android Phones (via Expo Go)

### Prerequisites
1. Ensure your Android phone and your Windows computer are connected to the **same Wi-Fi network**.
2. Install **Expo Go** from Google Play Store on your Android phone.

### Windows Firewall Rule (One-Time Setup if connection is blocked)
If your phone cannot reach `http://10.101.248.109:8000`, allow ports 8000 and 5173 through Windows Defender Firewall:
```powershell
New-NetFirewallRule -DisplayName "CottonCare AI LAN Ports" -Direction Inbound -LocalPort 8000,5173 -Protocol TCP -Action Allow
```

### Starting the Expo Mobile Dev Server
Open PowerShell in the workspace:
```powershell
$nodeDir = "c:\Users\hp\Downloads\CottonCare_Local_Flask_Converted\tools\node"
$env:PATH = "$nodeDir;" + $env:PATH
cd mobile
& "$nodeDir\node.exe" node_modules\@expo\cli\build\bin\cli start
```

### Running on Phone
1. Open the **Expo Go** app on your Android phone.
2. Tap **"Scan QR code"** and scan the QR code displayed in your terminal.
3. The app bundle will download directly to your phone.
4. **Testing Features on Phone:**
   - **Dashboard:** Check current weather widget and farm status.
   - **Weather Screen:** Tap location button to get GPS coordinates or choose from 19 cotton districts.
   - **Yield Prediction:** Adjust soil parameters and tap "Predict Yield".
   - **Recommendations:** View stage-wise fertilizer schedules and weather warnings.
   - **Settings Screen:** You can verify or change the Backend API URL directly at runtime (defaults to `http://10.101.248.109:8000/api`). Tap **"Send Test Notification"** to test the push notification pipeline.

> [!NOTE]
> **Expo Go Push Notification Limitation:**  
> Expo Go (SDK 51) restricts background push notifications within the Expo Go sandbox client. The in-app "Send Test Notification" button registers your token and dispatches to the backend successfully. For native background push banners, build the standalone APK as described below.

---

## 3. Generating Standalone Android APK (.apk) via EAS

The project is fully pre-configured with `mobile/eas.json` for building an installable `.apk` file (no Google Play Store account required).

### Step 1: Install & Verify EAS CLI
EAS CLI is already installed locally. You can execute it via:
```powershell
$nodeDir = "c:\Users\hp\Downloads\CottonCare_Local_Flask_Converted\tools\node"
& "$nodeDir\eas.cmd" --version
```

### Step 2: Log In to Expo (Free Account)
Sign up for a free account at [expo.dev](https://expo.dev) if you don't already have one, then log in:
```powershell
& "$nodeDir\eas.cmd" login
```

### Step 3: Configure Project ID
Link the project to your Expo account:
```powershell
cd mobile
& "$nodeDir\eas.cmd" project:init
```

### Step 4: Run the Android APK Cloud Build
```powershell
cd mobile
& "$nodeDir\eas.cmd" build --platform android --profile preview
```
- EAS Cloud will compile your React Native project into a standalone Android APK.
- Once finished (typically 5–10 minutes), EAS prints a download link and a QR code.
- Open the link on your Android phone, download the `.apk`, and tap **Install** (enable "Install from unknown sources" if prompted).

---

## 4. Website Production Hosting (Vercel / Netlify)

The React web application in `frontend/` is optimized for production and includes client-side routing rewrites (`frontend/vercel.json` and `frontend/public/_redirects`).

### Option A: Vercel Deployment
1. Install Vercel CLI or connect your GitHub repository to [vercel.com](https://vercel.com).
2. Configure project settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-service.onrender.com/api` (your deployed backend URL)
4. Deploy!

### Option B: Netlify Deployment
1. Connect your repository to [netlify.com](https://netlify.com).
2. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-service.onrender.com/api`

---

## 5. 24/7 Backend & Weather Scheduler Deployment (Render / Railway)

Because CottonCare AI uses an in-process background scheduler (APScheduler) and an SQLite database:
1. **Single Worker:** Always run with `--workers 1` so you do not spawn duplicate schedulers.
2. **Persistent Disk:** Attach a 1 GB persistent volume mounted at `/data` so `cottoncare.db` and uploaded photos persist across server restarts.

### 1-Click / Blueprint Deployment on Render (render.yaml included)
A production `render.yaml` and `Dockerfile` are already included in the workspace root.
1. Push this codebase to your GitHub/GitLab repository.
2. In [render.com](https://render.com), click **New +** -> **Blueprint**.
3. Select your repository.
4. Render automatically configures:
   - **Service 1:** `cottoncare-api` (Python Web Service with 1 GB persistent disk mounted at `/data`).
   - **Service 2:** `cottoncare-web` (Static Site built from `frontend/`).
5. Set `GEMINI_API_KEY` in Render environment variables for the backend.
6. The weather monitor will automatically poll every 30 minutes 24/7 and deliver push notifications to all registered farmer devices!

# System Architecture & Requirements Mapping

**Project Title:** Increasing Yield of Cotton Plant Using AI  
**Application Name:** CottonCare AI  
**Institutional Reference:** Maharashtra Institute of Technology (MIT), Chhatrapati Sambhajinagar  

---

## 1. Architectural Overview

CottonCare AI adopts a clean, decoupled architecture:
1. **Frontend Presentation Layer:** Built with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **Recharts** (analytical dashboards), and **Lucide React** icons.
2. **Backend Application Layer:** Powered by **FastAPI** with asynchronous request routing, Pydantic v2 schemas for strict input/output validation, and automatic OpenAPI/Swagger documentation at `/docs`.
3. **Data Persistence Layer:** Managed by **SQLAlchemy ORM** targeting **SQLite** locally (`data/cottoncare.db`), architected with connection abstractions to seamlessly support PostgreSQL for enterprise deployments.
4. **Machine Learning & Agronomic Layer:** Scikit-learn regression models (Random Forest, Linear Regression, Gradient Boosting) trained on 80,000 agricultural observations from `cotton_growth_cycle_data.csv`, serialized pipelines, and rule-based agronomic expert advisors.
5. **Multimodal AI & Speech Layer:** Google Gemini 3.8/3.6/3.5 Flash integration with bounded retries, jittered backoff, timeout limits, and resilient speech recognition/synthesis fallbacks.

```
+-----------------------------------------------------------------------------------+
|                            REACT + VITE FRONTEND                                  |
|   11 Pages: Landing, Dashboard, Yield Prediction, Dataset Upload, Analytics,     |
|   Disease Detection, Voice Assistant, Recommendations, History, About, Settings  |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JSON & Multipart)
                                           v
+-----------------------------------------------------------------------------------+
|                             FASTAPI BACKEND SERVICE                               |
|   - CORS Middleware      - Pydantic Validation      - Exception Handlers          |
|   - REST API Routes:                                                              |
|     * /api/health            * /api/datasets/upload     * /api/analytics/summary  |
|     * /api/yield/predict     * /api/yield/model-info    * /api/disease/predict    |
|     * /api/assistant/chat    * /api/recommendations     * /api/history            |
+------------------+-----------------------+---------------------+------------------+
                   |                       |                     |
                   v                       v                     v
          +-----------------+    +-------------------+   +--------------------+
          | SQLALCHEMY ORM  |    | MACHINE LEARNING  |   | GOOGLE GEMINI AI   |
          | SQLite Database |    | Scikit-Learn RF   |   | Multimodal Vision  |
          | - Farmers/Users |    | - Yield Pipeline  |   | Resilient Assistant|
          | - Datasets/Files|    | - MAE / RMSE / R² |   | Jittered Retries   |
          | - Scan History  |    | - Feature Import. |   | 3-Model Fallback   |
          | - Predictions   |    +-------------------+   +--------------------+
          +-----------------+
```

---

## 2. Report Requirements to Application Mapping

| Chapter / Section in Report | Requirement in Report | Implementation in CottonCare AI |
|---|---|---|
| **Ch. 1: Introduction** | Need for scientific farming, cotton yield improvement, reducing risk | Landing page with value proposition, dashboard with live weather & risk indicators |
| **Ch. 3.1: HLD** | User input, data processing, data analysis, visualization, database | Modular FastAPI services + React views with real-time feedback |
| **Ch. 3.2.1: Farmer Table** | Store farmer user details (name, location, phone, land) | SQLAlchemy model `FarmerUser`, Pydantic `FarmerProfileSchema`, `/api/users/profile` |
| **Ch. 3.2.2: Crop Data Table** | Soil type, N, P, K, rainfall, temperature, season | SQLAlchemy model `CropObservation`, manual & CSV ingestion pipelines |
| **Ch. 3.2.3: Season Table** | Crop cycles, sowing/harvest dates, growth stages | Growth stage scheduler (`Growth_Cycle` 1-180 days, vegetative, flowering, maturity) |
| **Ch. 3.2.4: Analysis Results Table**| Store key yield factors, analysis results, recommendations | SQLAlchemy model `AnalysisResultRecord` and `YieldPredictionRecord` |
| **Ch. 3.3: Algorithms** | Linear Regression, Random Forest for cotton yield prediction | `backend/app/ml/train_model.py`: trains & compares Linear Regression & Random Forest; reports MAE, RMSE, R²; saves `joblib` artifacts |
| **Ch. 3.3: Disease Detection** | Cotton leaf disease detection via image processing | `backend/app/services/disease_service.py`: multimodal Gemini Vision analysis with confidence & structured guidelines + pluggable offline CNN loader |
| **Ch. 3.3: Voice & Speech** | Voice input in Marathi, Hindi, English, TTS response | Web Speech API with detailed network/permission diagnostic fallbacks, SpeechSynthesis, and backend `/api/assistant/chat` |
| **Ch. 4: Dataset** | 80,000 real records with weather, soil, flood, drought, yield | `data/cotton_growth_cycle_data.csv` used for ML model training, exploratory analysis, and demo upload |
| **Ch. 5: Visualizations** | Graphs of rainfall vs yield, temperature, nutrients, feature importance | Interactive Recharts visualizations on Analytics and Yield Prediction pages |
| **Ch. 5: Recommendations** | Irrigation scheduling, fertilizer dosage, pest management | Rule-based agronomic engine cross-referenced with soil type and growth stage |

import json
import logging
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_PATH = BASE_DIR / "data" / "cotton_growth_cycle_data.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLUMNS = [
    "Growth_Cycle",
    "Sunlight_Hours",
    "Precipitation",
    "Average_Temperature",
    "Drought_Days",
    "Flood_Days",
    "Soil_Moisture",
    "Soil_pH",
    "CO2_Concentration"
]
TARGET_COLUMN = "Yield"

def clean_and_prepare_data(csv_path: Path):
    logger.info("Loading agricultural dataset from %s", csv_path)
    df = pd.read_csv(csv_path)
    
    # Strip any BOM or whitespace from column headers
    df.columns = [col.strip().lstrip('\ufeff') for col in df.columns]
    
    required_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing from dataset. Available: {df.columns.tolist()}")

    # Select only required numerical features
    clean_df = df[required_cols].copy()
    initial_rows = len(clean_df)
    
    # Drop missing values and duplicates
    clean_df = clean_df.dropna()
    clean_df = clean_df.drop_duplicates()
    logger.info("Cleaned dataset: %d rows retained from %d initial rows", len(clean_df), initial_rows)
    
    X = clean_df[FEATURE_COLUMNS]
    y = clean_df[TARGET_COLUMN]
    return X, y, clean_df

def train_and_evaluate():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    X, y, df = clean_and_prepare_data(DATA_PATH)
    
    # Train / Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    logger.info("Split: %d training samples, %d test samples", len(X_train), len(X_test))

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Baseline Model: Linear Regression
    logger.info("Evaluating Baseline: Linear Regression...")
    lr = LinearRegression()
    lr.fit(X_train_scaled, y_train)
    lr_preds = lr.predict(X_test_scaled)
    lr_mae = float(mean_absolute_error(y_test, lr_preds))
    lr_rmse = float(np.sqrt(mean_squared_error(y_test, lr_preds)))
    lr_r2 = float(r2_score(y_test, lr_preds))
    logger.info("Linear Regression -> MAE: %.2f, RMSE: %.2f, R²: %.4f", lr_mae, lr_rmse, lr_r2)

    # 2. Main Model: Random Forest Regressor
    logger.info("Training Random Forest Regressor (n_estimators=100, max_depth=16)...")
    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=16,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)  # Tree-based models work directly on raw features
    rf_preds = rf.predict(X_test)
    rf_mae = float(mean_absolute_error(y_test, rf_preds))
    rf_rmse = float(np.sqrt(mean_squared_error(y_test, rf_preds)))
    rf_r2 = float(r2_score(y_test, rf_preds))
    logger.info("Random Forest Regressor -> MAE: %.2f, RMSE: %.2f, R²: %.4f", rf_mae, rf_rmse, rf_r2)

    # Feature Importances
    importances = rf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    feature_importances = [
        {"feature": FEATURE_COLUMNS[i], "importance": round(float(importances[i]), 4)}
        for i in sorted_idx
    ]
    logger.info("Top factors affecting yield: %s", feature_importances[:4])

    # Save artifacts
    model_path = MODEL_DIR / "cotton_yield_model.joblib"
    scaler_path = MODEL_DIR / "scaler.joblib"
    metadata_path = MODEL_DIR / "model_metadata.json"

    joblib.dump(rf, model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        "model_name": "RandomForestRegressor",
        "target_variable": TARGET_COLUMN,
        "dataset_rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "features": FEATURE_COLUMNS,
        "metrics": {
            "random_forest": {
                "mae": round(rf_mae, 2),
                "rmse": round(rf_rmse, 2),
                "r2_score": round(rf_r2, 4)
            },
            "linear_regression_baseline": {
                "mae": round(lr_mae, 2),
                "rmse": round(lr_rmse, 2),
                "r2_score": round(lr_r2, 4)
            }
        },
        "feature_importances": feature_importances,
        "training_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "provenance": "Trained on 80,000 real agricultural records from cotton_growth_cycle_data.csv"
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Artifacts saved successfully in %s", MODEL_DIR)
    return metadata

if __name__ == "__main__":
    train_and_evaluate()

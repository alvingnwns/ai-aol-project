"""
Train XGBoost model for crop yield prediction.
Dataset: yield_df.csv
Target: hg/ha_yield
Features: Area, Item, Year, average_rain_fall_mm_per_year, pesticides_tonnes, avg_temp
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "data", "yield_df.csv")
MODEL_DIR  = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── Load & Clean ─────────────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
df = df.drop(columns=[col for col in df.columns if "Unnamed" in col])
df.columns = ["area", "item", "year", "yield_hg_ha",
              "rainfall_mm", "pesticides_tonnes", "avg_temp"]
df = df.dropna()

print(f"Dataset shape: {df.shape}")

# ── Encode Categoricals ──────────────────────────────────────────────────────
le_area = LabelEncoder()
le_item = LabelEncoder()

df["area_enc"] = le_area.fit_transform(df["area"])
df["item_enc"] = le_item.fit_transform(df["item"])

# ── Features & Target ────────────────────────────────────────────────────────
FEATURES = ["area_enc", "item_enc", "year", "rainfall_mm", "pesticides_tonnes", "avg_temp"]
TARGET   = "yield_hg_ha"

X = df[FEATURES]
y = np.log1p(df[TARGET])          # log-transform (right-skewed distribution)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train XGBoost ────────────────────────────────────────────────────────────
model = XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=7,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
)

print("Training XGBoost model...")
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=100,
)

# ── Evaluate ─────────────────────────────────────────────────────────────────
y_pred_log  = model.predict(X_test)
y_pred      = np.expm1(y_pred_log)
y_true      = np.expm1(y_test)

mae  = mean_absolute_error(y_true, y_pred)
rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2   = r2_score(y_true, y_pred)

print(f"\n── Evaluation (original scale) ──")
print(f"  MAE  : {mae:,.2f} hg/ha")
print(f"  RMSE : {rmse:,.2f} hg/ha")
print(f"  R²   : {r2:.4f}")

# ── Save Artifacts ────────────────────────────────────────────────────────────
joblib.dump(model,   os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
joblib.dump(le_area, os.path.join(MODEL_DIR, "le_area.pkl"))
joblib.dump(le_item, os.path.join(MODEL_DIR, "le_item.pkl"))

# Save label classes for frontend dropdowns
area_classes = le_area.classes_.tolist()
item_classes = le_item.classes_.tolist()

import json
meta = {
    "area_classes": area_classes,
    "item_classes": item_classes,
    "features": FEATURES,
    "metrics": {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)},
}
with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"\nModel artifacts saved to: {MODEL_DIR}")
print(f"  - xgboost_yield_model.pkl")
print(f"  - le_area.pkl")
print(f"  - le_item.pkl")
print(f"  - model_meta.json")

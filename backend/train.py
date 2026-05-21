"""
Train hybrid model for crop yield prediction.
Architecture: per-(area, item) Linear Trend on year  +  XGBoost on residuals

The linear trend component allows extrapolation up to 100+ years into the future.
XGBoost handles the climate/agricultural feature impact (rainfall, pesticides, temp).

Prediction formula:
    log(1 + yield) = linear_trend(year | area, item) + xgb_residual(climate features)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from scipy.stats import linregress
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
print(f"Year range in data: {df['year'].min()} – {df['year'].max()}")

# ── Encode Categoricals ──────────────────────────────────────────────────────
le_area = LabelEncoder()
le_item = LabelEncoder()

df["area_enc"] = le_area.fit_transform(df["area"])
df["item_enc"] = le_item.fit_transform(df["item"])

# ── Stage 1: Fit per-(area, item) linear trend on log(yield) ~ year ──────────
df["log_yield"] = np.log1p(df["yield_hg_ha"])

# Cap: maximum ±1.5% annual change in log-yield space.
# This prevents unrealistic exponential explosion over long horizons (100 years),
# while still reflecting genuine upward/downward trends.
# At 1.5%/year: yield can at most grow ~4.5x or shrink to ~22% over 100 years.
MAX_LOG_SLOPE = 0.015

# Item-level fallback trend (used when a group has too few rows)
item_trends: dict = {}
for itm, grp in df.groupby("item"):
    v = grp[["year", "log_yield"]].dropna()
    if len(v) >= 3:
        slope, intercept, *_ = linregress(v["year"], v["log_yield"])
        slope = max(-MAX_LOG_SLOPE, min(MAX_LOG_SLOPE, slope))
        # Re-anchor intercept through the data centroid after slope capping
        intercept = float(v["log_yield"].mean()) - slope * float(v["year"].mean())
    else:
        slope, intercept = 0.0, float(v["log_yield"].mean()) if len(v) else 0.0
    item_trends[itm] = (float(intercept), float(slope))

# Global fallback
global_slope, global_intercept, *_ = linregress(df["year"], df["log_yield"])
global_slope = max(-MAX_LOG_SLOPE, min(MAX_LOG_SLOPE, float(global_slope)))
global_intercept = float(df["log_yield"].mean()) - global_slope * float(df["year"].mean())

# Per-(area, item) trend
trend_params: dict = {}
for (area, itm), grp in df.groupby(["area", "item"]):
    v = grp[["year", "log_yield"]].dropna()
    if len(v) >= 5:
        slope, intercept, *_ = linregress(v["year"], v["log_yield"])
        slope = max(-MAX_LOG_SLOPE, min(MAX_LOG_SLOPE, slope))
        # Re-anchor intercept through the data centroid after slope capping
        intercept = float(v["log_yield"].mean()) - slope * float(v["year"].mean())
    elif itm in item_trends:
        intercept, slope = item_trends[itm]
    else:
        intercept, slope = float(global_intercept), float(global_slope)
    trend_params[(area, itm)] = (float(intercept), float(slope))

print(f"Fitted linear trends for {len(trend_params)} (area, item) groups.")

# ── Stage 2: Compute detrended residuals ─────────────────────────────────────
def _trend(row):
    key = (row["area"], row["item"])
    intercept, slope = trend_params.get(key, (float(global_intercept), float(global_slope)))
    return intercept + slope * row["year"]

df["trend_pred"] = df.apply(_trend, axis=1)
df["residual"]   = df["log_yield"] - df["trend_pred"]

# ── Stage 3: Train XGBoost on residuals (no year feature) ────────────────────
# year is excluded — its temporal effect is fully captured by the linear trend
FEATURES = ["area_enc", "item_enc", "rainfall_mm", "pesticides_tonnes", "avg_temp"]
TARGET   = "residual"

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train XGBoost ────────────────────────────────────────────────────────────
model = XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
)

print("Training XGBoost residual model...")
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=100,
)

# ── Evaluate (reconstruct full prediction on test set) ────────────────────────
# Retrieve trend for test rows using original df index
test_idx      = X_test.index
trend_test    = df.loc[test_idx, "trend_pred"].values
resid_pred    = model.predict(X_test)
log_pred_test = trend_test + resid_pred

y_pred = np.expm1(log_pred_test)
y_true = np.expm1(df.loc[test_idx, "log_yield"].values)

mae  = mean_absolute_error(y_true, y_pred)
rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2   = r2_score(y_true, y_pred)

print(f"\n── Evaluation (original scale) ──")
print(f"  MAE  : {mae:,.2f} hg/ha")
print(f"  RMSE : {rmse:,.2f} hg/ha")
print(f"  R²   : {r2:.4f}")

# ── Save Artifacts ────────────────────────────────────────────────────────────
joblib.dump(model,        os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
joblib.dump(le_area,      os.path.join(MODEL_DIR, "le_area.pkl"))
joblib.dump(le_item,      os.path.join(MODEL_DIR, "le_item.pkl"))
joblib.dump(trend_params, os.path.join(MODEL_DIR, "trend_params.pkl"))

# Global fallback stored separately for new (area, item) pairs
global_trend = {"intercept": float(global_intercept), "slope": float(global_slope)}
joblib.dump(global_trend, os.path.join(MODEL_DIR, "global_trend.pkl"))

# Save label classes for frontend dropdowns
area_classes = le_area.classes_.tolist()
item_classes = le_item.classes_.tolist()

meta = {
    "area_classes": area_classes,
    "item_classes": item_classes,
    "features": FEATURES,
    "year_train_min": int(df["year"].min()),
    "year_train_max": int(df["year"].max()),
    "metrics": {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)},
}
with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"\nModel artifacts saved to: {MODEL_DIR}")
print(f"  - xgboost_yield_model.pkl  (XGBoost residual model)")
print(f"  - trend_params.pkl          (per-(area,item) linear trend params)")
print(f"  - global_trend.pkl          (global fallback trend)")
print(f"  - le_area.pkl")
print(f"  - le_item.pkl")
print(f"  - model_meta.json")

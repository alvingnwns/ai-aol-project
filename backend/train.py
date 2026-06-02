"""
Train hybrid model for crop yield prediction.
Architecture: per-(area, item) Linear Trend on year  +  XGBoost on residuals

The linear trend component allows extrapolation up to 100+ years into the future.
XGBoost handles the climate/agricultural feature impact (rainfall, pesticides, temp).

Prediction formula:
    log(1 + yield) = linear_trend(year | area, item) + xgb_residual(climate features)

Evaluation strategy (leak-free):
    - Temporal split: train on years < SPLIT_YEAR, test on years >= SPLIT_YEAR
    - LabelEncoders & linear trends are fit ONLY on train data
    - Final production model is refit on ALL data after evaluation
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from scipy.stats import linregress
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "data", "yield_df.csv")
MODEL_DIR  = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── Config ───────────────────────────────────────────────────────────────────
SPLIT_YEAR    = 2010   # train < 2010, test >= 2010 (~last 4 years as holdout)
MAX_LOG_SLOPE = 0.015  # cap annual trend to ±1.5% to prevent long-horizon explosion
FEATURES      = ["area_enc", "item_enc", "rainfall_mm", "pesticides_tonnes", "avg_temp"]

# ── Load & Clean ─────────────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
df = df.drop(columns=[col for col in df.columns if "Unnamed" in col])
df.columns = ["area", "item", "year", "yield_hg_ha",
              "rainfall_mm", "pesticides_tonnes", "avg_temp"]
df = df.dropna().reset_index(drop=True)
df["log_yield"] = np.log1p(df["yield_hg_ha"])

print(f"Dataset shape: {df.shape}")
print(f"Year range: {df['year'].min()} – {df['year'].max()}")

# ── Temporal Split ────────────────────────────────────────────────────────────
train_df = df[df["year"] < SPLIT_YEAR].copy()
test_df  = df[df["year"] >= SPLIT_YEAR].copy()
print(f"Train: {len(train_df)} rows ({train_df['year'].min()}–{train_df['year'].max()})")
print(f"Test : {len(test_df)} rows ({test_df['year'].min()}–{test_df['year'].max()})")


# ═══════════════════════════════════════════════════════════════════════════════
# Helper: fit full pipeline (encoders + trends + XGBoost) on a given dataframe
# ═══════════════════════════════════════════════════════════════════════════════
def fit_pipeline(fit_df: pd.DataFrame, eval_df: pd.DataFrame | None = None,
                 verbose: bool = True):
    """
    Fit LabelEncoders, linear trends, and XGBoost on fit_df.
    If eval_df is provided, returns evaluation metrics on it (leak-free).
    Returns: (model, le_area, le_item, trend_params, global_trend_dict, metrics_dict)
    """
    # ── Encode categoricals (fit only on fit_df) ──────────────────────────────
    le_a = LabelEncoder().fit(fit_df["area"])
    le_i = LabelEncoder().fit(fit_df["item"])
    fit_df = fit_df.copy()
    fit_df["area_enc"] = le_a.transform(fit_df["area"])
    fit_df["item_enc"] = le_i.transform(fit_df["item"])

    # ── Fit linear trends (only on fit_df) ───────────────────────────────────
    # Global fallback
    g_slope, g_intercept, *_ = linregress(fit_df["year"], fit_df["log_yield"])
    g_slope = float(np.clip(g_slope, -MAX_LOG_SLOPE, MAX_LOG_SLOPE))
    g_intercept = float(fit_df["log_yield"].mean()) - g_slope * float(fit_df["year"].mean())

    # Item-level fallback
    item_trends: dict = {}
    for itm, grp in fit_df.groupby("item"):
        v = grp[["year", "log_yield"]].dropna()
        if len(v) >= 3:
            s, i, *_ = linregress(v["year"], v["log_yield"])
            s = float(np.clip(s, -MAX_LOG_SLOPE, MAX_LOG_SLOPE))
            i = float(v["log_yield"].mean()) - s * float(v["year"].mean())
        else:
            s = 0.0
            i = float(v["log_yield"].mean()) if len(v) else 0.0
        item_trends[itm] = (i, s)

    # Per-(area, item) trend
    t_params: dict = {}
    for (area, itm), grp in fit_df.groupby(["area", "item"]):
        v = grp[["year", "log_yield"]].dropna()
        if len(v) >= 5:
            s, i, *_ = linregress(v["year"], v["log_yield"])
            s = float(np.clip(s, -MAX_LOG_SLOPE, MAX_LOG_SLOPE))
            i = float(v["log_yield"].mean()) - s * float(v["year"].mean())
        elif itm in item_trends:
            i, s = item_trends[itm]
        else:
            i, s = g_intercept, g_slope
        t_params[(area, itm)] = (i, s)

    if verbose:
        print(f"  Fitted {len(t_params)} (area, item) linear trends.")

    def apply_trend(row, params, g_i, g_s):
        i, s = params.get((row["area"], row["item"]), (g_i, g_s))
        return i + s * row["year"]

    # ── Compute residuals on fit_df ───────────────────────────────────────────
    fit_df["trend_pred"] = fit_df.apply(lambda r: apply_trend(r, t_params, g_intercept, g_slope), axis=1)
    fit_df["residual"]   = fit_df["log_yield"] - fit_df["trend_pred"]

    # ── Train XGBoost on residuals ────────────────────────────────────────────
    X_train = fit_df[FEATURES]
    y_train = fit_df["residual"]

    xgb = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    if verbose:
        print("  Training XGBoost...")
    xgb.fit(X_train, y_train, verbose=100 if verbose else False)

    # ── Evaluate on eval_df (if provided) ────────────────────────────────────
    metrics = {}
    if eval_df is not None:
        eval_df = eval_df.copy()

        # Handle unseen categories in test (use most-frequent known class as fallback)
        def safe_transform(le, series):
            known = set(le.classes_)
            fallback = le.classes_[0]
            return le.transform([x if x in known else fallback for x in series])

        eval_df["area_enc"] = safe_transform(le_a, eval_df["area"])
        eval_df["item_enc"] = safe_transform(le_i, eval_df["item"])

        eval_df["trend_pred"] = eval_df.apply(
            lambda r: apply_trend(r, t_params, g_intercept, g_slope), axis=1
        )

        X_test    = eval_df[FEATURES]
        resid_hat = xgb.predict(X_test)
        log_hat   = eval_df["trend_pred"].values + resid_hat

        y_pred = np.expm1(log_hat)
        y_true = np.expm1(eval_df["log_yield"].values)

        mae  = mean_absolute_error(y_true, y_pred)
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2   = r2_score(y_true, y_pred)
        metrics = {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)}

        if verbose:
            print(f"\n── Holdout evaluation (years {eval_df['year'].min()}–{eval_df['year'].max()}) ──")
            print(f"  MAE  : {mae:,.2f} hg/ha")
            print(f"  RMSE : {rmse:,.2f} hg/ha")
            print(f"  R²   : {r2:.4f}")

    g_trend = {"intercept": g_intercept, "slope": g_slope}
    return xgb, le_a, le_i, t_params, g_trend, metrics


# ═══════════════════════════════════════════════════════════════════════════════
# Phase 1 — Leak-free evaluation on temporal holdout
# ═══════════════════════════════════════════════════════════════════════════════
print("\n══ Phase 1: Holdout evaluation (leak-free) ══")
_, _, _, _, _, eval_metrics = fit_pipeline(train_df, eval_df=test_df, verbose=True)

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 2 — Final production model trained on ALL data
# ═══════════════════════════════════════════════════════════════════════════════
print("\n══ Phase 2: Final model (all data) ══")
model, le_area, le_item, trend_params, global_trend, _ = fit_pipeline(df, eval_df=None, verbose=True)

# ── Save Artifacts ────────────────────────────────────────────────────────────
joblib.dump(model,        os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
joblib.dump(le_area,      os.path.join(MODEL_DIR, "le_area.pkl"))
joblib.dump(le_item,      os.path.join(MODEL_DIR, "le_item.pkl"))
joblib.dump(trend_params, os.path.join(MODEL_DIR, "trend_params.pkl"))
joblib.dump(global_trend, os.path.join(MODEL_DIR, "global_trend.pkl"))

meta = {
    "area_classes"  : le_area.classes_.tolist(),
    "item_classes"  : le_item.classes_.tolist(),
    "features"      : FEATURES,
    "year_train_min": int(df["year"].min()),
    "year_train_max": int(df["year"].max()),
    "split_year"    : SPLIT_YEAR,
    "metrics"       : eval_metrics,   # from holdout, not training data
}
with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"\nModel artifacts saved to: {MODEL_DIR}")
print(f"  - xgboost_yield_model.pkl  (production model, fit on all data)")
print(f"  - trend_params.pkl")
print(f"  - global_trend.pkl")
print(f"  - le_area.pkl / le_item.pkl")
print(f"  - model_meta.json          (metrics from temporal holdout)")
print(f"\nHoldout metrics: {eval_metrics}")

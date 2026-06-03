"""
PanenAI - Train hybrid model for Indonesian crop production prediction.
Architecture: per-(Provinsi, Jenis_Tanaman) Linear Trend + XGBoost on residuals.

Target: Produksi (ton/tahun) — total production per province & crop type.
Data: BPS + BMKG Indonesia, 2000-2015, 34 provinsi, 7 jenis tanaman.

Prediction formula:
    log(1 + produksi) = linear_trend(tahun | provinsi, tanaman) + xgb_residual(iklim)

Evaluation strategy (leak-free):
    - Temporal split: train < SPLIT_YEAR, test >= SPLIT_YEAR
    - LabelEncoders & trends fit ONLY on train data
    - Final model refit on ALL data after evaluation
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

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "prediksi_hasil_panen_2000-2015.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

SPLIT_YEAR    = 2013
MAX_LOG_SLOPE = 0.05
FEATURES      = ["provinsi_enc", "tanaman_enc", "curah_hujan_mm", "hari_hujan",
                 "suhu_rata_c", "tekanan_udara_mb", "penyinaran_matahari_pct"]

df = pd.read_csv(DATA_PATH)
df.columns = ["Provinsi", "Tahun", "Jenis_Tanaman", "Produksi",
              "curah_hujan_mm", "hari_hujan", "suhu_rata_c",
              "tekanan_udara_mb", "penyinaran_matahari_pct"]
df = df.dropna().reset_index(drop=True)
df["log_produksi"] = np.log1p(df["Produksi"])

print(f"Dataset: {df.shape[0]} baris | Tahun: {df['Tahun'].min()}-{df['Tahun'].max()}")
print(f"Provinsi: {df['Provinsi'].nunique()} | Tanaman: {df['Jenis_Tanaman'].nunique()}")

train_df = df[df["Tahun"] < SPLIT_YEAR].copy()
test_df  = df[df["Tahun"] >= SPLIT_YEAR].copy()
print(f"Train: {len(train_df)} baris ({train_df['Tahun'].min()}-{train_df['Tahun'].max()})")
print(f"Test : {len(test_df)} baris  ({test_df['Tahun'].min()}-{test_df['Tahun'].max()})")


def fit_pipeline(fit_df, eval_df=None, verbose=True):
    le_p = LabelEncoder().fit(fit_df["Provinsi"])
    le_t = LabelEncoder().fit(fit_df["Jenis_Tanaman"])
    fit_df = fit_df.copy()
    fit_df["provinsi_enc"] = le_p.transform(fit_df["Provinsi"])
    fit_df["tanaman_enc"]  = le_t.transform(fit_df["Jenis_Tanaman"])

    # Global fallback trend
    g_slope, _, *_ = linregress(fit_df["Tahun"], fit_df["log_produksi"])
    g_slope = float(np.clip(g_slope, -MAX_LOG_SLOPE, MAX_LOG_SLOPE))
    g_intercept = float(fit_df["log_produksi"].mean()) - g_slope * float(fit_df["Tahun"].mean())

    # Per-tanaman fallback
    tanaman_trends = {}
    for tnn, grp in fit_df.groupby("Jenis_Tanaman"):
        v = grp[["Tahun", "log_produksi"]].dropna()
        if len(v) >= 3:
            s, i, *_ = linregress(v["Tahun"], v["log_produksi"])
            s = float(np.clip(s, -MAX_LOG_SLOPE, MAX_LOG_SLOPE))
            i = float(v["log_produksi"].mean()) - s * float(v["Tahun"].mean())
        else:
            s, i = 0.0, float(v["log_produksi"].mean()) if len(v) else 0.0
        tanaman_trends[tnn] = (i, s)

    # Per-(Provinsi, Jenis_Tanaman) trend
    t_params = {}
    for (prov, tnn), grp in fit_df.groupby(["Provinsi", "Jenis_Tanaman"]):
        v = grp[["Tahun", "log_produksi"]].dropna()
        if len(v) >= 5:
            s, i, *_ = linregress(v["Tahun"], v["log_produksi"])
            s = float(np.clip(s, -MAX_LOG_SLOPE, MAX_LOG_SLOPE))
            i = float(v["log_produksi"].mean()) - s * float(v["Tahun"].mean())
        elif tnn in tanaman_trends:
            i, s = tanaman_trends[tnn]
        else:
            i, s = g_intercept, g_slope
        t_params[(prov, tnn)] = (i, s)

    if verbose:
        print(f"  Fitted {len(t_params)} (Provinsi, Tanaman) trends.")

    def apply_trend(row):
        i, s = t_params.get((row["Provinsi"], row["Jenis_Tanaman"]), (g_intercept, g_slope))
        return i + s * row["Tahun"]

    fit_df["trend_pred"] = fit_df.apply(apply_trend, axis=1)
    fit_df["residual"]   = fit_df["log_produksi"] - fit_df["trend_pred"]

    X_train = fit_df[FEATURES]
    y_train = fit_df["residual"]

    xgb = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        random_state=42,
        n_jobs=-1,
    )
    if verbose:
        print("  Training XGBoost...")
    xgb.fit(X_train, y_train, verbose=False)

    metrics = {}
    if eval_df is not None:
        eval_df = eval_df.copy()

        def safe_transform(le, series):
            known = set(le.classes_)
            fallback = le.classes_[0]
            return le.transform([x if x in known else fallback for x in series])

        eval_df["provinsi_enc"] = safe_transform(le_p, eval_df["Provinsi"])
        eval_df["tanaman_enc"]  = safe_transform(le_t, eval_df["Jenis_Tanaman"])
        eval_df["trend_pred"]   = eval_df.apply(apply_trend, axis=1)

        resid_hat = xgb.predict(eval_df[FEATURES])
        log_hat   = eval_df["trend_pred"].values + resid_hat
        y_pred    = np.expm1(log_hat)
        y_true    = np.expm1(eval_df["log_produksi"].values)

        mae  = mean_absolute_error(y_true, y_pred)
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2   = r2_score(y_true, y_pred)
        metrics = {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)}

        if verbose:
            print(f"\n-- Holdout ({eval_df['Tahun'].min()}-{eval_df['Tahun'].max()}) --")
            print(f"  MAE  : {mae:,.2f} ton")
            print(f"  RMSE : {rmse:,.2f} ton")
            print(f"  R2   : {r2:.4f}")

    g_trend = {"intercept": g_intercept, "slope": g_slope}
    return xgb, le_p, le_t, t_params, g_trend, metrics


print("\n== Phase 1: Holdout evaluation ==")
_, _, _, _, _, eval_metrics = fit_pipeline(train_df, eval_df=test_df, verbose=True)

print("\n== Phase 2: Final model (all data) ==")
model, le_prov, le_tan, trend_params, global_trend, _ = fit_pipeline(df, eval_df=None, verbose=True)

joblib.dump(model,        os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
joblib.dump(le_prov,      os.path.join(MODEL_DIR, "le_area.pkl"))
joblib.dump(le_tan,       os.path.join(MODEL_DIR, "le_item.pkl"))
joblib.dump(trend_params, os.path.join(MODEL_DIR, "trend_params.pkl"))
joblib.dump(global_trend, os.path.join(MODEL_DIR, "global_trend.pkl"))

# Compute per-(Provinsi, Tanaman) feature bounds for outlier detection
_CLIMATE_FEATS = ["curah_hujan_mm", "hari_hujan", "suhu_rata_c",
                  "tekanan_udara_mb", "penyinaran_matahari_pct"]
bounds = {}
tanaman_fb = {}
for tnn, grp in df.groupby("Jenis_Tanaman"):
    tanaman_fb[tnn] = {}
    for feat in _CLIMATE_FEATS:
        v = grp[feat].dropna()
        q1, q3 = v.quantile(0.25), v.quantile(0.75)
        iqr = q3 - q1
        tanaman_fb[tnn][feat] = (float(q1 - 1.5 * iqr), float(q3 + 1.5 * iqr))

for (prov, tnn), grp in df.groupby(["Provinsi", "Jenis_Tanaman"]):
    bounds[f"{prov}|{tnn}"] = {}
    for feat in _CLIMATE_FEATS:
        v = grp[feat].dropna()
        if len(v) >= 8:
            q1, q3 = v.quantile(0.25), v.quantile(0.75)
            iqr = q3 - q1
            if iqr == 0:
                center = float(q1)
                lo = center * 0.70 if center > 0 else center * 1.30 if center < 0 else float("-inf")
                hi = center * 1.30 if center > 0 else center * 0.70 if center < 0 else float("inf")
            else:
                lo, hi = float(q1 - 1.5 * iqr), float(q3 + 1.5 * iqr)
        elif tnn in tanaman_fb:
            lo, hi = tanaman_fb[tnn][feat]
        else:
            lo, hi = float("-inf"), float("inf")
        bounds[f"{prov}|{tnn}"][feat] = (lo, hi)

joblib.dump(bounds, os.path.join(MODEL_DIR, "feature_bounds.pkl"))

# Compute per-(Provinsi, Tanaman) production stats for reference
prod_stats = {}
for (prov, tnn), grp in df.groupby(["Provinsi", "Jenis_Tanaman"]):
    v = grp["Produksi"].dropna()
    prod_stats[f"{prov}|{tnn}"] = {
        "mean": round(float(v.mean()), 2),
        "min":  round(float(v.min()), 2),
        "max":  round(float(v.max()), 2),
        "p25":  round(float(v.quantile(0.25)), 2),
        "p75":  round(float(v.quantile(0.75)), 2),
    }

# Compute feature ranges per (Provinsi, Tanaman) for frontend guidance
feature_ranges = {}
for (prov, tnn), grp in df.groupby(["Provinsi", "Jenis_Tanaman"]):
    feature_ranges[f"{prov}|{tnn}"] = {}
    for feat in _CLIMATE_FEATS:
        v = grp[feat].dropna()
        feature_ranges[f"{prov}|{tnn}"][feat] = {
            "min": round(float(v.min()), 2),
            "max": round(float(v.max()), 2),
            "mean": round(float(v.mean()), 2),
        }

meta = {
    "provinsi_classes": le_prov.classes_.tolist(),
    "tanaman_classes":  le_tan.classes_.tolist(),
    "features":         FEATURES,
    "tahun_min":        int(df["Tahun"].min()),
    "tahun_max":        int(df["Tahun"].max()),
    "split_year":       SPLIT_YEAR,
    "metrics":          eval_metrics,
    "prod_stats":       prod_stats,
    "feature_ranges":   feature_ranges,
}
with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)

print(f"\nArtifak tersimpan di: {MODEL_DIR}")
print(f"Holdout metrics: {eval_metrics}")

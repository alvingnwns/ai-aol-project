import os
import json
import joblib
import numpy as np
import pandas as pd

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR  = os.path.join(BASE_DIR, "models")

# Load once on startup
_model   = joblib.load(os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
_le_area = joblib.load(os.path.join(MODEL_DIR, "le_area.pkl"))
_le_item = joblib.load(os.path.join(MODEL_DIR, "le_item.pkl"))

with open(os.path.join(MODEL_DIR, "model_meta.json"), "r") as f:
    _meta = json.load(f)

# ── Per-(area, item) IQR-based outlier bounds ─────────────────────────────────
_FEATS = ["rainfall_mm", "pesticides_tonnes", "avg_temp"]
_FEAT_LABELS = {
    "rainfall_mm"       : "Rainfall",
    "pesticides_tonnes" : "Pesticides",
    "avg_temp"          : "Temperature",
}


def _compute_bounds() -> dict:
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "yield_df.csv"))
    df = df.drop(columns=[c for c in df.columns if "Unnamed" in c])
    df.columns = ["area", "item", "year", "yield_hg_ha",
                  "rainfall_mm", "pesticides_tonnes", "avg_temp"]
    df = df.dropna()

    # Item-level fallback (used when a group has too few rows)
    item_fb: dict = {}
    for itm, grp in df.groupby("item"):
        item_fb[itm] = {}
        for feat in _FEATS:
            v = grp[feat].dropna()
            q1, q3 = v.quantile(0.25), v.quantile(0.75)
            iqr = q3 - q1
            item_fb[itm][feat] = (float(q1 - 1.5 * iqr), float(q3 + 1.5 * iqr))

    bounds: dict = {}
    for (area, itm), grp in df.groupby(["area", "item"]):
        bounds[(area, itm)] = {}
        for feat in _FEATS:
            v = grp[feat].dropna()
            if len(v) >= 8:
                q1, q3 = v.quantile(0.25), v.quantile(0.75)
                iqr = q3 - q1
                if iqr == 0:
                    # Constant feature in this group — use ±30% relative tolerance
                    center = float(q1)
                    if center > 0:
                        lo, hi = center * 0.70, center * 1.30
                    elif center < 0:
                        lo, hi = center * 1.30, center * 0.70
                    else:
                        lo, hi = -float("inf"), float("inf")
                else:
                    lo, hi = float(q1 - 1.5 * iqr), float(q3 + 1.5 * iqr)
            elif itm in item_fb:
                lo, hi = item_fb[itm][feat]
            else:
                lo, hi = -float("inf"), float("inf")
            bounds[(area, itm)][feat] = (lo, hi)

    return bounds


_bounds = _compute_bounds()


def predict_yield(area: str, item: str, year: int,
                  rainfall_mm: float, pesticides_tonnes: float,
                  avg_temp: float) -> dict:
    """Run inference and return predicted yield with outlier detection."""
    known_areas = _le_area.classes_.tolist()
    known_items = _le_item.classes_.tolist()

    if area not in known_areas:
        raise ValueError(f"Unknown area: '{area}'. Must be one of the trained areas.")
    if item not in known_items:
        raise ValueError(f"Unknown item: '{item}'. Must be one of the trained crops.")

    # ── Outlier / crop-failure check ──────────────────────────────────────────
    outlier_features: list = []
    key = (area, item)
    if key in _bounds:
        checks = {
            "rainfall_mm"       : rainfall_mm,
            "pesticides_tonnes" : pesticides_tonnes,
            "avg_temp"          : avg_temp,
        }
        for feat, val in checks.items():
            lo, hi = _bounds[key][feat]
            if val < lo or val > hi:
                outlier_features.append(_FEAT_LABELS[feat])

    area_enc = _le_area.transform([area])[0]
    item_enc = _le_item.transform([item])[0]

    X = np.array([[area_enc, item_enc, year, rainfall_mm, pesticides_tonnes, avg_temp]])
    log_pred  = _model.predict(X)[0]
    yield_val = float(np.expm1(log_pred))

    return {
        "predicted_yield_hg_ha"    : round(yield_val, 2),
        "predicted_yield_tonnes_ha": round(yield_val / 10000, 4),
        "model_r2"                 : _meta["metrics"]["R2"],
        "crop_failure"             : len(outlier_features) > 0,
        "outlier_features"         : outlier_features,
    }


def get_meta() -> dict:
    return _meta

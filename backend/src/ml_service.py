import os
import json
import joblib
import numpy as np
import pandas as pd

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

_model        = joblib.load(os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
_le_prov      = joblib.load(os.path.join(MODEL_DIR, "le_area.pkl"))
_le_tan       = joblib.load(os.path.join(MODEL_DIR, "le_item.pkl"))
_trend_params = joblib.load(os.path.join(MODEL_DIR, "trend_params.pkl"))
_global_trend = joblib.load(os.path.join(MODEL_DIR, "global_trend.pkl"))
_bounds       = joblib.load(os.path.join(MODEL_DIR, "feature_bounds.pkl"))

with open(os.path.join(MODEL_DIR, "model_meta.json"), "r", encoding="utf-8") as f:
    _meta = json.load(f)

_FEATS = ["curah_hujan_mm", "hari_hujan", "suhu_rata_c",
          "tekanan_udara_mb", "penyinaran_matahari_pct"]
_FEAT_LABELS = {
    "curah_hujan_mm"          : "Curah Hujan",
    "hari_hujan"              : "Hari Hujan",
    "suhu_rata_c"             : "Suhu Rata-rata",
    "tekanan_udara_mb"        : "Tekanan Udara",
    "penyinaran_matahari_pct" : "Penyinaran Matahari",
}


def predict_produksi(provinsi: str, jenis_tanaman: str, tahun: int,
                     curah_hujan_mm: float, hari_hujan: int,
                     suhu_rata_c: float, tekanan_udara_mb: float,
                     penyinaran_matahari_pct: float) -> dict:
    known_prov = _le_prov.classes_.tolist()
    known_tan  = _le_tan.classes_.tolist()

    if provinsi not in known_prov:
        raise ValueError(f"Provinsi tidak dikenal: '{provinsi}'.")
    if jenis_tanaman not in known_tan:
        raise ValueError(f"Jenis tanaman tidak dikenal: '{jenis_tanaman}'.")

    # Outlier check
    key_str = f"{provinsi}|{jenis_tanaman}"
    outlier_features: list = []
    if key_str in _bounds:
        checks = {
            "curah_hujan_mm"          : curah_hujan_mm,
            "hari_hujan"              : float(hari_hujan),
            "suhu_rata_c"             : suhu_rata_c,
            "tekanan_udara_mb"        : tekanan_udara_mb,
            "penyinaran_matahari_pct" : penyinaran_matahari_pct,
        }
        for feat, val in checks.items():
            lo, hi = _bounds[key_str][feat]
            if val < lo or val > hi:
                outlier_features.append(_FEAT_LABELS[feat])

    prov_enc = _le_prov.transform([provinsi])[0]
    tan_enc  = _le_tan.transform([jenis_tanaman])[0]

    key = (provinsi, jenis_tanaman)
    if key in _trend_params:
        intercept, slope = _trend_params[key]
    else:
        intercept = _global_trend["intercept"]
        slope     = _global_trend["slope"]

    trend_val = intercept + slope * tahun

    X = np.array([[prov_enc, tan_enc, curah_hujan_mm, float(hari_hujan),
                   suhu_rata_c, tekanan_udara_mb, penyinaran_matahari_pct]])
    residual  = _model.predict(X)[0]
    log_pred  = trend_val + residual
    produksi  = float(max(0.0, np.expm1(log_pred)))

    return {
        "predicted_produksi_ton": round(produksi, 2),
        "model_r2":               _meta["metrics"]["R2"],
        "crop_failure":           len(outlier_features) > 0,
        "outlier_features":       outlier_features,
    }


def get_meta() -> dict:
    return {
        "provinsi_classes": _meta["provinsi_classes"],
        "tanaman_classes":  _meta["tanaman_classes"],
        "metrics":          _meta["metrics"],
        "feature_ranges":   _meta.get("feature_ranges", {}),
    }

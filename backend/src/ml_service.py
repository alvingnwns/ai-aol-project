import os
import json
import joblib
import numpy as np

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR  = os.path.join(BASE_DIR, "models")

# Load once on startup
_model   = joblib.load(os.path.join(MODEL_DIR, "xgboost_yield_model.pkl"))
_le_area = joblib.load(os.path.join(MODEL_DIR, "le_area.pkl"))
_le_item = joblib.load(os.path.join(MODEL_DIR, "le_item.pkl"))

with open(os.path.join(MODEL_DIR, "model_meta.json"), "r") as f:
    _meta = json.load(f)


def predict_yield(area: str, item: str, year: int,
                  rainfall_mm: float, pesticides_tonnes: float,
                  avg_temp: float) -> dict:
    """Run inference and return predicted yield."""
    known_areas = _le_area.classes_.tolist()
    known_items = _le_item.classes_.tolist()

    if area not in known_areas:
        raise ValueError(f"Unknown area: '{area}'. Must be one of the trained areas.")
    if item not in known_items:
        raise ValueError(f"Unknown item: '{item}'. Must be one of the trained crops.")

    area_enc = _le_area.transform([area])[0]
    item_enc = _le_item.transform([item])[0]

    X = np.array([[area_enc, item_enc, year, rainfall_mm, pesticides_tonnes, avg_temp]])
    log_pred   = _model.predict(X)[0]
    yield_val  = float(np.expm1(log_pred))

    return {
        "predicted_yield_hg_ha"     : round(yield_val, 2),
        "predicted_yield_tonnes_ha" : round(yield_val / 10000, 4),
        "model_r2"                  : _meta["metrics"]["R2"],
    }


def get_meta() -> dict:
    return _meta

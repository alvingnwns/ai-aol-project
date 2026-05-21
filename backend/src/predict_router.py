from fastapi import APIRouter, HTTPException
from src.schemas import PredictRequest, PredictResponse, MetaResponse
from src import ml_service

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.get("/meta", response_model=MetaResponse)
def get_model_meta():
    """Return available area/item choices and model metrics."""
    return ml_service.get_meta()


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """Predict crop yield from input features."""
    try:
        result = ml_service.predict_yield(
            area=req.area,
            item=req.item,
            year=req.year,
            rainfall_mm=req.rainfall_mm,
            pesticides_tonnes=req.pesticides_tonnes,
            avg_temp=req.avg_temp,
        )
        return PredictResponse(
            predicted_yield_hg_ha=result["predicted_yield_hg_ha"],
            predicted_yield_tonnes_ha=result["predicted_yield_tonnes_ha"],
            area=req.area,
            item=req.item,
            year=req.year,
            model_r2=result["model_r2"],
            crop_failure=result["crop_failure"],
            outlier_features=result["outlier_features"],
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

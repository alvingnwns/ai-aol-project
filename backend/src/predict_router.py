from fastapi import APIRouter, HTTPException
from src.schemas import PredictRequest, PredictResponse, MetaResponse
from src import ml_service, gemini_service

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.get("/meta", response_model=MetaResponse)
def get_model_meta():
    return ml_service.get_meta()


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        result = ml_service.predict_produksi(
            provinsi=req.provinsi,
            jenis_tanaman=req.jenis_tanaman,
            tahun=req.tahun,
            curah_hujan_mm=req.curah_hujan_mm,
            hari_hujan=req.hari_hujan,
            suhu_rata_c=req.suhu_rata_c,
            tekanan_udara_mb=req.tekanan_udara_mb,
            penyinaran_matahari_pct=req.penyinaran_matahari_pct,
        )

        prediction_data = {
            "provinsi":               req.provinsi,
            "jenis_tanaman":          req.jenis_tanaman,
            "tahun":                  req.tahun,
            "predicted_produksi_ton": result["predicted_produksi_ton"],
            "curah_hujan_mm":         req.curah_hujan_mm,
            "hari_hujan":             req.hari_hujan,
            "suhu_rata_c":            req.suhu_rata_c,
            "tekanan_udara_mb":       req.tekanan_udara_mb,
            "penyinaran_matahari_pct": req.penyinaran_matahari_pct,
            "model_r2":               result["model_r2"],
            "outlier_features":       result["outlier_features"],
        }

        ai_reasoning = gemini_service.get_ai_reasoning(prediction_data)

        return PredictResponse(
            predicted_produksi_ton=result["predicted_produksi_ton"],
            provinsi=req.provinsi,
            jenis_tanaman=req.jenis_tanaman,
            tahun=req.tahun,
            model_r2=result["model_r2"],
            crop_failure=result["crop_failure"],
            outlier_features=result["outlier_features"],
            ai_reasoning=ai_reasoning,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

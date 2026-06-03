from pydantic import BaseModel, Field
from typing import Optional, List


class PredictRequest(BaseModel):
    provinsi: str = Field(..., example="JAWA BARAT")
    jenis_tanaman: str = Field(..., example="Padi")
    tahun: int = Field(..., ge=2000, le=2100, example=2025)
    curah_hujan_mm: float = Field(..., ge=0, example=1974.7)
    hari_hujan: int = Field(..., ge=0, le=366, example=61)
    suhu_rata_c: float = Field(..., example=27.18)
    tekanan_udara_mb: float = Field(..., example=1010.16)
    penyinaran_matahari_pct: float = Field(..., ge=0, le=100, example=54.4)


class PredictResponse(BaseModel):
    predicted_produksi_ton: float
    provinsi: str
    jenis_tanaman: str
    tahun: int
    model_r2: float
    crop_failure: bool = False
    outlier_features: List[str] = []
    ai_reasoning: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    prediction_context: Optional[PredictResponse] = None


class ChatResponse(BaseModel):
    reply: str


class MetaResponse(BaseModel):
    provinsi_classes: List[str]
    tanaman_classes: List[str]
    metrics: dict
    feature_ranges: Optional[dict] = None

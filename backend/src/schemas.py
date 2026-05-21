from pydantic import BaseModel, Field
from typing import Optional, List


class PredictRequest(BaseModel):
    area: str = Field(..., example="Albania")
    item: str = Field(..., example="Maize")
    year: int = Field(..., ge=1990, le=2100, example=2024)
    rainfall_mm: float = Field(..., ge=0, example=1485.0)
    pesticides_tonnes: float = Field(..., ge=0, example=121.0)
    avg_temp: float = Field(..., example=16.37)


class PredictResponse(BaseModel):
    predicted_yield_hg_ha: float
    predicted_yield_tonnes_ha: float
    area: str
    item: str
    year: int
    model_r2: float


class ChatMessage(BaseModel):
    role: str          # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    prediction_context: Optional[PredictResponse] = None


class ChatResponse(BaseModel):
    reply: str


class MetaResponse(BaseModel):
    area_classes: List[str]
    item_classes: List[str]
    metrics: dict

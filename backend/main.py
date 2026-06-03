import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.predict_router import router as predict_router
from src.chat_router import router as chat_router

load_dotenv()

app = FastAPI(
    title="PanenAI API",
    description="Prediksi Hasil Panen Indonesia — XGBoost + Gemini LLM (Data BPS & BMKG)",
    version="2.0.0",
)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(chat_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "PanenAI API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

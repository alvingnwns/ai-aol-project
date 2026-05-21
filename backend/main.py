from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.predict_router import router as predict_router
from src.chat_router import router as chat_router

app = FastAPI(
    title="CropSense API",
    description="Crop Yield Prediction API powered by XGBoost + Gemini LLM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(chat_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "CropSense API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

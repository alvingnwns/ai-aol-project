from fastapi import APIRouter, HTTPException
from src.schemas import ChatRequest, ChatResponse
from src import gemini_service

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """Chat with Gemini about crop yield predictions."""
    try:
        history = [
            {"role": m.role, "content": m.content}
            for m in (req.history or [])
        ]
        prediction_ctx = req.prediction_context.model_dump() if req.prediction_context else None
        reply = gemini_service.chat_with_gemini(
            message=req.message,
            history=history,
            prediction_context=prediction_ctx,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

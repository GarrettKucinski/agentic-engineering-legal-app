from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.models.chat import ChatRequest
from app.services.auth import get_current_user
from app.services.chat import generate_chat_stream

router = APIRouter()


@router.post("/api/chat")
async def chat(req: ChatRequest, _user_id: int = Depends(get_current_user)):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    return StreamingResponse(
        generate_chat_stream(messages, req.document_type, req.variables),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

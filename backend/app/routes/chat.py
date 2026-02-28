from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.models.chat import ChatRequest
from app.services.auth import get_current_user
from app.services.chat import generate_chat_response

router = APIRouter()


@router.post("/api/chat")
async def chat(req: ChatRequest, _user_id: int = Depends(get_current_user)):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    result = await generate_chat_response(messages, req.document_type, req.variables)
    return JSONResponse(content=result)

import json
import os
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from jose import jwt
from litellm import acompletion
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from pydantic import BaseModel, field_validator

from db import get_connection, init_db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY environment variable is required")

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30
STATIC_DIR = os.getenv("STATIC_DIR", "frontend/out")

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["Cerebras"]}}

ph = PasswordHasher()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False

CHAT_SYSTEM_PROMPT = """You are a friendly legal document assistant helping users create a Mutual Non-Disclosure Agreement (Mutual NDA) based on the Common Paper Standard v1.0.

Your job is to have a warm, professional conversation to gather the information needed to complete the NDA. Ask questions naturally, one topic at a time. Don't overwhelm the user with multiple questions at once.

The NDA requires this information:
- Party 1: full name, title/role, company name, notice address (email or postal)
- Party 2: full name, title/role, company name, notice address (email or postal)
- Purpose: what confidential information may be used for (default: "Evaluating whether to enter into a business relationship with the other party.")
- Effective Date: when the NDA starts (YYYY-MM-DD format)
- MNDA Term: either expires after N years (1-10), or continues until terminated
- Term of Confidentiality: either N years (1-10) from effective date, or in perpetuity
- Governing Law: which US state's laws govern (e.g., Delaware)
- Jurisdiction: where legal proceedings take place (e.g., courts in New Castle, DE)
- Modifications: any changes to standard terms (optional, usually none)

Start by greeting the user warmly and asking about the two parties involved. As they provide information, acknowledge it naturally and ask about the next missing pieces. When everything is gathered, confirm the details are complete and let them know they can download the NDA."""

EXTRACTION_SYSTEM_PROMPT = """You are a field extraction assistant. Extract NDA field values from the conversation below.

Rules:
- For dates, use YYYY-MM-DD format
- For mnda_term_type: use "expires" if the NDA has a fixed duration, "untilTerminated" if it continues until cancelled
- For confidentiality_term_type: use "duration" if confidentiality lasts N years, "perpetuity" if it lasts forever
- For term years: extract the integer value (1-10)
- Only populate fields that were clearly and explicitly specified in the conversation
- Leave as null if a field was not mentioned or is unclear"""


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(tz=timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: str = Header(...)) -> int:
    try:
        parts = authorization.split(None, 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )
        payload = jwt.decode(parts[1], SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: int


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class NdaFieldExtraction(BaseModel):
    purpose: Optional[str] = None
    effective_date: Optional[str] = None
    mnda_term_type: Optional[Literal["expires", "untilTerminated"]] = None
    mnda_term_years: Optional[int] = None
    confidentiality_term_type: Optional[Literal["duration", "perpetuity"]] = None
    confidentiality_term_years: Optional[int] = None
    governing_law: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1_name: Optional[str] = None
    party1_title: Optional[str] = None
    party1_company: Optional[str] = None
    party1_address: Optional[str] = None
    party2_name: Optional[str] = None
    party2_title: Optional[str] = None
    party2_company: Optional[str] = None
    party2_address: Optional[str] = None


async def generate_chat_stream(messages: list[dict]):
    conversation = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}] + messages

    # Stream the conversational response (async to avoid blocking the event loop)
    response = await acompletion(
        model=MODEL,
        messages=conversation,
        stream=True,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
        api_key=OPENROUTER_API_KEY,
    )

    full_response = ""
    async for chunk in response:
        content = chunk.choices[0].delta.content or ""
        if content:
            full_response += content
            yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

    # Extract fields from the completed conversation
    extraction_messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        *messages,
        {"role": "assistant", "content": full_response},
    ]

    field_response = await acompletion(
        model=MODEL,
        messages=extraction_messages,
        response_format=NdaFieldExtraction,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
        api_key=OPENROUTER_API_KEY,
    )

    fields = NdaFieldExtraction.model_validate_json(
        field_response.choices[0].message.content
    )
    fields_dict = {k: v for k, v in fields.model_dump().items() if v is not None}

    yield f"data: {json.dumps({'type': 'fields', 'data': fields_dict})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@app.post("/api/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    password_hash = ph.hash(req.password)
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (req.email, password_hash),
        )
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    finally:
        conn.close()
    return AuthResponse(token=create_token(user_id), user_id=user_id)


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (req.email,)
        ).fetchone()
    finally:
        conn.close()

    if row is None or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return AuthResponse(token=create_token(row["id"]), user_id=row["id"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(req: ChatRequest, _user_id: int = Depends(get_current_user)):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    return StreamingResponse(
        generate_chat_stream(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# Mount static frontend LAST so API routes take priority
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

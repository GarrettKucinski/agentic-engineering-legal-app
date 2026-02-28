import sqlite3

from fastapi import APIRouter, HTTPException, status

from app.data.users import create_user, get_user_by_email
from app.models.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth import create_token, hash_password, verify_password

router = APIRouter()


@router.post("/api/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    password_hash = hash_password(req.password)
    try:
        user_id = create_user(req.email, password_hash)
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return AuthResponse(token=create_token(user_id), user_id=user_id)


@router.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    row = get_user_by_email(req.email)
    if row is None or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return AuthResponse(token=create_token(row["id"]), user_id=row["id"])

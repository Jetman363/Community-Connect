from fastapi import APIRouter, HTTPException
from fastapi import Depends
from app.schemas import LoginRequest, TokenResponse
from app.service import auth_service
from app.db import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db_session)) -> TokenResponse:
    try:
        return await auth_service.login(session, payload.username, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/v2/login", response_model=TokenResponse)
async def login_v2(payload: LoginRequest, session: AsyncSession = Depends(get_db_session)) -> TokenResponse:
    return await login(payload, session)

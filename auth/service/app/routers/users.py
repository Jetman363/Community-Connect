from fastapi import APIRouter, HTTPException
from fastapi import Depends
from app.schemas import UserCreateRequest, UserResponse
from app.service import auth_service
from app.db import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("", response_model=UserResponse)
async def create_user(payload: UserCreateRequest, session: AsyncSession = Depends(get_db_session)) -> UserResponse:
    try:
        return await auth_service.register(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        if "UNIQUE constraint failed" in str(exc) or "unique" in str(exc).lower():
            raise HTTPException(status_code=400, detail=f"Username '{payload.username}' already exists") from exc
        raise


@router.post("/v2", response_model=UserResponse)
async def create_user_v2(payload: UserCreateRequest, session: AsyncSession = Depends(get_db_session)) -> UserResponse:
    return await create_user(payload, session)

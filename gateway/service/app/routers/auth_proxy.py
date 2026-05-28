from fastapi import APIRouter

from app.proxy_util import forward_request
from app.settings import settings

router = APIRouter()


@router.post("/login")
async def login(payload: dict) -> dict:
    return await forward_request("POST", f"{settings.auth_service_url}/v1/auth/login", json_body=payload)


@router.post("/register")
async def register(payload: dict) -> dict:
    return await forward_request("POST", f"{settings.auth_service_url}/v1/users", json_body=payload)

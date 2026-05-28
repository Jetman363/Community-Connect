import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.security import require_principal
from app.settings import settings

router = APIRouter(prefix="/ai/calls", tags=["ai-call-parser"])


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=3)
    agency_id: str = "agency-demo-001"
    call_id: str | None = None


@router.post("/parse")
async def parse_call(payload: ParseRequest, _principal: dict = Depends(require_principal)) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.call_parser_service_url}/v1/parse",
            json=payload.model_dump(),
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.get("/examples")
async def examples(_principal: dict = Depends(require_principal)) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{settings.call_parser_service_url}/v1/examples")
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

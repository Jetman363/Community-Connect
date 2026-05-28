from fastapi import APIRouter, Depends, HTTPException
import httpx
from app.settings import settings
from app.security import require_principal, require_tenant_match

router = APIRouter()


@router.get("/reports/{report_id}")
async def get_report(report_id: str, principal: dict = Depends(require_principal)) -> dict:
    principal_agency = (principal.get("attrs") or {}).get("agency_id")
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{settings.rms_service_url}/v1/reports/{report_id}",
            headers={
                "x-user-id": principal.get("sub", ""),
                "x-roles": ",".join(principal.get("roles", [])),
                "x-agency-id": principal_agency or "",
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.post("/reports")
async def create_report(payload: dict, principal: dict = Depends(require_principal)) -> dict:
    require_tenant_match(principal, payload.get("agency_id"))
    principal_agency = (principal.get("attrs") or {}).get("agency_id")
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{settings.rms_service_url}/v1/reports",
            json=payload,
            headers={
                "x-user-id": principal.get("sub", ""),
                "x-roles": ",".join(principal.get("roles", [])),
                "x-agency-id": principal_agency or "",
                "x-idempotency-key": payload.get("idempotency_key", ""),
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.post("/ai/reports/drafts")
async def create_ai_report_draft(payload: dict, principal: dict = Depends(require_principal)) -> dict:
    if principal.get("sub") != payload.get("officer_id") and "supervisor" not in principal.get("roles", []):
        raise HTTPException(status_code=403, detail="Cannot generate draft for another officer")
    require_tenant_match(principal, payload.get("agency_id"))
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(f"{settings.ai_report_service_url}/v2/reports/drafts", json=payload)
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

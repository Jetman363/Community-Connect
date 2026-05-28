"""Gateway proxy for structured incident report APIs."""

from fastapi import APIRouter, Depends, HTTPException, Request
import httpx

from app.security import require_principal, require_tenant_match
from app.settings import settings

router = APIRouter(prefix="/incident-reports", tags=["incident-reports"])


def _headers(principal: dict, request: Request) -> dict:
    agency = (principal.get("attrs") or {}).get("agency_id") or ""
    return {
        "x-user-id": principal.get("sub", ""),
        "x-user-email": principal.get("email", ""),
        "x-roles": ",".join(principal.get("roles", [])),
        "x-agency-id": agency,
        "x-forwarded-for": request.client.host if request.client else "",
    }


async def _forward(method: str, path: str, request: Request, principal: dict, json_body=None) -> dict | list:
    url = f"{settings.rms_service_url}{path}"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(method, url, json=json_body, headers=_headers(principal, request))
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    if response.status_code == 204:
        return {}
    return response.json()


@router.post("")
async def create_incident_report(payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    require_tenant_match(principal, payload.get("agency_id"))
    return await _forward("POST", "/v1/incident-reports", request, principal, payload)


@router.get("")
async def search_incident_reports(request: Request, principal: dict = Depends(require_principal)) -> list:
    qs = request.url.query
    path = f"/v1/incident-reports?{qs}" if qs else "/v1/incident-reports"
    return await _forward("GET", path, request, principal)


@router.get("/{report_id}")
async def get_incident_report(report_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    return await _forward("GET", f"/v1/incident-reports/{report_id}", request, principal)


@router.patch("/{report_id}")
async def update_incident_report(
    report_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)
) -> dict:
    return await _forward("PATCH", f"/v1/incident-reports/{report_id}", request, principal, payload)


@router.post("/{report_id}/autosave")
async def autosave_incident_report(
    report_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)
) -> dict:
    return await _forward("POST", f"/v1/incident-reports/{report_id}/autosave", request, principal, payload)


@router.post("/{report_id}/finalize")
async def finalize_incident_report(
    report_id: str, request: Request, principal: dict = Depends(require_principal)
) -> dict:
    return await _forward("POST", f"/v1/incident-reports/{report_id}/finalize", request, principal)


@router.post("/{report_id}/approve")
async def approve_incident_report(
    report_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)
) -> dict:
    return await _forward("POST", f"/v1/incident-reports/{report_id}/approve", request, principal, payload)


@router.post("/{report_id}/lock")
async def lock_incident_report(report_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    return await _forward("POST", f"/v1/incident-reports/{report_id}/lock", request, principal)


@router.get("/{report_id}/audit")
async def get_report_audit(report_id: str, request: Request, principal: dict = Depends(require_principal)) -> list:
    return await _forward("GET", f"/v1/incident-reports/{report_id}/audit", request, principal)


@router.get("/{report_id}/revisions")
async def get_report_revisions(report_id: str, request: Request, principal: dict = Depends(require_principal)) -> list:
    return await _forward("GET", f"/v1/incident-reports/{report_id}/revisions", request, principal)


@router.get("/{report_id}/export")
async def export_incident_report(report_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    return await _forward("GET", f"/v1/incident-reports/{report_id}/export", request, principal)

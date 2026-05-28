import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.security import require_principal
from app.settings import settings

router = APIRouter(prefix="/cad", tags=["cad-dispatch"])


async def _proxy(method: str, path: str, request: Request, principal: dict) -> dict | list:
    url = f"{settings.cad_dispatch_service_url}/v1{path}"
    headers = {
        "x-user-id": principal.get("sub", ""),
        "x-roles": ",".join(principal.get("roles", [])),
        "x-agency-id": (principal.get("attrs") or {}).get("agency_id", ""),
    }
    async with httpx.AsyncClient(timeout=15) as client:
        if method == "GET":
            response = await client.get(url, params=dict(request.query_params), headers=headers)
        elif method == "POST":
            body = await request.json()
            response = await client.post(url, json=body, params=dict(request.query_params), headers=headers)
        elif method == "PATCH":
            body = await request.json()
            response = await client.patch(url, json=body, params=dict(request.query_params), headers=headers)
        else:
            raise HTTPException(status_code=405, detail="Method not allowed")
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.get("/incidents")
async def list_incidents(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", "/incidents", request, principal)


@router.post("/incidents")
async def create_incident(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("POST", "/incidents", request, principal)


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", f"/incidents/{incident_id}", request, principal)


@router.patch("/incidents/{incident_id}")
async def update_incident(incident_id: str, request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("PATCH", f"/incidents/{incident_id}", request, principal)


@router.post("/incidents/{incident_id}/assign")
async def assign_unit(incident_id: str, request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("POST", f"/incidents/{incident_id}/assign", request, principal)


@router.get("/incidents/{incident_id}/recommendations")
async def recommendations(incident_id: str, request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", f"/incidents/{incident_id}/recommendations", request, principal)


@router.get("/units")
async def list_units(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", "/units", request, principal)


@router.patch("/units/{unit_id}/status")
async def update_unit_status(unit_id: str, request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("PATCH", f"/units/{unit_id}/status", request, principal)


@router.post("/units/silent-emergency")
async def silent_emergency(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("POST", "/units/silent-emergency", request, principal)


@router.get("/calls")
async def list_calls(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", "/calls", request, principal)


@router.post("/calls")
async def create_call(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("POST", "/calls", request, principal)


@router.get("/bolos")
async def list_bolos(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", "/bolos", request, principal)


@router.get("/messages")
async def list_messages(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("GET", "/messages", request, principal)


@router.post("/messages")
async def post_message(request: Request, principal: dict = Depends(require_principal)):
    return await _proxy("POST", "/messages", request, principal)

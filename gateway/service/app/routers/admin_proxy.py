from fastapi import APIRouter, Depends, HTTPException, Request
import httpx
from shared_lib.admin_rbac import is_admin_role, require_permission

from app.security import require_principal
from app.settings import settings

router = APIRouter(prefix="/admin", tags=["admin"])


def _roles(principal: dict) -> list[str]:
    return principal.get("roles") or []


def _agency(principal: dict) -> str:
    agency = (principal.get("attrs") or {}).get("agency_id")
    if not agency:
        raise HTTPException(status_code=403, detail="Missing agency_id")
    return agency


def _auth_headers(principal: dict, request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    return {
        "Authorization": auth,
        "x-user-id": principal.get("sub", ""),
        "x-roles": ",".join(_roles(principal)),
        "x-agency-id": _agency(principal),
        "x-forwarded-for": request.client.host if request.client else "",
    }


def _require_admin(principal: dict) -> None:
    if not is_admin_role(_roles(principal)):
        raise HTTPException(status_code=403, detail="Admin access required")


def _require_perm(principal: dict, perm: str) -> None:
    try:
        require_permission(_roles(principal), perm)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


async def _proxy(method: str, url: str, request: Request, principal: dict, json_body=None) -> dict | list:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(method, url, json=json_body, headers=_auth_headers(principal, request))
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    if response.status_code == 204:
        return {}
    return response.json()


# --- Auth admin (users, personnel, audit) ---


@router.get("/users")
async def admin_list_users(request: Request, principal: dict = Depends(require_principal)) -> list:
    _require_admin(principal)
    _require_perm(principal, "user:read")
    q = request.query_params.get("q")
    url = f"{settings.auth_service_url}/v1/admin/users"
    if q:
        url += f"?q={q}"
    return await _proxy("GET", url, request, principal)


@router.post("/users")
async def admin_create_user(payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "user:write")
    return await _proxy("POST", f"{settings.auth_service_url}/v1/admin/users", request, principal, payload)


@router.patch("/users/{user_id}")
async def admin_update_user(user_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "user:write")
    return await _proxy("PATCH", f"{settings.auth_service_url}/v1/admin/users/{user_id}", request, principal, payload)


@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "user:delete")
    return await _proxy("DELETE", f"{settings.auth_service_url}/v1/admin/users/{user_id}", request, principal)


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "user:write")
    return await _proxy("POST", f"{settings.auth_service_url}/v1/admin/users/{user_id}/reset-password", request, principal, payload)


@router.get("/personnel")
async def admin_list_personnel(request: Request, principal: dict = Depends(require_principal)) -> list:
    _require_admin(principal)
    _require_perm(principal, "personnel:read")
    qs = str(request.url.query)
    url = f"{settings.auth_service_url}/v1/admin/personnel"
    if qs:
        url += f"?{qs}"
    return await _proxy("GET", url, request, principal)


@router.post("/personnel")
async def admin_create_personnel(payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "personnel:write")
    return await _proxy("POST", f"{settings.auth_service_url}/v1/admin/personnel", request, principal, payload)


@router.patch("/personnel/{personnel_id}")
async def admin_update_personnel(personnel_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "personnel:write")
    return await _proxy("PATCH", f"{settings.auth_service_url}/v1/admin/personnel/{personnel_id}", request, principal, payload)


@router.get("/audit")
async def admin_list_audit(request: Request, principal: dict = Depends(require_principal)) -> list:
    _require_admin(principal)
    _require_perm(principal, "audit:read")
    qs = str(request.url.query)
    url = f"{settings.auth_service_url}/v1/admin/audit"
    if qs:
        url += f"?{qs}"
    return await _proxy("GET", url, request, principal)


@router.get("/audit/export")
async def admin_export_audit(request: Request, principal: dict = Depends(require_principal)):
    _require_admin(principal)
    _require_perm(principal, "audit:export")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{settings.auth_service_url}/v1/admin/audit/export",
            headers=_auth_headers(principal, request),
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    from fastapi.responses import Response

    return Response(
        content=response.content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=admin_audit_export.csv"},
    )


# --- Integration connectors ---


@router.get("/connectors/types")
async def admin_connector_types(request: Request, principal: dict = Depends(require_principal)) -> list:
    _require_admin(principal)
    _require_perm(principal, "connector:read")
    return await _proxy("GET", f"{settings.integration_service_url}/v1/connectors/types", request, principal)


@router.get("/connectors")
async def admin_list_connectors(request: Request, principal: dict = Depends(require_principal)) -> list:
    _require_admin(principal)
    _require_perm(principal, "connector:read")
    return await _proxy("GET", f"{settings.integration_service_url}/v1/connectors", request, principal)


@router.post("/connectors")
async def admin_create_connector(payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "connector:write")
    payload.setdefault("agency_id", _agency(principal))
    return await _proxy("POST", f"{settings.integration_service_url}/v1/connectors", request, principal, payload)


@router.patch("/connectors/{connector_id}")
async def admin_update_connector(connector_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "connector:write")
    return await _proxy("PATCH", f"{settings.integration_service_url}/v1/connectors/{connector_id}", request, principal, payload)


@router.delete("/connectors/{connector_id}")
async def admin_delete_connector(connector_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "connector:delete")
    return await _proxy("DELETE", f"{settings.integration_service_url}/v1/connectors/{connector_id}", request, principal)


@router.post("/connectors/{connector_id}/test")
async def admin_test_connector(connector_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "connector:write")
    return await _proxy("POST", f"{settings.integration_service_url}/v1/connectors/{connector_id}/test", request, principal)


@router.post("/connectors/{connector_id}/credentials")
async def admin_store_credential(connector_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "connector:write")
    return await _proxy("POST", f"{settings.integration_service_url}/v1/connectors/{connector_id}/credentials", request, principal, payload)


# --- Alert rules ---


@router.get("/rules")
async def admin_list_rules(request: Request, principal: dict = Depends(require_principal)) -> list:
    _require_admin(principal)
    _require_perm(principal, "rule:read")
    return await _proxy("GET", f"{settings.alert_engine_url}/v1/rules", request, principal)


@router.post("/rules")
async def admin_create_rule(payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "rule:manage")
    payload.setdefault("agency_id", _agency(principal))
    return await _proxy("POST", f"{settings.alert_engine_url}/v1/rules", request, principal, payload)


@router.get("/rules/{rule_id}")
async def admin_get_rule(rule_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "rule:read")
    return await _proxy("GET", f"{settings.alert_engine_url}/v1/rules/{rule_id}", request, principal)


@router.patch("/rules/{rule_id}")
async def admin_update_rule(rule_id: str, payload: dict, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "rule:manage")
    return await _proxy("PATCH", f"{settings.alert_engine_url}/v1/rules/{rule_id}", request, principal, payload)


@router.delete("/rules/{rule_id}")
async def admin_delete_rule(rule_id: str, request: Request, principal: dict = Depends(require_principal)) -> dict:
    _require_admin(principal)
    _require_perm(principal, "rule:manage")
    return await _proxy("DELETE", f"{settings.alert_engine_url}/v1/rules/{rule_id}", request, principal)

from fastapi import Header, HTTPException, Request
from shared_lib.admin_rbac import is_admin_role, require_permission
from shared_lib.security import decode_jwt_token

from app.settings import settings


async def require_admin_principal(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    roles = claims.get("roles") or []
    if not is_admin_role(roles):
        raise HTTPException(status_code=403, detail="Admin access required")
    return claims


def require_perm(principal: dict, permission: str) -> None:
    try:
        require_permission(principal.get("roles") or [], permission)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


def agency_id_from(principal: dict) -> str:
    agency = (principal.get("attrs") or {}).get("agency_id")
    if not agency:
        raise HTTPException(status_code=403, detail="Missing agency_id in token")
    return agency


def client_meta(request: Request) -> tuple[str | None, str | None]:
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    return ip, request.headers.get("user-agent")

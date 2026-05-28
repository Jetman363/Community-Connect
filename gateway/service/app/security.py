from fastapi import Header, HTTPException
from shared_lib.security import decode_jwt_token
from app.settings import settings


async def require_principal(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    return claims


def require_tenant_match(principal: dict, agency_id: str | None) -> None:
    principal_agency = (principal.get("attrs") or {}).get("agency_id")
    if agency_id and principal_agency and agency_id != principal_agency:
        raise HTTPException(status_code=403, detail="Cross-tenant access denied")

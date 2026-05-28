from fastapi import Header, HTTPException
from shared_lib.security import decode_jwt_token
from app.settings import settings


async def require_principal(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid token") from exc


def get_agency_id(principal: dict) -> str:
    agency_id = (principal.get("attrs") or {}).get("agency_id")
    if not agency_id:
        raise HTTPException(status_code=403, detail="Missing agency scope in token")
    return agency_id


def get_roles(principal: dict) -> list[str]:
    return principal.get("roles") or []

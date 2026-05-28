from fastapi import APIRouter, Depends, Header

from app.proxy_util import forward_request, forward_stream
from app.security import require_principal
from app.settings import settings

router = APIRouter()


def _auth_header(authorization: str = Header(default="")) -> str:
    return authorization


@router.get("")
async def list_alerts(
    threat_level: str | None = None,
    limit: int = 50,
    authorization: str = Depends(_auth_header),
    _principal: dict = Depends(require_principal),
) -> list | dict:
    params = {"limit": limit}
    if threat_level:
        params["threat_level"] = threat_level
    return await forward_request(
        "GET",
        f"{settings.alert_engine_url}/v1/alerts",
        authorization=authorization,
        params=params,
    )


@router.get("/stream/sse")
async def alert_sse(
    authorization: str = Depends(_auth_header),
    _principal: dict = Depends(require_principal),
):
    return await forward_stream(
        "GET",
        f"{settings.alert_engine_url}/v1/stream/sse",
        authorization=authorization,
    )


@router.get("/{alert_id}")
async def get_alert(
    alert_id: str,
    authorization: str = Depends(_auth_header),
    _principal: dict = Depends(require_principal),
) -> dict:
    return await forward_request(
        "GET",
        f"{settings.alert_engine_url}/v1/alerts/{alert_id}",
        authorization=authorization,
    )


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    payload: dict,
    authorization: str = Depends(_auth_header),
    _principal: dict = Depends(require_principal),
) -> dict:
    return await forward_request(
        "POST",
        f"{settings.alert_engine_url}/v1/alerts/{alert_id}/acknowledge",
        authorization=authorization,
        json_body=payload,
    )


@router.post("/ingest/events")
async def ingest_event(
    payload: dict,
    authorization: str = Depends(_auth_header),
    _principal: dict = Depends(require_principal),
) -> dict:
    return await forward_request(
        "POST",
        f"{settings.alert_engine_url}/v1/ingest/events",
        authorization=authorization,
        json_body=payload,
    )


@router.post("/search")
async def search_alerts(
    payload: dict,
    authorization: str = Depends(_auth_header),
    _principal: dict = Depends(require_principal),
) -> dict:
    return await forward_request(
        "POST",
        f"{settings.alert_engine_url}/v1/analytics/search",
        authorization=authorization,
        json_body=payload,
    )

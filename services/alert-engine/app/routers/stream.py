import asyncio
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from shared_lib.security import decode_jwt_token

from app.observability.metrics import WEBSOCKET_CONNECTIONS
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac
from app.settings import settings

router = APIRouter()


@router.websocket("/live")
async def websocket_live(websocket: WebSocket, token: str = "") -> None:
    await websocket.accept()
    try:
        principal = decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
        roles = [r.lower() for r in (principal.get("roles") or [])]
        agency_id = (principal.get("attrs") or {}).get("agency_id")
        if not agency_id:
            await websocket.close(code=4403)
            return
        rbac.authorize(roles, "alert:stream", agency_id, agency_id)
    except Exception:  # noqa: BLE001
        await websocket.close(code=4401)
        return

    WEBSOCKET_CONNECTIONS.labels(status="connected").inc()
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    pubsub = client.pubsub()
    channel = f"{settings.event_stream_prefix}.live"
    await pubsub.subscribe(channel)
    heartbeat = settings.websocket_heartbeat_seconds

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=heartbeat)
            if message and message.get("data"):
                payload = json.loads(message["data"])
                if payload.get("agency_id") != agency_id:
                    continue
                if not rbac.can_view_threat_level(roles, payload.get("threat_level", "LOW")):
                    continue
                await websocket.send_json(payload)
            else:
                await websocket.send_json({"type": "heartbeat", "ts": asyncio.get_event_loop().time()})
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await client.aclose()
        WEBSOCKET_CONNECTIONS.labels(status="disconnected").inc()


@router.get("/sse")
async def sse_stream(principal: dict = Depends(require_principal)):
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:stream", agency_id, agency_id)

    async def event_generator():
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = client.pubsub()
        channel = f"{settings.event_stream_prefix}.live"
        await pubsub.subscribe(channel)
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=settings.sse_poll_interval_ms / 1000)
                if message and message.get("data"):
                    payload = json.loads(message["data"])
                    if payload.get("agency_id") == agency_id and rbac.can_view_threat_level(roles, payload.get("threat_level", "LOW")):
                        yield f"event: alert\ndata: {json.dumps(payload)}\n\n"
                else:
                    yield "event: heartbeat\ndata: {}\n\n"
                await asyncio.sleep(settings.sse_poll_interval_ms / 1000)
        finally:
            await pubsub.unsubscribe(channel)
            await client.aclose()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

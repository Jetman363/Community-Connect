import asyncio
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from shared_lib.security import decode_jwt_token
from app.security.rbac import rbac
from app.services.event_queue import event_queue_service
from app.settings import settings

router = APIRouter()


@router.websocket("/live")
async def websocket_event_stream(websocket: WebSocket) -> None:
    """Real-time event stream over WebSocket (Redis Streams or Kafka backend)."""
    token = websocket.query_params.get("token", "")
    if not token:
        await websocket.close(code=4401)
        return
    try:
        principal = decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
        roles = principal.get("roles") or []
        rbac.authorize(roles, "events:stream")
        agency_id = (principal.get("attrs") or {}).get("agency_id")
        if not agency_id:
            await websocket.close(code=4403)
            return
    except Exception:  # noqa: BLE001
        await websocket.close(code=4401)
        return

    await websocket.accept()
    last_id = "0"
    try:
        while True:
            events = await event_queue_service.read_stream(agency_id, count=10, last_id=last_id)
            for event in events:
                last_id = event["id"]
                await websocket.send_text(json.dumps(event))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return

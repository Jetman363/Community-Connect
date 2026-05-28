from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from shared_lib.security import decode_jwt_token

from app.hub import hub
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio

    task = asyncio.create_task(hub.listen_redis())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="BlueCore WebSocket Gateway", version="1.0.0", lifespan=lifespan)


@app.websocket("/v1/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = "") -> None:
    agency_id: str | None = None
    roles: list[str] = []
    user_id = "unknown"

    if settings.allow_demo_ws and token.startswith("demo:"):
        # demo:{agency_id}:{role}:{user_id}
        parts = token.split(":", 3)
        if len(parts) == 4:
            agency_id, roles, user_id = parts[1], [parts[2].lower()], parts[3]
    else:
        try:
            principal = decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
            agency_id = (principal.get("attrs") or {}).get("agency_id")
            if not agency_id:
                await websocket.close(code=4403)
                return
            roles = [r.lower() for r in (principal.get("roles") or [])]
            user_id = principal.get("sub", "unknown")
        except Exception:  # noqa: BLE001
            await websocket.close(code=4401)
            return

    await hub.connect(websocket, agency_id, roles, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await hub.disconnect(websocket)


@app.post("/internal/broadcast")
async def internal_broadcast(payload: dict) -> dict:
    count = await hub.broadcast(payload)
    return {"delivered": count}


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok", "service": "websocket-gateway", "clients": len(hub._clients)}

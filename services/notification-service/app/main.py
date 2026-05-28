from fastapi import FastAPI

app = FastAPI(title="Notification Service", version="0.1.0")


@app.post("/v1/notify")
async def notify(payload: dict) -> dict:
    return {"queued": True, "channel": payload.get("channel", "in-app")}

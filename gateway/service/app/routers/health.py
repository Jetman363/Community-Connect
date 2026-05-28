from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "gateway"}


@router.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok", "service": "gateway"}


@router.get("/readyz")
async def readyz() -> dict:
    return {"status": "ready", "service": "gateway"}

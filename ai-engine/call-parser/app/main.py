from fastapi import FastAPI

from app.parser import parse_emergency_call
from app.schemas import ParseRequest, ParseResponse, TranscribeRequest, TranscribeResponse, to_response

app = FastAPI(
    title="BlueCore AI Call Parser",
    version="1.0.0",
    description="NLP engine for 911 call intake — entity extraction, threat detection, and CAD field auto-fill.",
)


EXAMPLE_TRANSCRIPT = (
    "There's a white Ford F-150 speeding northbound on Highway 281 near Evans Road "
    "and the driver appears intoxicated."
)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok", "service": "call-parser", "model": "rule-nlp-v1"}


@app.post("/v1/parse", response_model=ParseResponse)
async def parse_call(payload: ParseRequest) -> ParseResponse:
    result = parse_emergency_call(payload.text)
    return to_response(result)


@app.post("/v1/parse/batch", response_model=list[ParseResponse])
async def parse_batch(texts: list[str]) -> list[ParseResponse]:
    return [to_response(parse_emergency_call(t)) for t in texts]


@app.post("/v1/transcribe", response_model=TranscribeResponse)
async def transcribe(_payload: TranscribeRequest) -> TranscribeResponse:
    return TranscribeResponse(
        transcript=EXAMPLE_TRANSCRIPT,
        confidence=0.94,
        provider="stub-whisper",
    )


@app.get("/v1/examples")
async def examples() -> dict:
    result = parse_emergency_call(EXAMPLE_TRANSCRIPT)
    return {"input": EXAMPLE_TRANSCRIPT, "output": to_response(result).model_dump()}

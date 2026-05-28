from pydantic import BaseModel, Field

from app.parser import ExtractedEntity, ParseResult, parse_emergency_call


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Transcript or caller statement")
    agency_id: str = "agency-demo-001"
    call_id: str | None = None
    language: str = "en-US"


class EntityOut(BaseModel):
    type: str
    value: str
    confidence: float


class ParseResponse(BaseModel):
    incident_type: str
    priority: str
    dispatch_code: str | None
    suggested_unit_types: list[str]
    narrative_summary: str
    entities: list[EntityOut]
    threat_indicators: list[str]
    confidence: float
    cad_fields: dict


class TranscribeRequest(BaseModel):
    audio_url: str | None = None
    audio_base64: str | None = None
    language: str = "en-US"


class TranscribeResponse(BaseModel):
    transcript: str
    confidence: float
    provider: str = "stub"


def to_response(result: ParseResult) -> ParseResponse:
    cad_fields = {
        "nature": result.narrative_summary,
        "incident_type": result.incident_type,
        "priority": result.priority,
        "dispatch_code": result.dispatch_code,
        "location": next((e.value for e in result.entities if e.type == "location"), None),
        "vehicle": next((e.value for e in result.entities if e.type == "vehicle"), None),
        "direction": next((e.value for e in result.entities if e.type == "direction"), None),
        "license_plate": next((e.value for e in result.entities if e.type == "license_plate"), None),
        "caller_phone": next((e.value for e in result.entities if e.type == "phone"), None),
        "weapons_involved": "weapon" in result.threat_indicators,
        "injuries": "medical" in result.threat_indicators,
    }
    return ParseResponse(
        incident_type=result.incident_type,
        priority=result.priority,
        dispatch_code=result.dispatch_code,
        suggested_unit_types=result.suggested_unit_types,
        narrative_summary=result.narrative_summary,
        entities=[EntityOut(type=e.type, value=e.value, confidence=e.confidence) for e in result.entities],
        threat_indicators=result.threat_indicators,
        confidence=result.confidence,
        cad_fields=cad_fields,
    )

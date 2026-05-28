from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class ThreatLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class UnifiedEvent(BaseModel):
    event_id: str
    agency_id: str
    source_system: str
    event_type: str
    severity: str = "info"
    timestamp: datetime
    geolocation: dict[str, Any] | None = None
    entities: list[dict[str, Any]] = Field(default_factory=list)
    raw_payload: dict[str, Any] = Field(default_factory=dict)
    normalized_payload: dict[str, Any] = Field(default_factory=dict)
    ai_enrichment: dict[str, Any] = Field(default_factory=dict)
    correlation_id: str | None = None


class IngestEventRequest(BaseModel):
    agency_id: str
    source_system: str
    event_type: str
    severity: str = "info"
    timestamp: datetime | None = None
    geolocation: dict[str, Any] | None = None
    entities: list[dict[str, Any]] = Field(default_factory=list)
    payload: dict[str, Any] = Field(default_factory=dict)


class WebhookIngestRequest(BaseModel):
    source_system: str
    payload: dict[str, Any]


class AlertResponse(BaseModel):
    id: str
    agency_id: str
    source_system: str
    event_type: str
    severity: str
    threat_level: str
    title: str
    summary: str | None
    correlation_id: str | None
    officer_safety: bool
    geolocation: dict[str, Any] | None
    entities: list[dict[str, Any]]
    normalized_payload: dict[str, Any]
    ai_enrichment: dict[str, Any]
    threat_score: float
    status: str
    escalated: bool
    created_at: datetime


class AcknowledgeRequest(BaseModel):
    action: Literal["acknowledge", "escalate", "dismiss"] = "acknowledge"
    notes: str | None = None


class SubscriptionCreateRequest(BaseModel):
    agency_id: str
    user_id: str
    role: str
    event_types: list[str] = Field(default_factory=list)
    min_threat_level: ThreatLevel = ThreatLevel.LOW
    channels: list[str] = Field(default_factory=lambda: ["websocket"])
    geofence: dict[str, Any] | None = None


class RoutingRuleUpdateRequest(BaseModel):
    name: str | None = None
    rule_type: str | None = None
    priority: int | None = None
    conditions: dict[str, Any] | None = None
    actions: dict[str, Any] | None = None
    enabled: bool | None = None


class RoutingRuleCreateRequest(BaseModel):
    agency_id: str
    name: str
    rule_type: str
    priority: int = 100
    conditions: dict[str, Any] = Field(default_factory=dict)
    actions: dict[str, Any] = Field(default_factory=dict)


class SearchQuery(BaseModel):
    agency_id: str
    query: str | None = None
    threat_level: ThreatLevel | None = None
    event_type: str | None = None
    from_time: datetime | None = None
    to_time: datetime | None = None
    lat: float | None = None
    lon: float | None = None
    radius_km: float | None = None
    limit: int = Field(default=50, le=200)


class ThreatScoreResult(BaseModel):
    score: float
    threat_level: ThreatLevel
    officer_safety: bool
    escalated: bool
    factors: dict[str, Any]
    rule_hits: list[str]

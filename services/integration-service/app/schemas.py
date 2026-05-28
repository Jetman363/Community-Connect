from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class ConnectorCreateRequest(BaseModel):
    connector_type: str
    name: str
    agency_id: str
    config: dict[str, Any] = {}
    auth_type: Literal["api_key", "oauth2", "basic"] = "api_key"
    poll_enabled: bool = False
    poll_interval_seconds: int = 60


class ConnectorUpdateRequest(BaseModel):
    name: str | None = None
    enabled: bool | None = None
    config: dict[str, Any] | None = None
    poll_enabled: bool | None = None
    poll_interval_seconds: int | None = None


class ConnectorResponse(BaseModel):
    id: str
    connector_type: str
    name: str
    agency_id: str
    enabled: bool
    config: dict[str, Any]
    auth_type: str
    poll_enabled: bool
    poll_interval_seconds: int
    health_status: str
    last_health_check: datetime | None
    last_error: str | None
    webhook_url: str | None = None


class CredentialCreateRequest(BaseModel):
    credential_type: str
    value: str = Field(min_length=1)
    expires_at: datetime | None = None


class CredentialResponse(BaseModel):
    id: int
    connector_id: str
    credential_type: str
    expires_at: datetime | None
    created_at: datetime


class WebhookIngestResponse(BaseModel):
    delivery_id: int
    events_published: int
    status: str


class PermissionGrantRequest(BaseModel):
    agency_id: str
    connector_id: str
    role: str


class PermissionResponse(BaseModel):
    id: int
    agency_id: str
    connector_id: str
    role: str
    granted_by: str


class HealthStatusResponse(BaseModel):
    connector_id: str
    connector_type: str
    status: str
    message: str
    checked_at: str
    details: dict[str, Any] = {}


class NormalizedEventResponse(BaseModel):
    source: str
    event_type: str
    agency_id: str
    connector_id: str
    occurred_at: str
    external_id: str | None
    payload: dict[str, Any]


class OAuth2TokenRequest(BaseModel):
    connector_id: str
    access_token: str
    refresh_token: str | None = None
    expires_at: datetime
    scopes: list[str] = []

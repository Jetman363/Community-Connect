from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class IncidentCreateRequest(BaseModel):
    agency_id: UUID
    report_number: str | None = None
    incident_type: str | None = None
    location: str | None = None
    occurred_at: datetime | None = None
    created_by: UUID | None = None
    status: str | None = Field(default="open", max_length=100)


class IncidentUpdateRequest(BaseModel):
    report_number: str | None = None
    incident_type: str | None = None
    location: str | None = None
    occurred_at: datetime | None = None
    status: str | None = Field(default=None, max_length=100)


class IncidentResponse(BaseModel):
    id: UUID
    agency_id: UUID
    report_number: str | None
    incident_type: str | None
    location: str | None
    occurred_at: datetime | None
    created_by: UUID | None
    status: str | None
    created_at: datetime


class ReportCreateRequest(BaseModel):
    incident_id: UUID
    officer_id: UUID | None = None
    narrative: str | None = None
    ai_generated: bool = False


class ReportUpdateRequest(BaseModel):
    narrative: str | None = None
    ai_generated: bool | None = None
    supervisor_approved: bool | None = None


class ReportResponse(BaseModel):
    id: UUID
    incident_id: UUID | None
    officer_id: UUID | None
    narrative: str | None
    ai_generated: bool
    supervisor_approved: bool
    created_at: datetime

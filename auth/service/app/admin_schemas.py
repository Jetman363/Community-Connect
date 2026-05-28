from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AdminUserUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    rank: str | None = None
    is_active: bool | None = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=12)


class PersonnelCreateRequest(BaseModel):
    agency_id: UUID
    badge_id: str = Field(min_length=1, max_length=50)
    first_name: str = Field(min_length=1, max_length=255)
    last_name: str = Field(min_length=1, max_length=255)
    unit: str | None = None
    rank: str | None = None
    email: str | None = None
    phone: str | None = None
    clearance_level: str = "standard"
    metadata_json: dict | None = None


class PersonnelUpdateRequest(BaseModel):
    badge_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    unit: str | None = None
    rank: str | None = None
    email: str | None = None
    phone: str | None = None
    clearance_level: str | None = None
    is_active: bool | None = None
    metadata_json: dict | None = None


class PersonnelResponse(BaseModel):
    id: UUID
    agency_id: UUID
    badge_id: str
    first_name: str
    last_name: str
    unit: str | None
    rank: str | None
    email: str | None
    phone: str | None
    clearance_level: str
    is_active: bool
    metadata_json: dict | None
    created_at: datetime
    updated_at: datetime | None


class AdminAuditLogResponse(BaseModel):
    id: int
    agency_id: UUID
    actor_id: str
    actor_username: str | None
    action: str
    resource_type: str
    resource_id: str | None
    before_state: dict | None
    after_state: dict | None
    ip_address: str | None
    status: str
    created_at: datetime

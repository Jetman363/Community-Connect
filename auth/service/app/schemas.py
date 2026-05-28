from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8)
    device_id: str | None = None
    mfa_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreateRequest(BaseModel):
    agency_id: UUID
    username: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=12)
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    rank: str | None = None


class UserCreateAdminRequest(UserCreateRequest):
    requester_agency_id: UUID | None = None


class UserResponse(BaseModel):
    id: UUID
    agency_id: UUID
    username: str
    first_name: str | None
    last_name: str | None
    role: str | None
    rank: str | None
    is_active: bool
    created_at: datetime

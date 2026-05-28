from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class UnitStatus(str, Enum):
    AVAILABLE = "available"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    TRANSPORTING = "transporting"
    CLEAR = "clear"
    OUT_OF_SERVICE = "out_of_service"
    MEAL_BREAK = "meal_break"
    EMERGENCY = "emergency"


class IncidentPriority(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"
    P5 = "P5"


class IncidentCreate(BaseModel):
    agency_id: str
    nature: str
    incident_type: str = "general"
    priority: IncidentPriority = IncidentPriority.P3
    dispatch_code: str | None = None
    caller_name: str | None = None
    caller_phone: str | None = None
    location: str | None = None
    apartment: str | None = None
    cross_streets: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    notes: str | None = None
    narrative: str | None = None
    hazardous: bool = False
    weapons_involved: bool = False
    injuries: bool = False
    metadata: dict | None = None


class IncidentUpdate(BaseModel):
    priority: IncidentPriority | None = None
    status: str | None = None
    nature: str | None = None
    location: str | None = None
    notes: str | None = None
    narrative: str | None = None
    hazardous: bool | None = None
    weapons_involved: bool | None = None
    injuries: bool | None = None


class UnitAssignmentOut(BaseModel):
    id: UUID
    unit_id: UUID
    call_sign: str | None = None
    assigned_at: datetime
    cleared_at: datetime | None = None
    is_primary: bool

    model_config = {"from_attributes": True}


class OfficerRemarkOut(BaseModel):
    id: UUID
    officer_id: str
    officer_name: str | None
    remark: str
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentOut(BaseModel):
    id: UUID
    agency_id: str
    incident_number: str
    priority: str
    nature: str
    incident_type: str
    dispatch_code: str | None
    status: str
    caller_name: str | None
    caller_phone: str | None
    location: str | None
    apartment: str | None
    cross_streets: str | None
    latitude: float | None
    longitude: float | None
    notes: str | None
    narrative: str | None
    hazardous: bool
    weapons_involved: bool
    injuries: bool
    case_number: str | None = None
    report_required: bool = False
    created_at: datetime
    updated_at: datetime
    dispatched_at: datetime | None
    cleared_at: datetime | None
    assignments: list[UnitAssignmentOut] = Field(default_factory=list)
    remarks: list[OfficerRemarkOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class UnitCreate(BaseModel):
    agency_id: str
    call_sign: str
    unit_type: str = "patrol"
    officer_ids: list[str] | None = None
    officer_names: list[str] | None = None
    vehicle_id: str | None = None


class UnitStatusUpdate(BaseModel):
    status: UnitStatus
    incident_id: UUID | None = None
    require_report: bool = False
    release_from_call: bool = False
    latitude: float | None = None
    longitude: float | None = None
    heading: float | None = None
    speed_mph: float | None = None


class UnitOut(BaseModel):
    id: UUID
    agency_id: str
    call_sign: str
    unit_type: str
    status: str
    officer_ids: list | None
    officer_names: list | None
    vehicle_id: str | None
    latitude: float | None
    longitude: float | None
    heading: float | None
    speed_mph: float | None
    last_status_change: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssignUnitRequest(BaseModel):
    unit_id: UUID
    is_primary: bool = False


class EmergencyCallCreate(BaseModel):
    agency_id: str
    line_id: str | None = None
    caller_name: str | None = None
    caller_phone: str | None = None
    ani: str | None = None
    ali_location: str | None = None
    ali_latitude: float | None = None
    ali_longitude: float | None = None
    call_type: str = "911"
    calltaker_id: str | None = None


class EmergencyCallUpdate(BaseModel):
    status: str | None = None
    caller_name: str | None = None
    transcript: str | None = None
    parsed_data: dict | None = None
    incident_id: UUID | None = None


class EmergencyCallOut(BaseModel):
    id: UUID
    agency_id: str
    line_id: str | None
    status: str
    caller_name: str | None
    caller_phone: str | None
    ani: str | None
    ali_location: str | None
    ali_latitude: float | None
    ali_longitude: float | None
    call_type: str
    transcript: str | None
    parsed_data: dict | None
    incident_id: UUID | None
    calltaker_id: str | None
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class BoloCreate(BaseModel):
    agency_id: str
    title: str
    description: str
    subject_type: str = "person"
    plate: str | None = None
    priority: str = "P3"
    expires_at: datetime | None = None


class BoloOut(BaseModel):
    id: UUID
    agency_id: str
    title: str
    description: str
    subject_type: str
    plate: str | None
    priority: str
    active: bool
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    agency_id: str
    sender_id: str
    sender_role: str
    message: str
    incident_id: UUID | None = None
    recipient_unit_id: UUID | None = None
    is_broadcast: bool = False


class MessageOut(BaseModel):
    id: UUID
    agency_id: str
    incident_id: UUID | None
    sender_id: str
    sender_role: str
    recipient_unit_id: UUID | None
    message: str
    is_broadcast: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RemarkCreate(BaseModel):
    officer_id: str
    officer_name: str | None = None
    remark: str


class UnitRecommendation(BaseModel):
    unit_id: UUID
    call_sign: str
    score: float
    reason: str
    distance_miles: float | None = None
    eta_minutes: float | None = None


class SilentEmergencyRequest(BaseModel):
    unit_id: UUID
    officer_id: str
    latitude: float | None = None
    longitude: float | None = None
    notes: str | None = None

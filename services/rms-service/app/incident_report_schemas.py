"""Pydantic schemas for structured incident reports."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class ReportStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    FINALIZED = "finalized"
    LOCKED = "locked"


class PartyRole(str, Enum):
    VICTIM = "victim"
    COMPLAINANT = "complainant"
    WITNESS = "witness"


class VictimEntry(BaseModel):
    id: str | None = None
    role: PartyRole = PartyRole.VICTIM
    full_name: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    race_ethnicity: str | None = None
    phone_number: str | None = None
    email_address: str | None = None
    home_address: str | None = None
    driver_license: str | None = None
    relationship_to_incident: str | None = None
    injury_information: str | None = None
    statement_summary: str | None = None


class SuspectEntry(BaseModel):
    id: str | None = None
    is_unknown: bool = False
    full_name: str | None = None
    alias: str | None = None
    dob: str | None = None
    gender: str | None = None
    race: str | None = None
    height: str | None = None
    weight: str | None = None
    hair_color: str | None = None
    eye_color: str | None = None
    clothing_description: str | None = None
    identifying_marks: str | None = None
    address: str | None = None
    phone_number: str | None = None
    gang_affiliation: str | None = None
    warrants_known: str | None = None
    arrested: bool | None = None
    charges: str | None = None
    miranda_given: bool | None = None
    photo_placeholder: str | None = None


class VehicleEntry(BaseModel):
    id: str | None = None
    year: str | None = None
    make: str | None = None
    model: str | None = None
    color: str | None = None
    style: str | None = None
    license_plate: str | None = None
    state: str | None = None
    vin: str | None = None
    damage_description: str | None = None
    registered_owner: str | None = None
    towed: bool | None = None
    tow_company: str | None = None
    associated_person: str | None = None


class WeaponEntry(BaseModel):
    id: str | None = None
    weapon_type: str | None = None
    make: str | None = None
    model: str | None = None
    caliber: str | None = None
    serial_number: str | None = None
    loaded: bool | None = None
    recovered: bool | None = None
    stolen: bool | None = None
    associated_suspect: str | None = None
    evidence_tag_number: str | None = None


class PropertyEntry(BaseModel):
    id: str | None = None
    property_type: str | None = None
    description: str | None = None
    serial_number: str | None = None
    value: str | None = None
    owner: str | None = None
    recovered: bool | None = None
    damaged: bool | None = None
    evidence_number: str | None = None
    chain_of_custody_notes: str | None = None


class NarcoticEntry(BaseModel):
    id: str | None = None
    drug_type: str | None = None
    packaging_type: str | None = None
    quantity: str | None = None
    weight_metric: str | None = None
    weight_metric_unit: str = "grams"
    weight_standard: str | None = None
    weight_standard_unit: str = "ounces"
    estimated_street_value: str | None = None
    test_performed: str | None = None
    test_result: str | None = None
    evidence_number: str | None = None
    associated_suspect: str | None = None


class NarrativeRevision(BaseModel):
    content: str
    author_id: str | None = None
    author_name: str | None = None
    revision_type: str = "narrative"
    created_at: datetime | None = None


class SupervisorComment(BaseModel):
    comment: str
    author_id: str | None = None
    author_name: str | None = None
    created_at: datetime | None = None


class ReportHeader(BaseModel):
    incident_number: str | None = None
    case_number: str | None = None
    report_date: str | None = None
    report_time: str | None = None
    reporting_officer_id: UUID | None = None
    reporting_officer_name: str | None = None
    assisting_officers: list[str] = Field(default_factory=list)
    supervisor_id: UUID | None = None
    supervisor_name: str | None = None
    incident_location: str | None = None
    incident_type: str | None = None
    call_type: str | None = None
    priority_level: str | None = None
    agency: str | None = None
    division_unit: str | None = None


class IncidentReportCreateRequest(BaseModel):
    agency_id: UUID | None = None
    header: ReportHeader = Field(default_factory=ReportHeader)
    victims: list[VictimEntry] = Field(default_factory=list)
    suspects: list[SuspectEntry] = Field(default_factory=list)
    vehicles: list[VehicleEntry] = Field(default_factory=list)
    weapons: list[WeaponEntry] = Field(default_factory=list)
    narcotics: list[NarcoticEntry] = Field(default_factory=list)
    property_items: list[PropertyEntry] = Field(default_factory=list)
    narrative: str | None = None


class IncidentReportUpdateRequest(BaseModel):
    header: ReportHeader | None = None
    victims: list[VictimEntry] | None = None
    suspects: list[SuspectEntry] | None = None
    vehicles: list[VehicleEntry] | None = None
    weapons: list[WeaponEntry] | None = None
    narcotics: list[NarcoticEntry] | None = None
    property_items: list[PropertyEntry] | None = None
    narrative: str | None = None
    change_summary: str | None = None


class IncidentReportResponse(BaseModel):
    id: UUID
    agency_id: UUID
    status: ReportStatus
    locked: bool
    header: ReportHeader
    victims: list[VictimEntry]
    suspects: list[SuspectEntry]
    vehicles: list[VehicleEntry]
    weapons: list[WeaponEntry]
    narcotics: list[NarcoticEntry]
    property_items: list[PropertyEntry]
    narrative: str | None
    narrative_revisions: list[NarrativeRevision]
    supervisor_comments: list[SupervisorComment]
    created_by: UUID | None
    updated_by: UUID | None
    finalized_at: datetime | None
    approved_at: datetime | None
    approved_by: UUID | None
    created_at: datetime
    updated_at: datetime
    editable: bool = True
    cji_authorized: bool = True


class IncidentReportSummary(BaseModel):
    id: UUID
    incident_number: str | None
    case_number: str | None
    incident_type: str | None
    reporting_officer_name: str | None
    status: ReportStatus
    report_date: str | None
    created_at: datetime
    updated_at: datetime


class SupervisorApprovalRequest(BaseModel):
    approved: bool = True
    comment: str | None = None


class SupervisorCommentRequest(BaseModel):
    comment: str


class ReportAuditLogResponse(BaseModel):
    id: int
    report_id: UUID | None
    user_id: UUID | None
    user_email: str | None
    action: str
    ip_address: str | None
    details: dict | None
    suspicious: bool
    created_at: datetime


class ReportRevisionResponse(BaseModel):
    id: UUID
    revision_number: int
    change_summary: str | None
    created_by: UUID | None
    created_at: datetime


class ReportSearchParams(BaseModel):
    q: str | None = None
    status: ReportStatus | None = None
    incident_number: str | None = None
    limit: int = Field(default=50, le=200)

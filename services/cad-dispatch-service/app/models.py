import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UnitStatus(str, enum.Enum):
    AVAILABLE = "available"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    TRANSPORTING = "transporting"
    CLEAR = "clear"
    OUT_OF_SERVICE = "out_of_service"
    MEAL_BREAK = "meal_break"
    EMERGENCY = "emergency"


class IncidentPriority(str, enum.Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"
    P5 = "P5"


class CallStatus(str, enum.Enum):
    RINGING = "ringing"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    DISPATCHED = "dispatched"
    CLOSED = "closed"


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    incident_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    priority: Mapped[str] = mapped_column(String(8), default=IncidentPriority.P3.value)
    nature: Mapped[str] = mapped_column(String(256))
    incident_type: Mapped[str] = mapped_column(String(128), default="general")
    dispatch_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    caller_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    caller_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    apartment: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cross_streets: Mapped[str | None] = mapped_column(String(256), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    narrative: Mapped[str | None] = mapped_column(Text, nullable=True)
    hazardous: Mapped[bool] = mapped_column(Boolean, default=False)
    weapons_involved: Mapped[bool] = mapped_column(Boolean, default=False)
    injuries: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cleared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    assignments: Mapped[list["UnitAssignment"]] = relationship(back_populates="incident")
    remarks: Mapped[list["OfficerRemark"]] = relationship(back_populates="incident")
    timeline: Mapped[list["IncidentEvent"]] = relationship(back_populates="incident")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    call_sign: Mapped[str] = mapped_column(String(32), index=True)
    unit_type: Mapped[str] = mapped_column(String(64), default="patrol")
    status: Mapped[str] = mapped_column(String(32), default=UnitStatus.AVAILABLE.value)
    officer_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    officer_names: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    vehicle_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    heading: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed_mph: Mapped[float | None] = mapped_column(Float, nullable=True)
    shift_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_status_change: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assignments: Mapped[list["UnitAssignment"]] = relationship(back_populates="unit")


class UnitAssignment(Base):
    __tablename__ = "unit_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), index=True)
    unit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("units.id"), index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    cleared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    incident: Mapped["Incident"] = relationship(back_populates="assignments")
    unit: Mapped["Unit"] = relationship(back_populates="assignments")


class EmergencyCall(Base):
    __tablename__ = "emergency_calls"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    line_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default=CallStatus.RINGING.value)
    caller_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    caller_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ani: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ali_location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ali_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    ali_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    call_type: Mapped[str] = mapped_column(String(32), default="911")
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    incident_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True)
    calltaker_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class OfficerRemark(Base):
    __tablename__ = "officer_remarks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), index=True)
    officer_id: Mapped[str] = mapped_column(String(64))
    officer_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    remark: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    incident: Mapped["Incident"] = relationship(back_populates="remarks")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text)
    actor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    incident: Mapped["Incident"] = relationship(back_populates="timeline")


class BoloAlert(Base):
    __tablename__ = "bolo_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(Text)
    subject_type: Mapped[str] = mapped_column(String(32), default="person")
    plate: Mapped[str | None] = mapped_column(String(16), nullable=True)
    priority: Mapped[str] = mapped_column(String(8), default="P3")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DispatchMessage(Base):
    __tablename__ = "dispatch_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    incident_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True)
    sender_id: Mapped[str] = mapped_column(String(64))
    sender_role: Mapped[str] = mapped_column(String(32))
    recipient_unit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    is_broadcast: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WarrantFlag(Base):
    __tablename__ = "warrant_flags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    subject_name: Mapped[str] = mapped_column(String(256))
    warrant_type: Mapped[str] = mapped_column(String(64))
    case_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    location_hint: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "cad_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[str] = mapped_column(String(64), index=True)
    actor_id: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(128))
    resource_type: Mapped[str] = mapped_column(String(64))
    resource_id: Mapped[str] = mapped_column(String(64))
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

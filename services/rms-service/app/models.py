"""Incident report domain models — CJIS-conscious structured reports."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    agency_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    report_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    incident_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    incident_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("incidents.id"),
        nullable=True,
        index=True,
    )
    officer_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    narrative: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    supervisor_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class IncidentReport(Base):
    """Full structured law enforcement incident report."""

    __tablename__ = "incident_reports"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    agency_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    incident_number: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    case_number: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    report_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    report_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reporting_officer_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    reporting_officer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assisting_officers: Mapped[list | None] = mapped_column(JSON, nullable=True)
    supervisor_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    supervisor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    incident_location: Mapped[str | None] = mapped_column(Text, nullable=True)
    incident_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    call_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    priority_level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    agency: Mapped[str | None] = mapped_column(String(255), nullable=True)
    division_unit: Mapped[str | None] = mapped_column(String(255), nullable=True)
    narrative: Mapped[str | None] = mapped_column(Text, nullable=True)
    narrative_revisions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    supervisor_comments: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    updated_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    victims: Mapped[list["ReportVictim"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    suspects: Mapped[list["ReportSuspect"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    vehicles: Mapped[list["ReportVehicle"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    weapons: Mapped[list["ReportWeapon"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    narcotics: Mapped[list["ReportNarcotic"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    property_items: Mapped[list["ReportProperty"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    revisions: Mapped[list["ReportRevision"]] = relationship(back_populates="report", cascade="all, delete-orphan")


class ReportVictim(Base):
    __tablename__ = "report_victims"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    role: Mapped[str] = mapped_column(String(32), default="victim")
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    report: Mapped["IncidentReport"] = relationship(back_populates="victims")


class ReportSuspect(Base):
    __tablename__ = "report_suspects"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    is_unknown: Mapped[bool] = mapped_column(Boolean, default=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    report: Mapped["IncidentReport"] = relationship(back_populates="suspects")


class ReportVehicle(Base):
    __tablename__ = "report_vehicles"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    report: Mapped["IncidentReport"] = relationship(back_populates="vehicles")


class ReportWeapon(Base):
    __tablename__ = "report_weapons"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    report: Mapped["IncidentReport"] = relationship(back_populates="weapons")


class ReportNarcotic(Base):
    __tablename__ = "report_narcotics"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    report: Mapped["IncidentReport"] = relationship(back_populates="narcotics")


class ReportProperty(Base):
    __tablename__ = "report_property"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    report: Mapped["IncidentReport"] = relationship(back_populates="property_items")


class ReportRevision(Base):
    __tablename__ = "report_revisions"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incident_reports.id"), index=True)
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    report: Mapped["IncidentReport"] = relationship(back_populates="revisions")


class ReportAuditLog(Base):
    __tablename__ = "report_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    agency_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    user_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    suspicious: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    dispatched: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    idempotency_key: Mapped[str] = mapped_column(String(255), primary_key=True)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

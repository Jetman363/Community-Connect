from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class ThreatLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid4()))
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_system: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    threat_level: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    officer_safety: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    geolocation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    entities: Mapped[list] = mapped_column(JSON, default=list)
    normalized_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    ai_enrichment: Mapped[dict] = mapped_column(JSON, default=dict)
    threat_score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="active", index=True)
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    events: Mapped[list["AlertEvent"]] = relationship(back_populates="alert")
    acknowledgements: Mapped[list["AlertAcknowledgement"]] = relationship(back_populates="alert")
    threat_scores: Mapped[list["ThreatScore"]] = relationship(back_populates="alert")


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("alerts.id"), nullable=True, index=True)
    event_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_system: Mapped[str] = mapped_column(String(64), nullable=False)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    geolocation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    entities: Mapped[list] = mapped_column(JSON, default=list)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    normalized_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    ai_enrichment: Mapped[dict] = mapped_column(JSON, default=dict)
    correlation_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    alert: Mapped["Alert | None"] = relationship(back_populates="events")


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    event_types: Mapped[list] = mapped_column(JSON, default=list)
    min_threat_level: Mapped[str] = mapped_column(String(32), default="LOW")
    channels: Mapped[list] = mapped_column(JSON, default=list)
    geofence: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AlertAcknowledgement(Base):
    __tablename__ = "alert_acknowledgements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(String(64), ForeignKey("alerts.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    alert: Mapped["Alert"] = relationship(back_populates="acknowledgements")


class ThreatScore(Base):
    __tablename__ = "threat_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(String(64), ForeignKey("alerts.id"), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    threat_level: Mapped[str] = mapped_column(String(32), nullable=False)
    factors: Mapped[dict] = mapped_column(JSON, default=dict)
    rule_hits: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    alert: Mapped["Alert"] = relationship(back_populates="threat_scores")


class RoutingRule(Base):
    __tablename__ = "routing_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=100)
    conditions: Mapped[dict] = mapped_column(JSON, default=dict)
    actions: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(64), nullable=False)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    hash_chain: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

from datetime import datetime, timezone
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class ConnectorInstance(Base):
    __tablename__ = "connector_instances"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    connector_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    auth_type: Mapped[str] = mapped_column(String(32), default="api_key")
    poll_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    poll_interval_seconds: Mapped[int] = mapped_column(Integer, default=60)
    webhook_secret: Mapped[str | None] = mapped_column(String(128), nullable=True)
    health_status: Mapped[str] = mapped_column(String(32), default="unknown")
    last_health_check: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    credentials: Mapped[list["EncryptedCredential"]] = relationship(back_populates="connector")
    permissions: Mapped[list["AgencyPermission"]] = relationship(back_populates="connector")


class EncryptedCredential(Base):
    __tablename__ = "encrypted_credentials"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    connector_id: Mapped[str] = mapped_column(String(64), ForeignKey("connector_instances.id"), index=True)
    credential_type: Mapped[str] = mapped_column(String(64), nullable=False)
    encrypted_value: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    rotated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    connector: Mapped["ConnectorInstance"] = relationship(back_populates="credentials")


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    connector_id: Mapped[str] = mapped_column(String(64), ForeignKey("connector_instances.id"), index=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="received")
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AgencyPermission(Base):
    __tablename__ = "agency_permissions"
    __table_args__ = (UniqueConstraint("agency_id", "connector_id", "role", name="uq_agency_connector_role"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    connector_id: Mapped[str] = mapped_column(String(64), ForeignKey("connector_instances.id"), index=True)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    granted_by: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    connector: Mapped["ConnectorInstance"] = relationship(back_populates="permissions")


class IntegrationAuditLog(Base):
    __tablename__ = "integration_audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    agency_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(64), nullable=False)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class OAuth2Token(Base):
    __tablename__ = "oauth2_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    connector_id: Mapped[str] = mapped_column(String(64), ForeignKey("connector_instances.id"), index=True)
    access_token_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_type: Mapped[str] = mapped_column(String(32), default="Bearer")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scopes: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

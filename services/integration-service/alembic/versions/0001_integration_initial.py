"""initial integration schema

Revision ID: 0001_integration_initial
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_integration_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "connector_instances",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("connector_type", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column("auth_type", sa.String(32), nullable=False),
        sa.Column("poll_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("poll_interval_seconds", sa.Integer(), nullable=False),
        sa.Column("webhook_secret", sa.String(128), nullable=True),
        sa.Column("health_status", sa.String(32), nullable=False),
        sa.Column("last_health_check", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_connector_instances_type", "connector_instances", ["connector_type"])
    op.create_index("ix_connector_instances_agency", "connector_instances", ["agency_id"])

    op.create_table(
        "encrypted_credentials",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("connector_id", sa.String(64), sa.ForeignKey("connector_instances.id"), nullable=False),
        sa.Column("credential_type", sa.String(64), nullable=False),
        sa.Column("encrypted_value", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rotated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "webhook_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("connector_id", sa.String(64), sa.ForeignKey("connector_instances.id"), nullable=False),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "agency_permissions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("connector_id", sa.String(64), sa.ForeignKey("connector_instances.id"), nullable=False),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("granted_by", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("agency_id", "connector_id", "role", name="uq_agency_connector_role"),
    )

    op.create_table(
        "integration_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("actor_id", sa.String(64), nullable=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("action", sa.String(128), nullable=False),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.String(64), nullable=False),
        sa.Column("outcome", sa.String(32), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "oauth2_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("connector_id", sa.String(64), sa.ForeignKey("connector_instances.id"), nullable=False),
        sa.Column("access_token_encrypted", sa.Text(), nullable=False),
        sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("token_type", sa.String(32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scopes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("oauth2_tokens")
    op.drop_table("integration_audit_logs")
    op.drop_table("agency_permissions")
    op.drop_table("webhook_deliveries")
    op.drop_table("encrypted_credentials")
    op.drop_index("ix_connector_instances_agency", table_name="connector_instances")
    op.drop_index("ix_connector_instances_type", table_name="connector_instances")
    op.drop_table("connector_instances")

"""alert engine initial schema

Revision ID: 0001_alert_initial
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_alert_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "alerts",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("source_system", sa.String(64), nullable=False),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("severity", sa.String(32), nullable=False),
        sa.Column("threat_level", sa.String(32), nullable=False),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("correlation_id", sa.String(64), nullable=True),
        sa.Column("officer_safety", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("geolocation", sa.JSON(), nullable=True),
        sa.Column("entities", sa.JSON(), nullable=False),
        sa.Column("normalized_payload", sa.JSON(), nullable=False),
        sa.Column("ai_enrichment", sa.JSON(), nullable=False),
        sa.Column("threat_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("escalated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_alerts_agency_id", "alerts", ["agency_id"])
    op.create_index("ix_alerts_threat_level", "alerts", ["threat_level"])
    op.create_index("ix_alerts_event_type", "alerts", ["event_type"])

    op.create_table(
        "alert_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.String(64), sa.ForeignKey("alerts.id"), nullable=True),
        sa.Column("event_id", sa.String(64), nullable=False, unique=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("source_system", sa.String(64), nullable=False),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("severity", sa.String(32), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("geolocation", sa.JSON(), nullable=True),
        sa.Column("entities", sa.JSON(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("normalized_payload", sa.JSON(), nullable=False),
        sa.Column("ai_enrichment", sa.JSON(), nullable=False),
        sa.Column("correlation_id", sa.String(64), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_alert_events_agency_id", "alert_events", ["agency_id"])
    op.create_index("ix_alert_events_event_id", "alert_events", ["event_id"])

    op.create_table(
        "alert_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("event_types", sa.JSON(), nullable=False),
        sa.Column("min_threat_level", sa.String(32), nullable=False, server_default="LOW"),
        sa.Column("channels", sa.JSON(), nullable=False),
        sa.Column("geofence", sa.JSON(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "alert_acknowledgements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.String(64), sa.ForeignKey("alerts.id"), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "threat_scores",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.String(64), sa.ForeignKey("alerts.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("threat_level", sa.String(32), nullable=False),
        sa.Column("factors", sa.JSON(), nullable=False),
        sa.Column("rule_hits", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "routing_rules",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("rule_type", sa.String(64), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("conditions", sa.JSON(), nullable=False),
        sa.Column("actions", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("actor_id", sa.String(64), nullable=True),
        sa.Column("agency_id", sa.String(64), nullable=False),
        sa.Column("action", sa.String(128), nullable=False),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.String(64), nullable=False),
        sa.Column("outcome", sa.String(32), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("hash_chain", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("routing_rules")
    op.drop_table("threat_scores")
    op.drop_table("alert_acknowledgements")
    op.drop_table("alert_subscriptions")
    op.drop_table("alert_events")
    op.drop_table("alerts")

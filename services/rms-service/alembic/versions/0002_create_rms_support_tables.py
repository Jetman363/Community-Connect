"""create rms support tables

Revision ID: 0002_create_rms_support_tables
Revises: 0001_create_incidents_table
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_create_rms_support_tables"
down_revision = "0001_create_incidents_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reports",
        sa.Column("report_id", sa.String(length=64), primary_key=True),
        sa.Column("incident_type", sa.String(length=255), nullable=False),
        sa.Column("narrative", sa.Text(), nullable=False),
        sa.Column("agency_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_by", sa.String(length=64), nullable=False),
        sa.Column("officer_review_required", sa.Boolean(), nullable=False),
    )
    op.create_index("ix_reports_agency_id", "reports", ["agency_id"])

    op.create_table(
        "outbox_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("dispatched", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_outbox_events_topic", "outbox_events", ["topic"])
    op.create_index("ix_outbox_events_dispatched", "outbox_events", ["dispatched"])

    op.create_table(
        "idempotency_records",
        sa.Column("idempotency_key", sa.String(length=255), primary_key=True),
        sa.Column("response_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("idempotency_records")
    op.drop_index("ix_outbox_events_dispatched", table_name="outbox_events")
    op.drop_index("ix_outbox_events_topic", table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_index("ix_reports_agency_id", table_name="reports")
    op.drop_table("reports")

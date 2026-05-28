"""restructure reports table to incident-linked narrative model

Revision ID: 0003_restructure_reports_table
Revises: 0002_create_rms_support_tables
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_restructure_reports_table"
down_revision = "0002_create_rms_support_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "reports" not in inspector.get_table_names():
        _create_reports_table()
        return

    columns = {col["name"] for col in inspector.get_columns("reports")}
    if "incident_id" in columns:
        return

    op.drop_index("ix_reports_agency_id", table_name="reports", if_exists=True)
    op.drop_table("reports")
    _create_reports_table()


def _create_reports_table() -> None:
    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("incident_id", sa.Uuid(), sa.ForeignKey("incidents.id"), nullable=True),
        sa.Column("officer_id", sa.Uuid(), nullable=True),
        sa.Column("narrative", sa.Text(), nullable=True),
        sa.Column("ai_generated", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("supervisor_approved", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("ix_reports_incident_id", "reports", ["incident_id"])
    op.create_index("ix_reports_officer_id", "reports", ["officer_id"])


def downgrade() -> None:
    op.drop_index("ix_reports_officer_id", table_name="reports")
    op.drop_index("ix_reports_incident_id", table_name="reports")
    op.drop_table("reports")
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

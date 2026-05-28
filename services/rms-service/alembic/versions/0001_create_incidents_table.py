"""create incidents table

Revision ID: 0001_create_incidents_table
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_create_incidents_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "incidents",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("agency_id", sa.Uuid(), nullable=False),
        sa.Column("report_number", sa.String(length=255), nullable=True),
        sa.Column("incident_type", sa.String(length=255), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("ix_incidents_agency_id", "incidents", ["agency_id"])


def downgrade() -> None:
    op.drop_index("ix_incidents_agency_id", table_name="incidents")
    op.drop_table("incidents")

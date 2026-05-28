"""create outbox events table

Revision ID: 0002_create_outbox_events
Revises: 0001_create_users_table
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_create_outbox_events"
down_revision = "0001_create_users_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "outbox_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("dispatched", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_outbox_events_topic", "outbox_events", ["topic"], unique=False)
    op.create_index("ix_outbox_events_dispatched", "outbox_events", ["dispatched"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_outbox_events_dispatched", table_name="outbox_events")
    op.drop_index("ix_outbox_events_topic", table_name="outbox_events")
    op.drop_table("outbox_events")

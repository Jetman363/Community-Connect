"""create users table

Revision ID: 0001_create_users_table
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_create_users_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("agency_id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("first_name", sa.String(length=255), nullable=True),
        sa.Column("last_name", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=100), nullable=True),
        sa.Column("rank", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_agency_id", "users", ["agency_id"])


def downgrade() -> None:
    op.drop_index("ix_users_agency_id", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")

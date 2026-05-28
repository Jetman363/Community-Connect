"""restructure users table to agency-scoped identity model

Revision ID: 0003_restructure_users_table
Revises: 0002_create_outbox_events
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_restructure_users_table"
down_revision = "0002_create_outbox_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "users" not in inspector.get_table_names():
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
        return

    columns = {col["name"] for col in inspector.get_columns("users")}
    if "username" in columns:
        return

    op.drop_index("ix_users_email", table_name="users", if_exists=True)
    op.drop_table("users")
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
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(length=64), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("roles", sa.JSON(), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

"""Admin tables: personnel directory and admin audit logs."""

from alembic import op
import sqlalchemy as sa

revision = "0004_admin_personnel_audit"
down_revision = "0003_restructure_users_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "personnel",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("agency_id", sa.Uuid(), nullable=False),
        sa.Column("badge_id", sa.String(50), nullable=False),
        sa.Column("first_name", sa.String(255), nullable=False),
        sa.Column("last_name", sa.String(255), nullable=False),
        sa.Column("unit", sa.String(100), nullable=True),
        sa.Column("rank", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("clearance_level", sa.String(50), nullable=False, server_default="standard"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_personnel_agency_id", "personnel", ["agency_id"])
    op.create_index("ix_personnel_badge_id", "personnel", ["badge_id"])

    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agency_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.String(255), nullable=False),
        sa.Column("actor_username", sa.String(255), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=False),
        sa.Column("resource_id", sa.String(255), nullable=True),
        sa.Column("before_state", sa.JSON(), nullable=True),
        sa.Column("after_state", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(512), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="success"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_logs_agency_id", "admin_audit_logs", ["agency_id"])
    op.create_index("ix_admin_audit_logs_action", "admin_audit_logs", ["action"])
    op.create_index("ix_admin_audit_logs_created_at", "admin_audit_logs", ["created_at"])

    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "updated_at")
    op.drop_column("users", "last_login_at")
    op.drop_table("admin_audit_logs")
    op.drop_table("personnel")

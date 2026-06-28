"""google calendar token + planning_session.google_event_id

Revision ID: a1b2c3d4e5f6
Revises: 87c318fceacc
Create Date: 2026-05-15

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "87c318fceacc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "google_calendar_token",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("calendar_id", sa.Text(), server_default=sa.text("'primary'"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        op.f("ix_google_calendar_token_user_id"),
        "google_calendar_token",
        ["user_id"],
        unique=True,
    )
    op.add_column(
        "planning_session",
        sa.Column("google_event_id", sa.Text(), nullable=True),
    )
    op.create_index(
        op.f("ix_planning_session_google_event_id"),
        "planning_session",
        ["google_event_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_planning_session_google_event_id"), table_name="planning_session")
    op.drop_column("planning_session", "google_event_id")
    op.drop_index(op.f("ix_google_calendar_token_user_id"), table_name="google_calendar_token")
    op.drop_table("google_calendar_token")

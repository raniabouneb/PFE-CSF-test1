"""create_lms_tables

Revision ID: 87c318fceacc
Revises:
Create Date: 2026-05-13 11:56:42.640095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "87c318fceacc"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- modules ---
    op.create_table(
        "modules",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duree_minutes", sa.Integer(), nullable=True),
        sa.Column("pdf_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- pack_reconversion ---
    op.create_table(
        "pack_reconversion",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("statut", sa.Text(), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.CheckConstraint("statut IN ('draft','active','archived')", name="ck_pack_reconversion_statut"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- pack_modules (pivot) ---
    op.create_table(
        "pack_modules",
        sa.Column("pack_id", sa.UUID(), nullable=False),
        sa.Column("module_id", sa.UUID(), nullable=False),
        sa.Column("ordre", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.ForeignKeyConstraint(["pack_id"], ["pack_reconversion.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("pack_id", "module_id"),
    )

    # --- groupes ---
    op.create_table(
        "groupes",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("statut", sa.Text(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.CheckConstraint("type IN ('ponctuelle','reconversion')", name="ck_groupes_type"),
        sa.CheckConstraint("statut IN ('pending','active','completed','archived')", name="ck_groupes_statut"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- enrollments ---
    op.create_table(
        "enrollments",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("apprenant_id", sa.String(), nullable=False),
        sa.Column("groupe_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["apprenant_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("apprenant_id", "groupe_id", name="uq_enrollment_apprenant_groupe"),
    )

    # --- sessions ---
    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("module_id", sa.UUID(), nullable=True),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("heure_debut", sa.Time(), nullable=True),
        sa.Column("duree_minutes", sa.Integer(), nullable=True),
        sa.Column("lieu", sa.Text(), nullable=True),
        sa.Column("statut", sa.Text(), server_default=sa.text("'planifiee'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.CheckConstraint("statut IN ('planifiee','en_cours','terminee','annulee')", name="ck_sessions_statut"),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- session_groups (pivot N-N) ---
    op.create_table(
        "session_groups",
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("groupe_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("session_id", "groupe_id"),
    )

    # --- attendance ---
    op.create_table(
        "attendance",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("apprenant_id", sa.String(), nullable=False),
        sa.Column("present", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("marked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["apprenant_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "apprenant_id", name="uq_attendance_session_apprenant"),
    )

    # --- progression (ponctuelle — heures) ---
    op.create_table(
        "progression",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("enrollment_id", sa.UUID(), nullable=False),
        sa.Column("module_id", sa.UUID(), nullable=False),
        sa.Column("minutes_validees", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["enrollment_id"], ["enrollments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("enrollment_id", "module_id", name="uq_progression_enrollment_module"),
    )

    # --- pack_progression (reconversion — déverrouillage séquentiel) ---
    op.create_table(
        "pack_progression",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("enrollment_id", sa.UUID(), nullable=False),
        sa.Column("module_id", sa.UUID(), nullable=False),
        sa.Column("statut", sa.Text(), server_default=sa.text("'locked'"), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("statut IN ('locked','open','done')", name="ck_pack_progression_statut"),
        sa.ForeignKeyConstraint(["enrollment_id"], ["enrollments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("enrollment_id", "module_id", name="uq_pack_progression_enrollment_module"),
    )


def downgrade() -> None:
    op.drop_table("pack_progression")
    op.drop_table("progression")
    op.drop_table("attendance")
    op.drop_table("session_groups")
    op.drop_table("sessions")
    op.drop_table("enrollments")
    op.drop_table("groupes")
    op.drop_table("pack_modules")
    op.drop_table("pack_reconversion")
    op.drop_table("modules")

"""
LMS core tables — clean UUID-based schema.

These tables coexist with the legacy BigInt tables in
``app.persistence.models.tables`` and are managed exclusively by Alembic.

Note: ``enrollments.apprenant_id`` and ``attendance.apprenant_id`` are
declared as String (not UUID) to match the existing ``users.id`` column type
so that the FK constraint works at database level.
"""

import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.persistence.session import Base


# ── modules ──────────────────────────────────────────────────────────────
class Module(Base):
    __tablename__ = "modules"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    titre = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    duree_minutes = Column(Integer, nullable=True)
    pdf_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── pack_reconversion ────────────────────────────────────────────────────
class PackReconversion(Base):
    __tablename__ = "pack_reconversion"
    __table_args__ = (
        CheckConstraint(
            "statut IN ('draft','active','archived')",
            name="ck_pack_reconversion_statut",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    nom = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    statut = Column(Text, nullable=False, server_default=text("'draft'"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── pack_modules (pivot) ─────────────────────────────────────────────────
class PackModule(Base):
    __tablename__ = "pack_modules"

    pack_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pack_reconversion.id", ondelete="CASCADE"),
        primary_key=True,
    )
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
        primary_key=True,
    )
    ordre = Column(Integer, nullable=False, server_default=text("0"))


# ── groupes ──────────────────────────────────────────────────────────────
class Groupe(Base):
    __tablename__ = "groupes"
    __table_args__ = (
        CheckConstraint(
            "type IN ('ponctuelle','reconversion')",
            name="ck_groupes_type",
        ),
        CheckConstraint(
            "statut IN ('pending','active','completed','archived')",
            name="ck_groupes_statut",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    nom = Column(Text, nullable=False)
    type = Column(Text, nullable=False)
    statut = Column(Text, nullable=False, server_default=text("'pending'"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── enrollments ──────────────────────────────────────────────────────────
class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint(
            "apprenant_id", "groupe_id",
            name="uq_enrollment_apprenant_groupe",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    apprenant_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    groupe_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groupes.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── sessions ─────────────────────────────────────────────────────────────
class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint(
            "statut IN ('planifiee','en_cours','terminee','annulee')",
            name="ck_sessions_statut",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="SET NULL"),
        nullable=True,
    )
    titre = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    heure_debut = Column(Time, nullable=True)
    duree_minutes = Column(Integer, nullable=True)
    lieu = Column(Text, nullable=True)
    statut = Column(Text, nullable=False, server_default=text("'planifiee'"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── session_groups (pivot N-N) ───────────────────────────────────────────
class SessionGroup(Base):
    __tablename__ = "session_groups"

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    groupe_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groupes.id", ondelete="CASCADE"),
        primary_key=True,
    )


# ── attendance ───────────────────────────────────────────────────────────
class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint(
            "session_id", "apprenant_id",
            name="uq_attendance_session_apprenant",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    apprenant_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    present = Column(Boolean, nullable=False, server_default=text("false"))
    marked_at = Column(DateTime(timezone=True), nullable=True)


# ── progression (ponctuelle — heures) ────────────────────────────────────
class Progression(Base):
    __tablename__ = "progression"
    __table_args__ = (
        UniqueConstraint(
            "enrollment_id", "module_id",
            name="uq_progression_enrollment_module",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    enrollment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("enrollments.id", ondelete="CASCADE"),
        nullable=False,
    )
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
    )
    minutes_validees = Column(Integer, nullable=False, server_default=text("0"))
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


# ── pack_progression (reconversion — déverrouillage séquentiel) ──────────
class PackProgression(Base):
    __tablename__ = "pack_progression"
    __table_args__ = (
        UniqueConstraint(
            "enrollment_id", "module_id",
            name="uq_pack_progression_enrollment_module",
        ),
        CheckConstraint(
            "statut IN ('locked','open','done')",
            name="ck_pack_progression_statut",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    enrollment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("enrollments.id", ondelete="CASCADE"),
        nullable=False,
    )
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
    )
    statut = Column(Text, nullable=False, server_default=text("'locked'"))
    unlocked_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

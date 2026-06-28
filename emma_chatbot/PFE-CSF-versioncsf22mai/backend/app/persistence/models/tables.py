"""
Tables PostgreSQL — lecture / écriture via FastAPI uniquement.
Les migrations SQL restent dans `backend/sql/` (ou Alembic plus tard).
"""

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.sql import func

from app.persistence.session import Base


# --- Auth (utilisateurs) ---
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    password_hash = Column("password_hash", String, nullable=True)
    google_id = Column("google_id", String, unique=True, nullable=True, index=True)
    first_name = Column("first_name", String, nullable=True)
    last_name = Column("last_name", String, nullable=True)
    phone = Column("phone", String, nullable=True)
    learner_cv = Column("learner_cv", JSONB, nullable=True)
    photo_url = Column("photo_url", String, nullable=True)
    role = Column(
        String(32),
        nullable=False,
        server_default=text("'apprenant'"),
    )


# --- Admin apprenants : groupes, accès et suivi ---
class ApprenantGroup(Base):
    __tablename__ = "apprenant_group"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    format = Column(Text, nullable=False)
    reconversion_topic_slug = Column("reconversion_topic_slug", Text, nullable=True, index=True)
    reconversion_pack_id = Column("reconversion_pack_id", BigInteger, nullable=True, index=True)
    ponctuelle_formation_slug = Column("ponctuelle_formation_slug", Text, nullable=True, index=True)
    ponctuelle_formation_slugs = Column("ponctuelle_formation_slugs", JSONB, nullable=True)
    start_date = Column("start_date", Date, nullable=True)
    end_date = Column("end_date", Date, nullable=True)
    status = Column("status", Text, nullable=False, server_default=text("'pending'"))
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApprenantGroupMember(Base):
    __tablename__ = "apprenant_group_member"
    __table_args__ = (
        UniqueConstraint("group_id", "email_normalized", name="uq_apprenant_group_member_group_email"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(
        "group_id",
        BigInteger,
        ForeignKey("apprenant_group.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        "user_id",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    email = Column(Text, nullable=False)
    email_normalized = Column("email_normalized", Text, nullable=False, index=True)
    first_name = Column("first_name", Text, nullable=True)
    last_name = Column("last_name", Text, nullable=True)
    status = Column("status", Text, nullable=False, server_default=text("'pending'"))
    points_total = Column("points_total", Integer, nullable=False, server_default=text("0"))
    linked_at = Column("linked_at", DateTime(timezone=True), nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApprenantGroupAccess(Base):
    __tablename__ = "apprenant_group_access"
    __table_args__ = (
        UniqueConstraint("group_id", "access_kind", "target_ref", name="uq_apprenant_group_access_target"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(
        "group_id",
        BigInteger,
        ForeignKey("apprenant_group.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    access_kind = Column("access_kind", Text, nullable=False)
    target_ref = Column("target_ref", Text, nullable=False)
    label = Column("label", Text, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class GroupSession(Base):
    __tablename__ = "group_session"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(
        "group_id",
        BigInteger,
        ForeignKey("apprenant_group.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    planning_session_id = Column(
        "planning_session_id",
        BigInteger,
        ForeignKey("planning_session.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    access_id = Column(
        "access_id",
        BigInteger,
        ForeignKey("apprenant_group_access.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_ref = Column("target_ref", Text, nullable=True, index=True)
    target_kind = Column("target_kind", Text, nullable=True)
    target_label = Column("target_label", Text, nullable=True)
    title = Column(Text, nullable=False)
    scheduled_at = Column("scheduled_at", DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column("duration_minutes", Integer, nullable=False, server_default=text("0"))
    status = Column("status", Text, nullable=False, server_default=text("'planned'"))
    notes = Column(Text, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SessionAttendance(Base):
    __tablename__ = "session_attendance"
    __table_args__ = (
        UniqueConstraint("session_id", "member_id", name="uq_session_attendance_member"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    session_id = Column(
        "session_id",
        BigInteger,
        ForeignKey("group_session.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id = Column(
        "member_id",
        BigInteger,
        ForeignKey("apprenant_group_member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column("status", Text, nullable=False, server_default=text("'present'"))
    note = Column(Text, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LearnerProgress(Base):
    __tablename__ = "learner_progress"
    __table_args__ = (
        UniqueConstraint("member_id", "target_ref", name="uq_learner_progress_target"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        "member_id",
        BigInteger,
        ForeignKey("apprenant_group_member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    access_kind = Column("access_kind", Text, nullable=False)
    target_ref = Column("target_ref", Text, nullable=False, index=True)
    title = Column(Text, nullable=False)
    progress_percent = Column("progress_percent", Integer, nullable=False, server_default=text("0"))
    status = Column("status", Text, nullable=False, server_default=text("'not_started'"))
    score_percent = Column("score_percent", Integer, nullable=True)
    current_flag = Column("current_flag", Boolean, nullable=False, server_default=text("false"))
    locked = Column("locked", Boolean, nullable=False, server_default=text("false"))
    opened_by_admin = Column("opened_by_admin", Boolean, nullable=False, server_default=text("false"))
    completed_by_admin = Column("completed_by_admin", Boolean, nullable=False, server_default=text("false"))
    progress_mode = Column("progress_mode", Text, nullable=False, server_default=text("'manual'"))
    minutes_completed = Column("minutes_completed", Integer, nullable=False, server_default=text("0"))
    minutes_total = Column("minutes_total", Integer, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LearnerCertificationResult(Base):
    __tablename__ = "learner_certification_result"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        "member_id",
        BigInteger,
        ForeignKey("apprenant_group_member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(Text, nullable=False)
    scope_ref = Column("scope_ref", Text, nullable=True, index=True)
    score_percent = Column("score_percent", Integer, nullable=True)
    status = Column("status", Text, nullable=False, server_default=text("'pending'"))
    issuer = Column(Text, nullable=True)
    awarded_at = Column("awarded_at", DateTime(timezone=True), nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApprenantMemberNote(Base):
    __tablename__ = "apprenant_member_note"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        "member_id",
        BigInteger,
        ForeignKey("apprenant_group_member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_user_id = Column(
        "author_user_id",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    author_name = Column("author_name", Text, nullable=False)
    note_type = Column("note_type", Text, nullable=False, server_default=text("'info'"))
    content = Column(Text, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())


class AdminPlanningReminderRule(Base):
    __tablename__ = "admin_planning_reminder_rule"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    label = Column(Text, nullable=False)
    enabled = Column("enabled", Boolean, nullable=False, server_default=text("true"))
    hours_before = Column("hours_before", Integer, nullable=False, server_default=text("24"))
    channel_email = Column("channel_email", Boolean, nullable=False, server_default=text("true"))
    channel_sms = Column("channel_sms", Boolean, nullable=False, server_default=text("false"))
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class GoogleCalendarToken(Base):
    __tablename__ = "google_calendar_token"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        "user_id",
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column("token_expiry", DateTime(timezone=True), nullable=True)
    calendar_id = Column("calendar_id", Text, nullable=False, server_default=text("'primary'"))
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PlanningSession(Base):
    __tablename__ = "planning_session"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    module_target_ref = Column("module_target_ref", Text, nullable=True, index=True)
    module_label = Column("module_label", Text, nullable=True)
    date = Column(Date, nullable=False)
    start_time = Column("start_time", Text, nullable=True)
    duration_minutes = Column("duration_minutes", Integer, nullable=False, server_default=text("0"))
    location = Column(Text, nullable=True)
    status = Column("status", Text, nullable=False, server_default=text("'planned'"))
    google_event_id = Column("google_event_id", Text, nullable=True, index=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PlanningSessionGroup(Base):
    __tablename__ = "planning_session_group"
    __table_args__ = (
        UniqueConstraint("session_id", "group_id", name="uq_planning_session_group"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    session_id = Column("session_id", BigInteger, ForeignKey("planning_session.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column("group_id", BigInteger, ForeignKey("apprenant_group.id", ondelete="CASCADE"), nullable=False, index=True)


class PlanningAttendance(Base):
    __tablename__ = "planning_attendance"
    __table_args__ = (
        UniqueConstraint("session_id", "member_id", name="uq_planning_attendance_session_member"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    session_id = Column("session_id", BigInteger, ForeignKey("planning_session.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column("member_id", BigInteger, ForeignKey("apprenant_group_member.id", ondelete="CASCADE"), nullable=False, index=True)
    present = Column(Boolean, nullable=False, server_default=text("false"))
    marked_at = Column("marked_at", DateTime(timezone=True), nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())


class ModuleTestScore(Base):
    __tablename__ = "module_test_score"
    __table_args__ = (
        UniqueConstraint("member_id", "module_ref", name="uq_module_test_score_member_module"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        "member_id",
        BigInteger,
        ForeignKey("apprenant_group_member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module_ref = Column("module_ref", Text, nullable=False, index=True)
    score_percent = Column("score_percent", Integer, nullable=False)
    passed = Column("passed", Boolean)
    source = Column("source", Text, nullable=False, server_default=text("'lms'"))
    external_ref = Column("external_ref", Text, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ValidationDocument(Base):
    __tablename__ = "validation_document"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(
        "member_id",
        BigInteger,
        ForeignKey("apprenant_group_member.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kind = Column("kind", Text, nullable=False)
    scope_ref = Column("scope_ref", Text, nullable=False, index=True)
    scope_label = Column("scope_label", Text, nullable=False)
    presence_percent = Column("presence_percent", Integer, nullable=False)
    absence_count = Column("absence_count", Integer, nullable=False, server_default=text("0"))
    absence_sessions = Column("absence_sessions", JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    test_score_percent = Column("test_score_percent", Integer, nullable=True)
    system_result = Column("system_result", Text, nullable=False)
    system_reason = Column("system_reason", Text, nullable=False)
    status = Column("status", Text, nullable=False, server_default=text("'pending_admin'"), index=True)
    rejection_reason = Column("rejection_reason", Text, nullable=True)
    reviewed_by_user_id = Column(
        "reviewed_by_user_id",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at = Column("reviewed_at", DateTime(timezone=True), nullable=True)
    pdf_path = Column("pdf_path", Text, nullable=True)
    submitted_at = Column("submitted_at", DateTime(timezone=True), server_default=func.now())
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LearnerNotification(Base):
    __tablename__ = "learner_notification"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        "user_id",
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind = Column("kind", Text, nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=True)
    link_ref = Column("link_ref", Text, nullable=True)
    is_read = Column("is_read", Boolean, nullable=False, server_default=text("false"))
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    expires_at = Column("expires_at", DateTime(timezone=True), nullable=True)


class StaffInvite(Base):
    __tablename__ = "staff_invite"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(Text, nullable=False, unique=True)
    email_normalized = Column("email_normalized", Text, nullable=False, unique=True)
    role = Column(Text, nullable=False, server_default=text("'assistant'"))
    status = Column(Text, nullable=False, server_default=text("'pending'"))
    user_id = Column(
        "user_id",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    invited_by = Column(
        "invited_by",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    permissions = Column(JSONB, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_id = Column(
        "actor_id",
        Text,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    actor_role = Column("actor_role", Text, nullable=False)
    actor_name = Column("actor_name", Text, nullable=False)
    action = Column(Text, nullable=False)
    detail = Column(Text, nullable=True)
    entity_kind = Column("entity_kind", Text, nullable=True)
    entity_id = Column("entity_id", Text, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())


class MemberEnrollment(Base):
    __tablename__ = "member_enrollment"
    __table_args__ = (
        UniqueConstraint(
            "email_normalized",
            "enrollment_kind",
            "target_ref",
            name="uq_member_enrollment",
        ),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(Text, nullable=False)
    email_normalized = Column("email_normalized", Text, nullable=False)
    user_id = Column(
        "user_id",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    enrollment_kind = Column("enrollment_kind", Text, nullable=False)
    target_ref = Column("target_ref", Text, nullable=False)
    target_label = Column("target_label", Text, nullable=False)
    enrolled_by = Column(
        "enrolled_by",
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status = Column(Text, nullable=False, server_default=text("'active'"))
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


Index("idx_apprenant_group_scope", ApprenantGroup.format, ApprenantGroup.reconversion_topic_slug, ApprenantGroup.ponctuelle_formation_slug)
Index("idx_group_session_group_date", GroupSession.group_id, GroupSession.scheduled_at.desc())
Index("idx_progress_member_current", LearnerProgress.member_id, LearnerProgress.current_flag)
Index("idx_learner_notification_user_read", LearnerNotification.user_id, LearnerNotification.is_read)


# --- Accueil : partenaires & collaborations ---
class Collaboration(Base):
    __tablename__ = "collaborations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    background_image = Column("background_image", Text, nullable=False)


class PartnerLogo(Base):
    __tablename__ = "partner_logos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    logo_path = Column("logo_path", Text, nullable=False)
    is_active = Column("is_active", Boolean, nullable=False, default=True)
    sort_order = Column("sort_order", Integer, nullable=False, default=0)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HomePageHero(Base):
    """Singleton logique (id = 1) : image de fond du hero page d’accueil (URL ou chemin `/images/…`)."""

    __tablename__ = "home_page_hero"

    id = Column(Integer, primary_key=True)
    background_image = Column("background_image", Text, nullable=False)


# --- Certifications ---
class CertificationsHero(Base):
    __tablename__ = "certifications_hero"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    subtitle = Column(Text, nullable=False)
    background_image = Column(Text, nullable=False)
    stats = Column(JSONB, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# --- Formation : cartes thématiques / reconversion / ponctuelle ---
class FormationTopicCard(Base):
    __tablename__ = "formation_topic_card"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    titre = Column(Text, nullable=False)
    image = Column(Text, nullable=False)
    formation_type = Column("type", Text, nullable=False)
    reconversion_slug = Column("reconversion_slug", Text, nullable=True, unique=True)
    ponctuelle_slug = Column("ponctuelle_slug", Text, nullable=True, unique=True)


class PonctuelleFormation(Base):
    __tablename__ = "ponctuelle_formation"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    slug = Column(Text, unique=True, nullable=False)
    topic_card_id = Column("topic_card_id", BigInteger, unique=True, nullable=True)
    hero_title = Column("hero_title", Text, nullable=False)
    hero_subtitle = Column("hero_subtitle", Text, nullable=False)
    hero_background_image = Column("hero_background_image", Text, nullable=True)


class PonctuelleModule(Base):
    __tablename__ = "ponctuelle_module"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    formation_id = Column("formation_id", BigInteger, nullable=False, index=True)
    sort_order = Column("sort_order", Integer, nullable=False, default=0)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column("image_url", Text, nullable=False)
    duration = Column(Text, nullable=False)
    practice = Column(Text, nullable=False)
    project = Column(Text, nullable=False)
    evaluation = Column(Text, nullable=False)
    hover_detail = Column("hover_detail", Text, nullable=True)
    is_certified = Column("is_certified", Boolean, nullable=False, default=True)
    exclude_from_certifications_page = Column(
        "exclude_from_certifications_page",
        Boolean,
        nullable=False,
        server_default="false",
    )


class CertificationCard(Base):
    """
    Source unique pour les cartes /certifications (lecture API sans jointure).
    `category` = `formation_topic_card.ponctuelle_slug` du topic (même valeur que les boutons filtres).
    Sync auto depuis `ponctuelle_module` (voir `services.certifications.card_sync`). Cartes manuelles : sans `module_id`.
    """

    __tablename__ = "certification_card"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sort_order = Column(Integer, nullable=False, default=0)
    category = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    subtitle = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    skills = Column(ARRAY(String), nullable=True)
    icon_key = Column(Text, nullable=True)
    is_certified = Column("is_certified", Boolean, nullable=False, default=True)
    module_id = Column(
        "module_id",
        BigInteger,
        ForeignKey("ponctuelle_module.id", ondelete="CASCADE"),
        unique=True,
        nullable=True,
    )
    image_url = Column("image_url", Text, nullable=False)


class ReconversionTopic(Base):
    __tablename__ = "reconversion_topic"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    slug = Column(Text, unique=True, nullable=False)
    topic_card_id = Column("topic_card_id", BigInteger, unique=True, nullable=True)
    hero_title = Column("hero_title", Text, nullable=False)
    hero_subtitle = Column("hero_subtitle", Text, nullable=False)
    hero_background_image = Column("hero_background_image", Text, nullable=True)


class ReconversionTopicStat(Base):
    __tablename__ = "reconversion_topic_stat"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_id = Column("topic_id", BigInteger, nullable=False, index=True)
    label = Column(Text, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column("sort_order", Integer, nullable=False, default=0)


class ReconversionPack(Base):
    __tablename__ = "reconversion_pack"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_id = Column("topic_id", BigInteger, nullable=False, index=True)
    pack_kind = Column("pack_kind", Text, nullable=False)
    variant_slug = Column("variant_slug", Text, nullable=False)
    tab_label = Column("tab_label", Text, nullable=False)
    badge_label = Column("badge_label", Text, nullable=False)
    style_key = Column("style_key", Text, nullable=False)
    card_title = Column("card_title", Text, nullable=False)
    image_url = Column("image_url", Text, nullable=False)
    sort_order = Column("sort_order", Integer, nullable=False, default=0)


class ReconversionPackModule(Base):
    __tablename__ = "reconversion_pack_module"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    pack_id = Column("pack_id", BigInteger, nullable=False, index=True)
    title = Column(Text, nullable=False)
    module_kind = Column("module_kind", Text, nullable=False)
    sort_order = Column("sort_order", Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    image_url = Column("image_url", Text, nullable=True)
    duree = Column("duree", Text, nullable=True)
    pratique = Column("pratique", Text, nullable=True)
    projet = Column("projet", Text, nullable=True)
    evaluation = Column(Text, nullable=True)


class SurMesureModule(Base):
    __tablename__ = "sur_mesure_module"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False, server_default=text("''"))
    duration_hours = Column("duration_hours", Integer, nullable=False, server_default=text("24"))
    labs_count = Column("labs_count", Integer, nullable=False, server_default=text("0"))
    has_exam = Column("has_exam", Boolean, nullable=False, server_default=text("true"))
    sort_order = Column("sort_order", Integer, nullable=False, server_default=text("0"))
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class ModuleSupport(Base):
    """Fichiers PDF rattachés à un module (reconversion pack, ponctuelle ou sur-mesure)."""

    __tablename__ = "module_support"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    module_source = Column("module_source", Text, nullable=False, index=True)
    module_id = Column("module_id", BigInteger, nullable=False, index=True)
    file_name = Column("file_name", Text, nullable=False)
    file_path = Column("file_path", Text, nullable=False)
    mime_type = Column("mime_type", Text, nullable=True)
    size_bytes = Column("size_bytes", BigInteger, nullable=True)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now())


# --- Chat IA : conversations persistées (invité + authentifié) ---
class AIConversation(Base):
    __tablename__ = "ai_conversation"

    id = Column(String(36), primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    guest_session_id = Column(String(36), nullable=True, index=True)
    external_session_id = Column(String(64), nullable=False, index=True)
    title = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, server_default=text("'active'"))
    is_temporary = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)


class AIMessage(Base):
    __tablename__ = "ai_message"

    id = Column(String(36), primary_key=True)
    conversation_id = Column(
        String(36),
        ForeignKey("ai_conversation.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(32), nullable=False, server_default=text("'text'"))
    meta = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AIConversationFile(Base):
    __tablename__ = "ai_conversation_file"

    id = Column(String(36), primary_key=True)
    conversation_id = Column(
        String(36),
        ForeignKey("ai_conversation.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    guest_session_id = Column(String(36), nullable=True, index=True)
    file_kind = Column(String(32), nullable=False, server_default=text("'cv'"))
    storage_key = Column(Text, nullable=False)
    original_name = Column(Text, nullable=True)
    mime_type = Column(String(128), nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    parsed_payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)


class PageVisit(Base):
    """Tracks anonymous page visits on the public website."""
    __tablename__ = "page_visit"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    page_path = Column(Text, nullable=False, index=True)
    page_title = Column(Text, nullable=True)
    session_id = Column(String(64), nullable=False, index=True)
    visited_at = Column("visited_at", DateTime(timezone=True), server_default=func.now(), index=True)

"""
Tables PostgreSQL — lecture / écriture via FastAPI uniquement.
Les migrations SQL restent dans `backend/sql/` (ou Alembic plus tard).
"""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, Integer, String, Text, text
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
    role = Column(
        String(32),
        nullable=False,
        server_default=text("'apprenant'"),
    )


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

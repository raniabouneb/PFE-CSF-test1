"""Image hero alignée sur la carte thématique `/formation` (`formation_topic_card.image`)."""

from __future__ import annotations

from typing import Literal

from sqlalchemy.orm import Session

from app.persistence.models import FormationTopicCard

FormationTopicKind = Literal["reconversion", "ponctuelle"]


def _card_image(card: FormationTopicCard | None) -> str | None:
    if card is None:
        return None
    img = (card.image or "").strip()
    return img or None


def _topic_card_by_id(db: Session, topic_card_id: int | None) -> FormationTopicCard | None:
    if topic_card_id is None:
        return None
    return db.get(FormationTopicCard, int(topic_card_id))


def _topic_card_by_slug(
    db: Session, *, slug: str, formation_type: FormationTopicKind
) -> FormationTopicCard | None:
    s = (slug or "").strip()
    if not s:
        return None
    q = db.query(FormationTopicCard)
    if formation_type == "reconversion":
        return q.filter(FormationTopicCard.reconversion_slug == s).first()
    return q.filter(FormationTopicCard.ponctuelle_slug == s).first()


def resolve_topic_hero_background_url(
    db: Session,
    *,
    topic_card_id: int | None,
    hero_background_image: str | None,
    topic_slug: str | None = None,
    formation_type: FormationTopicKind | None = None,
) -> str | None:
    """
    Priorité : visuel de la carte thématique liée (même source que `/formation`),
    puis `hero_background_image` du parcours si aucune carte trouvée.
    """
    card = _topic_card_by_id(db, topic_card_id)
    if img := _card_image(card):
        return img

    if formation_type and topic_slug:
        card = _topic_card_by_slug(db, slug=topic_slug, formation_type=formation_type)
        if img := _card_image(card):
            return img

    bg = (hero_background_image or "").strip()
    return bg or None

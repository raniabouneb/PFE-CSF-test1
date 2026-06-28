"""Grilles cartes thématiques sur `/formation` (reconversion & ponctuelle)."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.constants.public_urls import (
    formation_ponctuelle_detail_href,
    formation_topic_filter_key,
    href_for_reconversion_title,
    ponctuelle_slug_ok,
)
from app.persistence.models import FormationTopicCard, PonctuelleFormation, ReconversionTopic
from app.domains.catalog.ponctuelle_formations import _find_formation_by_slug

logger = logging.getLogger(__name__)


def _card_kind(row: FormationTopicCard) -> str:
    """`type` en base peut être NULL : évite AttributeError sur .strip()."""
    return (str(row.formation_type or "")).strip().lower()


def _slug_map_reconversion(db: Session, card_ids: list[int]) -> dict[str, str]:
    if not card_ids:
        return {}
    rows = (
        db.query(ReconversionTopic.topic_card_id, ReconversionTopic.slug)
        .filter(ReconversionTopic.topic_card_id.in_(card_ids))
        .all()
    )
    return {str(r.topic_card_id): r.slug for r in rows if r.topic_card_id is not None}


def _slug_map_ponctuelle(db: Session, card_ids: list[int]) -> dict[str, str]:
    """
    topic_card_id -> slug `ponctuelle_formation.slug` (URL / détail API).
    Si plusieurs formations partagent une même carte thématique, on garde la première (id croissant).
    """
    if not card_ids:
        return {}
    rows = (
        db.query(PonctuelleFormation.topic_card_id, PonctuelleFormation.slug)
        .filter(PonctuelleFormation.topic_card_id.in_(card_ids))
        .order_by(PonctuelleFormation.id.asc())
        .all()
    )
    out: dict[str, str] = {}
    for r in rows:
        if r.topic_card_id is None:
            continue
        s = (r.slug or "").strip()
        if not s or s.lower() in ("null", "none", "undefined"):
            continue
        key = str(r.topic_card_id)
        if key not in out:
            out[key] = s
    return out


def get_formation_topic_cards_payload(db: Session) -> dict[str, Any] | None:
    # Pas de sync certification_card ici : évite de réinsérer des lignes supprimées au chargement
    # (voir services.certifications.card_sync + scripts/run_sync_and_summary.py pour un backfill manuel).
    rows = db.query(FormationTopicCard).order_by(FormationTopicCard.id.asc()).all()
    if not rows:
        return None

    reconversion_rows = [r for r in rows if _card_kind(r) == "reconversion"]
    ponctuelle_rows = [r for r in rows if _card_kind(r) == "ponctuelle"]

    rc_ids = [
        int(r.id)
        for r in reconversion_rows
        if not (r.reconversion_slug or "").strip()
    ]
    # Toujours résoudre `ponctuelle_formation.slug` pour chaque carte ponctuelle (pas seulement si
    # `ponctuelle_slug` est vide sur la carte). Sinon le lien utilisait le libellé carte → 404.
    po_topic_ids = [int(r.id) for r in ponctuelle_rows]

    slug_by_rc = _slug_map_reconversion(db, rc_ids)
    slug_by_po = _slug_map_ponctuelle(db, po_topic_ids)

    reconversion: list[dict[str, Any]] = []
    ponctuelle: list[dict[str, Any]] = []

    for row in rows:
        kind = _card_kind(row)
        if kind == "reconversion":
            explicit = (row.reconversion_slug or "").strip()
            slug = explicit or slug_by_rc.get(str(row.id))
            href = (
                f"/formation/reconversion/{slug}"
                if slug
                else href_for_reconversion_title(row.titre)
            )
            reconversion.append(
                {"title": row.titre, "image": row.image, "href": href}
            )
        elif kind == "ponctuelle":
            explicit = (row.ponctuelle_slug or "").strip()
            fallback = slug_by_po.get(str(row.id))
            # URL : ne jamais deviner un segment sans ligne `ponctuelle_formation`, sinon Next → 404.
            # Ordre des candidats : slug lié à la carte, slug explicite sur la carte, titre (empreinte comme l’API).
            raw_slug: str | None = None
            for candidate in (
                fallback if ponctuelle_slug_ok(fallback) else None,
                explicit if ponctuelle_slug_ok(explicit) else None,
                (row.titre or "").strip() or None,
            ):
                if not candidate:
                    continue
                fr = _find_formation_by_slug(db, candidate)
                if fr:
                    s = (fr.slug or "").strip()
                    if ponctuelle_slug_ok(s):
                        raw_slug = s
                        break
            href = formation_ponctuelle_detail_href(raw_slug)
            # Même clé que `certification_card.category` / boutons filtres (slug ou titre si slug NULL).
            filter_key = formation_topic_filter_key(row.ponctuelle_slug, row.titre)
            ponctuelle.append(
                {
                    "title": row.titre,
                    "image": row.image,
                    "href": href,
                    "ponctuelleSlug": filter_key,
                }
            )

    if not reconversion and not ponctuelle:
        return None
    return {"reconversion": reconversion, "ponctuelle": ponctuelle}

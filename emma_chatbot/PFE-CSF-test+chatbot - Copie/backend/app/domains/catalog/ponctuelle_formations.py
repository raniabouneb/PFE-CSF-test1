"""Formations à la carte (liste + page détail par slug)."""

from __future__ import annotations

import unicodedata
from typing import Any
from urllib.parse import unquote

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domains.catalog.module_support_public import batch_supports_map, supports_payload_for_module
from app.domains.catalog.topic_hero_background import resolve_topic_hero_background_url
from app.persistence.models import PonctuelleFormation, PonctuelleModule


def _normalize_slug_for_lookup(s: str) -> str:
    """
    Clé stable pour comparer slug URL / BD : casse, tirets Unicode (U+2010…U+2014),
    tiret pleine chasse (U+FF0D), espaces en bord.
    """
    if not s:
        return ""
    t = unicodedata.normalize("NFC", (s or "").strip())
    for old in ("\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\uff0d"):
        t = t.replace(old, "-")
    t = t.replace("\ufeff", "")
    return t.lower()


def _slug_fingerprint(s: str) -> str:
    """
    Empreinte pour matcher URL / BD même si l’URL contient des accents ou libellés
    (ex. `/formations-ponctuelles/Système-Embarqué` vs slug BD `Système Embarqué` avec espace).
    Virgules / espaces / tirets Unicode sont unifiés avant comparaison.
    """
    if not s:
        return ""
    t = unicodedata.normalize("NFC", (s or "").strip())
    for old in ("\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\uff0d"):
        t = t.replace(old, "-")
    t = t.replace("\ufeff", "")
    for ch in ",;":
        t = t.replace(ch, " ")
    t = " ".join(t.split())
    t = t.replace(" ", "-")
    t = t.lower()
    nfd = unicodedata.normalize("NFD", t)
    folded = "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")
    while "--" in folded:
        folded = folded.replace("--", "-")
    return folded.strip("-")


def _find_formation_by_slug(db: Session, slug: str) -> PonctuelleFormation | None:
    """Recherche insensible à la casse ; repli tirets / accents / libellés."""
    raw = (slug or "").strip()
    if "%" in raw:
        raw = unquote(raw).strip()
    if not raw or raw.lower() in ("null", "none", "undefined"):
        return None

    key = _normalize_slug_for_lookup(raw)
    want_fp = _slug_fingerprint(raw)

    # `ilike` + trim : insensible à la casse ; évite écarts d’espaces invisibles vs `==`
    row = (
        db.query(PonctuelleFormation)
        .filter(func.trim(PonctuelleFormation.slug).ilike(raw.strip()))
        .first()
    )
    if row is not None:
        return row

    for r in (
        db.query(PonctuelleFormation)
        .order_by(PonctuelleFormation.id.asc())
        .all()
    ):
        rslug = r.slug or ""
        if _normalize_slug_for_lookup(rslug) == key:
            return r
        if _slug_fingerprint(rslug) == want_fp:
            return r
        # URL parfois calquée sur le hero / libellé plutôt que sur `slug` ASCII
        rtitle = (r.hero_title or "").strip()
        if rtitle and _slug_fingerprint(rtitle) == want_fp:
            return r
    return None


def _ponctuelle_modules_joined_query(db: Session):
    return (
        db.query(PonctuelleModule, PonctuelleFormation)
        .join(PonctuelleFormation, PonctuelleModule.formation_id == PonctuelleFormation.id)
        .order_by(
            PonctuelleFormation.id.asc(),
            PonctuelleModule.sort_order.asc(),
            PonctuelleModule.id.asc(),
        )
    )


def _module_public_payload(
    m: PonctuelleModule, sup_map: dict[int, list[dict[str, Any]]]
) -> dict[str, Any]:
    return {
        "id": str(m.id),
        "imageUrl": m.image_url,
        "title": m.title,
        "description": m.description,
        "duration": m.duration,
        "practice": m.practice,
        "project": m.project,
        "evaluation": m.evaluation,
        "hoverDetail": m.hover_detail,
        "isCertified": m.is_certified,
        "supports": supports_payload_for_module(sup_map.get(int(m.id), [])),
    }


def search_ponctuelle_modules(db: Session, q: str = "") -> list[dict[str, Any]]:
    """Titres modules ponctuels (filtre optionnel sur le titre)."""
    query = _ponctuelle_modules_joined_query(db)
    term = (q or "").strip()
    if term:
        query = query.filter(PonctuelleModule.title.ilike(f"%{term}%"))
    rows = query.all()
    out = [
        {
            "id": str(m.id),
            "title": m.title,
            "formationSlug": f.slug,
            "formationTitle": f.hero_title,
        }
        for m, f in rows
    ]
    return sorted(out, key=lambda x: (x.get("title") or "").casefold())


def get_all_ponctuelle_modules_catalog(db: Session) -> dict[str, Any]:
    """Tous les modules ponctuels (cartes page catalogue)."""
    rows = _ponctuelle_modules_joined_query(db).all()
    mod_ids = [int(m.id) for m, _ in rows]
    sup_map = batch_supports_map(db, "ponctuelle_module", mod_ids)
    return {
        "modules": [
            {
                **_module_public_payload(m, sup_map),
                "formationSlug": f.slug,
                "formationTitle": f.hero_title,
            }
            for m, f in rows
        ]
    }


def list_ponctuelle_formations(db: Session) -> list[dict[str, str]]:
    rows = (
        db.query(PonctuelleFormation)
        .order_by(PonctuelleFormation.id.asc())
        .all()
    )
    return [{"slug": r.slug, "title": r.hero_title} for r in rows]


def get_ponctuelle_formation_by_slug(
    db: Session, slug: str
) -> dict[str, Any] | None:
    row = _find_formation_by_slug(db, slug)
    if not row:
        return None

    mods = (
        db.query(PonctuelleModule)
        .filter(PonctuelleModule.formation_id == row.id)
        .order_by(PonctuelleModule.sort_order.asc(), PonctuelleModule.id.asc())
        .all()
    )
    mod_ids = [int(m.id) for m in mods]
    sup_map = batch_supports_map(db, "ponctuelle_module", mod_ids)

    hero: dict[str, Any] = {
        "title": row.hero_title,
        "subtitle": row.hero_subtitle,
    }
    if bg := resolve_topic_hero_background_url(
        db,
        topic_card_id=row.topic_card_id,
        hero_background_image=row.hero_background_image,
        topic_slug=row.slug,
        formation_type="ponctuelle",
    ):
        hero["backgroundImageUrl"] = bg

    return {
        "slug": row.slug,
        "hero": hero,
        "modules": [_module_public_payload(m, sup_map) for m in mods],
    }

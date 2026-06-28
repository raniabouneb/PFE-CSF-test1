"""Formations à la carte (liste + page détail par slug)."""

from __future__ import annotations

import unicodedata
from typing import Any
from urllib.parse import unquote

from sqlalchemy import func
from sqlalchemy.orm import Session

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

    bg = (row.hero_background_image or "").strip()
    hero: dict[str, Any] = {
        "title": row.hero_title,
        "subtitle": row.hero_subtitle,
    }
    if bg:
        hero["backgroundImageUrl"] = bg

    return {
        "slug": row.slug,
        "hero": hero,
        "modules": [
            {
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
            }
            for m in mods
        ],
    }

"""Page /certifications — hero depuis `certifications_hero` ; cartes : jointure module optionnelle pour titre/description/image uniquement."""

from __future__ import annotations

import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.constants.public_urls import formation_topic_filter_key
from app.persistence.models import CertificationsHero, FormationTopicCard

logger = logging.getLogger(__name__)

# Révision API certifications : 2 = aucune écriture certification_card sur les routes GET.
CERTIFICATIONS_API_REVISION = 2

DEFAULT_STATS: list[dict[str, str]] = [
    {"value": "24+", "label": "Certifications"},
    {"value": "4 800+", "label": "Certifiés"},
    {"value": "96%", "label": "Taux de Réussite"},
    {"value": "48h", "label": "Support Réactif"},
]


def _ponctuelle_filter_slugs_and_titles(db: Session) -> list[tuple[str, str]]:
    """
    Filtres = slug ponctuel ou, si NULL en base, `titre` (aligné sur sync certification_card).
    """
    rows = (
        db.query(FormationTopicCard).order_by(FormationTopicCard.id.asc()).all()
    )
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for r in rows:
        kind = (str(r.formation_type or "")).strip().lower()
        if kind != "ponctuelle":
            continue
        key = formation_topic_filter_key(r.ponctuelle_slug, r.titre)
        if not key:
            continue
        if key in seen:
            continue
        seen.add(key)
        out.append((key, key))
    return out


# Colonnes `certification_card` mappées au JSON ; le reste (hors jointure) en camelCase.
_MAPPED_SNAKE_KEYS = frozenset(
    {
        "id",
        "created_at",
        "sort_order",
        "category",
        "title",
        "subtitle",
        "description",
        "skills",
        "icon_key",
        "is_certified",
        "module_id",
        "image_url",
    }
)

# Colonnes ajoutées par la jointure module (ne pas renvoyer au client telles quelles).
_JOIN_MODULE_KEYS = frozenset({"module_title", "module_description", "module_image_url"})


def _parse_stats(raw: Any) -> list[dict[str, str]]:
    if raw is None or not isinstance(raw, list) or len(raw) == 0:
        return list(DEFAULT_STATS)
    out: list[dict[str, str]] = []
    for item in raw:
        if isinstance(item, dict) and "value" in item and "label" in item:
            v, lb = item["value"], item["label"]
            if isinstance(v, str) and isinstance(lb, str):
                out.append({"value": v, "label": lb})
    return out if out else list(DEFAULT_STATS)


def _snake_to_camel(name: str) -> str:
    parts = name.split("_")
    if not parts:
        return name
    return parts[0] + "".join(p.capitalize() for p in parts[1:] if p)


def _jsonish_value(v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, date):
        return v.isoformat()
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, UUID):
        return str(v)
    if isinstance(v, (bytes, memoryview)):
        return None
    if isinstance(v, dict):
        return {str(k): _jsonish_value(val) for k, val in v.items()}
    if isinstance(v, (list, tuple)):
        return [_jsonish_value(x) for x in v]
    return v


def _normalize_icon_key(raw: str | None) -> str:
    if not raw:
        return "globe"
    k = raw.strip().lower()
    if k in ("cpu", "embedded"):
        return "cpu"
    if k in ("globe", "web"):
        return "globe"
    if k in ("barchart", "chart", "management"):
        return "barchart"
    return "globe"


def _clean_subtitle(raw: Any) -> str:
    if raw is None:
        return ""
    s = str(raw).strip()
    if s.upper() in ("NULL", "NONE"):
        return ""
    return s


def _clean_skills(raw: Any) -> list[str]:
    if raw is None:
        return []
    if not isinstance(raw, (list, tuple)):
        return []
    out: list[str] = []
    for x in raw:
        t = (str(x) if x is not None else "").strip()
        if not t or t.upper() == "NULL":
            continue
        out.append(t)
    return out


def _row_to_api_card(row: dict[str, Any], section_slug: str) -> dict[str, Any]:
    """
    Contrat JSON + extras camelCase.

    Titre, description et image affichés viennent toujours de `certification_card` (édition manuelle
    dans la table). La jointure `ponctuelle_module` sert au besoin d’autres usages ; on ne l’utilise
    pas pour écraser ces champs côté API.
    """
    mid = row.get("module_id")

    disp_title = str(row.get("title") or "")
    disp_description = str(row.get("description") or "")
    disp_image = (str(row.get("image_url") or "")).strip()

    out: dict[str, Any] = {
        "id": str(row["id"]),
        "formationSlug": section_slug,
        "category": (str(row.get("category") or "")).strip(),
        "title": disp_title,
        "subtitle": _clean_subtitle(row.get("subtitle")),
        "description": disp_description,
        "skills": _clean_skills(row.get("skills")),
        "iconKey": _normalize_icon_key(
            str(row["icon_key"]) if row.get("icon_key") is not None else None
        ),
        "imageUrl": disp_image,
        "isCertified": bool(row.get("is_certified", True)),
    }
    if mid is not None:
        out["moduleId"] = str(mid)
    if row.get("created_at") is not None:
        out["createdAt"] = _jsonish_value(row.get("created_at"))
    if row.get("sort_order") is not None:
        out["sortOrder"] = row.get("sort_order")

    for key, val in row.items():
        if key in _MAPPED_SNAKE_KEYS or key in _JOIN_MODULE_KEYS:
            continue
        ck = _snake_to_camel(key)
        if ck in out:
            continue
        out[ck] = _jsonish_value(val)

    return out


def get_certifications_page(db: Session) -> dict[str, Any]:
    """
    `certification_card` + LEFT JOIN `ponctuelle_module` (jointure optionnelle). L’affichage utilise
    les colonnes de `certification_card` uniquement.

    En cas d’erreur BD / données : retourne `{ "hero": null, "sections": [] }` (évite un 500 côté Next).

    Pas d’écriture en base ici. Nouvelles cartes : trigger SQL sur `ponctuelle_module` ; backfill ponctuel :
    `python -m scripts.run_sync_and_summary` depuis `backend/`.
    """
    sync_from_modules_ok = True
    try:
        hero_orm = (
            db.query(CertificationsHero).order_by(CertificationsHero.id.asc()).first()
        )

        hero: dict[str, Any] | None = None
        if hero_orm:
            hero = {
                "title": hero_orm.title,
                "subtitle": hero_orm.subtitle,
                "backgroundImage": hero_orm.background_image,
                "stats": _parse_stats(hero_orm.stats),
            }

        result = db.execute(
            text(
                """
                SELECT cc.*,
                       m.title AS module_title,
                       m.description AS module_description,
                       m.image_url AS module_image_url
                FROM certification_card cc
                LEFT JOIN ponctuelle_module m ON m.id = cc.module_id
                ORDER BY cc.sort_order ASC NULLS LAST, cc.id ASC
                """
            )
        ).mappings().all()

        rows = [dict(r) for r in result]

        category_order = _ponctuelle_filter_slugs_and_titles(db)
        canonical_titles = {title for _, title in category_order}
        buckets: dict[str, list[dict[str, Any]]] = {
            title: [] for _, title in category_order
        }
        extra_buckets: dict[str, list[dict[str, Any]]] = {}
        unnamed_bucket: list[dict[str, Any]] = []

        for row in rows:
            cat = (str(row.get("category") or "")).strip()
            if cat in canonical_titles:
                buckets[cat].append(row)
            else:
                if cat:
                    extra_buckets.setdefault(cat, []).append(row)
                else:
                    unnamed_bucket.append(row)

        sections: list[dict[str, Any]] = []
        for slug, title in category_order:
            sections.append(
                {
                    "slug": slug,
                    "title": title,
                    "cards": [_row_to_api_card(r, slug) for r in buckets[title]],
                }
            )

        for title in sorted(extra_buckets.keys(), key=lambda x: x.lower()):
            slug = formation_topic_filter_key(title, title) or title.lower().replace(" ", "-")
            sections.append(
                {
                    "slug": slug,
                    "title": title,
                    "cards": [_row_to_api_card(r, slug) for r in extra_buckets[title]],
                }
            )

        if unnamed_bucket:
            sections.append(
                {
                    "slug": "autres",
                    "title": "Autres",
                    "cards": [_row_to_api_card(r, "autres") for r in unnamed_bucket],
                }
            )

        return {
            "hero": hero,
            "sections": sections,
            "meta": {
                "syncFromModulesOk": sync_from_modules_ok,
                "revision": CERTIFICATIONS_API_REVISION,
                "readOnlyOnGet": True,
            },
        }
    except Exception:
        logger.exception("get_certifications_page")
        return {
            "hero": None,
            "sections": [],
            "meta": {"syncFromModulesOk": False, "revision": 0, "readOnlyOnGet": False},
        }


def get_certifications_debug_snapshot(db: Session) -> dict[str, Any]:
    """Aperçu lecture seule pour diagnostiquer (même base que Supabase vs BACKEND_URL)."""
    n = db.execute(text("SELECT COUNT(*) AS c FROM certification_card")).scalar()
    rows = (
        db.execute(
            text(
                """
                SELECT id, title, category, module_id
                FROM certification_card
                ORDER BY id ASC
                LIMIT 8
                """
            )
        )
        .mappings()
        .all()
    )
    return {
        "revision": CERTIFICATIONS_API_REVISION,
        "readOnlyOnGet": True,
        "certificationCardCount": int(n or 0),
        "sampleRows": [_jsonish_value(dict(r)) for r in rows],
    }

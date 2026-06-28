"""Page détail parcours reconversion (hero, stats, packs, hors pack)."""

from __future__ import annotations

from collections import defaultdict
from typing import Any
from urllib.parse import unquote

from sqlalchemy.orm import Session

from app.persistence.models import (
    ReconversionPack,
    ReconversionPackModule,
    ReconversionTopic,
    ReconversionTopicStat,
)
from app.domains.catalog.hors_pack import list_hors_pack_modules
from app.domains.catalog.module_support_public import batch_supports_map, supports_payload_for_module
from app.domains.catalog.topic_hero_background import resolve_topic_hero_background_url
from app.domains.catalog.ponctuelle_formations import (
    _normalize_slug_for_lookup,
    _slug_fingerprint,
)


def _opt_str(val: str | None) -> str | None:
    if val is None:
        return None
    s = val.strip()
    return s if s else None


def find_reconversion_topic_by_slug(
    db: Session, slug: str
) -> ReconversionTopic | None:
    """
    Résout un parcours reconversion comme les formations ponctuelles : slug exact,
    puis casse / tirets Unicode, puis empreinte (accents, espaces vs tirets, libellé hero).
    """
    raw = (slug or "").strip()
    if "%" in raw:
        raw = unquote(raw).strip()
    if not raw or raw.lower() in ("null", "none", "undefined"):
        return None

    row = (
        db.query(ReconversionTopic)
        .filter(ReconversionTopic.slug == raw)
        .first()
    )
    if row is not None:
        return row

    key = _normalize_slug_for_lookup(raw)
    want_fp = _slug_fingerprint(raw)

    for r in (
        db.query(ReconversionTopic)
        .order_by(ReconversionTopic.id.asc())
        .all()
    ):
        rslug = r.slug or ""
        if _normalize_slug_for_lookup(rslug) == key:
            return r
        if _slug_fingerprint(rslug) == want_fp:
            return r
        rtitle = (r.hero_title or "").strip()
        if rtitle and _slug_fingerprint(rtitle) == want_fp:
            return r
    return None


def _map_pack_modules(
    modules: list[ReconversionPackModule],
    supports_by_module_id: dict[int, list],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in sorted(modules, key=lambda x: (x.sort_order, x.id)):
        kind = "project" if m.module_kind == "project" else "course"
        item: dict[str, Any] = {
            "id": str(m.id),
            "text": m.title,
            "kind": kind,
            "supports": supports_payload_for_module(supports_by_module_id.get(int(m.id), [])),
        }
        if d := _opt_str(m.description):
            item["description"] = d
        if d := _opt_str(m.image_url):
            item["imageUrl"] = d
        if d := _opt_str(m.duree):
            item["duration"] = d
        if d := _opt_str(m.pratique):
            item["practice"] = d
        if d := _opt_str(m.projet):
            item["project"] = d
        if d := _opt_str(m.evaluation):
            item["evaluation"] = d
        out.append(item)
    return out


def _map_pack(
    p: ReconversionPack,
    modules: list[ReconversionPackModule],
    supports_by_module_id: dict[int, list],
) -> dict[str, Any]:
    return {
        "variantSlug": p.variant_slug,
        "styleKey": p.style_key,
        "tabLabel": p.tab_label,
        "badgeLabel": p.badge_label,
        "cardTitle": p.card_title,
        "imageUrl": p.image_url,
        "modules": _map_pack_modules(modules, supports_by_module_id),
    }


def _map_reconversion_pack_modules_for_card(
    pack: ReconversionPack,
    modules: list[ReconversionPackModule],
    supports_by_module_id: dict[int, list],
) -> list[dict[str, Any]]:
    """
    Même empreinte JSON que `list_hors_pack_modules` (carte détail page reconversion, pack full Gold).
    - imageUrl : celle du module, sinon visuel du pack, sinon repli.
    - description : texte module, sinon repli pédagogique.
    """
    raw_pack_img = (pack.image_url or "").strip()
    out: list[dict[str, Any]] = []
    for m in sorted(modules, key=lambda x: (x.sort_order, x.id)):
        kind = "project" if m.module_kind == "project" else "course"
        desc = _opt_str(m.description) or f"Contenu pédagogique : {m.title}."
        image = _opt_str(m.image_url) or raw_pack_img
        if not image:
            continue
        item: dict[str, Any] = {
            "id": str(m.id),
            "title": m.title,
            "kind": kind,
            "imageUrl": image,
            "description": desc,
            "duration": m.duree,
            "practice": m.pratique,
            "project": m.projet,
            "evaluation": m.evaluation,
            "hoverDetail": None,
            "certified": True,
            "supports": supports_payload_for_module(supports_by_module_id.get(int(m.id), [])),
        }
        out.append(item)
    return out


def load_reconversion_topic_from_db(
    db: Session, slug: str
) -> dict[str, Any] | None:
    """Données strictement BD (sans fallback statique)."""
    topic = find_reconversion_topic_by_slug(db, slug)
    if not topic:
        return None

    stat_rows = (
        db.query(ReconversionTopicStat)
        .filter(ReconversionTopicStat.topic_id == topic.id)
        .order_by(ReconversionTopicStat.sort_order.asc())
        .all()
    )
    pack_rows = (
        db.query(ReconversionPack)
        .filter(ReconversionPack.topic_id == topic.id)
        .order_by(ReconversionPack.pack_kind.asc(), ReconversionPack.sort_order.asc())
        .all()
    )

    by_pack: dict[Any, list[ReconversionPackModule]] = defaultdict(list)
    if pack_rows:
        pack_ids = [p.id for p in pack_rows]
        all_mods = (
            db.query(ReconversionPackModule)
            .filter(ReconversionPackModule.pack_id.in_(pack_ids))
            .order_by(
                ReconversionPackModule.pack_id.asc(),
                ReconversionPackModule.sort_order.asc(),
                ReconversionPackModule.id.asc(),
            )
            .all()
        )
        for m in all_mods:
            by_pack[m.pack_id].append(m)

    rc_mod_ids = [int(m.id) for m in all_mods] if pack_rows else []
    supports_rc = batch_supports_map(db, "reconversion_pack_module", rc_mod_ids)

    # Une requête pour tous les modules des packs (évite N+1).
    packs_out: list[tuple[str, dict[str, Any]]] = []
    for p in pack_rows:
        mods = by_pack.get(p.id, [])
        packs_out.append((p.pack_kind, _map_pack(p, mods, supports_rc)))

    full_packs = [d for k, d in packs_out if k == "full"]
    mini_packs = [d for k, d in packs_out if k == "mini"]

    gold_modules_payload: list[dict[str, Any]] = []
    gold = next(
        (p for p in pack_rows if p.pack_kind == "full" and p.style_key == "gold"), None
    )
    if gold is not None:
        gold_modules_payload = _map_reconversion_pack_modules_for_card(
            gold, by_pack.get(gold.id, []), supports_rc
        )

    hero: dict[str, Any] = {
        "title": topic.hero_title,
        "subtitle": topic.hero_subtitle,
    }
    if bg := resolve_topic_hero_background_url(
        db,
        topic_card_id=topic.topic_card_id,
        hero_background_image=topic.hero_background_image,
        topic_slug=topic.slug,
        formation_type="reconversion",
    ):
        hero["backgroundImageUrl"] = bg

    hors_pack = list_hors_pack_modules(db, topic.slug)

    stats_payload: list[dict[str, Any]] = []
    for s in stat_rows:
        item: dict[str, Any] = {"label": s.label, "value": s.value}
        if s.description:
            item["description"] = s.description
        stats_payload.append(item)

    return {
        "slug": topic.slug,
        "hero": hero,
        "stats": stats_payload,
        "fullPacks": full_packs,
        "miniPacks": mini_packs,
        "packDetailModules": gold_modules_payload,
        "horsPackModules": hors_pack,
    }

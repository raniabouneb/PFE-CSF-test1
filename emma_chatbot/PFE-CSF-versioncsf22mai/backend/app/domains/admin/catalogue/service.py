from __future__ import annotations

import re
import uuid
import unicodedata
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domains.catalog.module_support_public import (
    batch_supports_map,
    module_support_file_public_url,
    supports_payload_for_module,
)
from app.domains.catalog.ponctuelle_formations import _find_formation_by_slug
from app.domains.reconversion.topic import find_reconversion_topic_by_slug
from app.persistence.models import (
    ModuleSupport,
    PonctuelleFormation,
    PonctuelleModule,
    ReconversionPack,
    ReconversionPackModule,
    ReconversionTopic,
    SurMesureModule,
)

_RE_INT = re.compile(r"(\d+)")
_RE_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _opt_str(val: str | None) -> str | None:
    if val is None:
        return None
    s = val.strip()
    return s if s else None


def _norm_title_key(val: str | None) -> str:
    if not val:
        return ""
    s = unicodedata.normalize("NFKD", val)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower().strip()
    s = _RE_NON_ALNUM.sub(" ", s)
    return " ".join(s.split())


def reconversion_examen_from_eval(text: str | None) -> bool:
    """Déduit l’affichage admin à partir du texte `evaluation` (pas de colonne dédiée)."""
    t = (text or "").strip().lower()
    if not t:
        return True
    if "pas d'examen" in t or "sans examen" in t:
        return False
    if "évaluation continue" in t or "evaluation continue" in t:
        return False
    return True


def first_int_from_text(text: str | None, default: int = 0) -> int:
    if not text:
        return default
    m = _RE_INT.search(str(text))
    return int(m.group(1)) if m else default


def parse_module_ref(ref: str) -> tuple[str, int]:
    parts = ref.strip().split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Identifiant module invalide.")
    src, sid = parts[0].strip(), parts[1].strip()
    valid = {"reconversion_pack_module", "ponctuelle_module", "sur_mesure_module"}
    if src not in valid:
        raise HTTPException(status_code=400, detail="Type de module inconnu.")
    try:
        num = int(sid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Identifiant module invalide.") from e
    if num <= 0:
        raise HTTPException(status_code=400, detail="Identifiant module invalide.")
    return src, num


def display_code_for(source: str, pk: int) -> str:
    if source == "reconversion_pack_module":
        return f"RCM-{pk}"
    if source == "ponctuelle_module":
        return f"PM-{pk}"
    return f"SM-{pk}"


def module_public_id(source: str, pk: int) -> str:
    return f"{source}:{pk}"


def _ensure_upload_root() -> Path:
    root = Path(settings.admin_uploads_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _delete_support_files_for_module(db: Session, source: str, module_id: int) -> None:
    rows = (
        db.query(ModuleSupport)
        .filter(ModuleSupport.module_source == source, ModuleSupport.module_id == module_id)
        .all()
    )
    root = Path(settings.admin_uploads_dir).resolve()
    for r in rows:
        try:
            p = (root / r.file_path).resolve()
            if str(p).startswith(str(root)) and p.is_file():
                p.unlink()
        except OSError:
            pass
        db.delete(r)


def pick_pack_for_topic(db: Session, topic_id: int) -> ReconversionPack:
    gold = (
        db.query(ReconversionPack)
        .filter(
            ReconversionPack.topic_id == topic_id,
            ReconversionPack.pack_kind == "full",
            ReconversionPack.style_key == "gold",
        )
        .order_by(ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .first()
    )
    if gold:
        return gold
    full = (
        db.query(ReconversionPack)
        .filter(ReconversionPack.topic_id == topic_id, ReconversionPack.pack_kind == "full")
        .order_by(ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .first()
    )
    if full:
        return full
    any_pack = (
        db.query(ReconversionPack)
        .filter(ReconversionPack.topic_id == topic_id)
        .order_by(ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .first()
    )
    if not any_pack:
        raise HTTPException(
            status_code=400,
            detail="Aucun pack reconversion pour ce parcours : créez un pack en base avant d’ajouter un module.",
        )
    return any_pack


def _row_reconversion(
    db: Session,
    m: ReconversionPackModule,
    pack_id: int,
    pack_label: str,
    topic_slug: str,
    topic_label: str,
    support_rows: list,
    fallback_module: ReconversionPackModule | None = None,
) -> dict:
    duration_text = _opt_str(m.duree) or _opt_str(getattr(fallback_module, "duree", None))
    practice_text = _opt_str(m.pratique) or _opt_str(getattr(fallback_module, "pratique", None))
    project_text = _opt_str(m.projet) or _opt_str(getattr(fallback_module, "projet", None))
    evaluation_text = _opt_str(m.evaluation) or _opt_str(getattr(fallback_module, "evaluation", None))
    image_url = _opt_str(m.image_url) or _opt_str(getattr(fallback_module, "image_url", None))

    hours = first_int_from_text(duration_text, 24)
    labs = first_int_from_text(practice_text, 0)
    examen = reconversion_examen_from_eval(evaluation_text)
    desc = (m.description or "").strip()
    return {
        "id": module_public_id("reconversion_pack_module", int(m.id)),
        "displayCode": display_code_for("reconversion_pack_module", int(m.id)),
        "titre": m.title,
        "description": desc,
        "imageUrl": image_url,
        "format": "reconversion",
        "segmentSlug": topic_slug,
        "segmentLabel": topic_label,
        "reconversionPackId": str(pack_id),
        "reconversionPackLabel": pack_label,
        "dureeHeures": hours,
        "nombreLabs": labs,
        "examen": examen,
        "durationText": duration_text,
        "practiceText": practice_text,
        "projectText": project_text,
        "evaluationText": evaluation_text,
        "supportsPdf": supports_payload_for_module(support_rows),
        "_sort": (0, m.sort_order, int(m.id)),
    }


def _row_ponctuelle(
    db: Session,
    m: PonctuelleModule,
    formation_slug: str,
    formation_label: str,
    support_rows: list,
) -> dict:
    hours = first_int_from_text(m.duration, 24)
    labs = first_int_from_text(m.practice, 0)
    desc = (m.description or "").strip()
    return {
        "id": module_public_id("ponctuelle_module", int(m.id)),
        "displayCode": display_code_for("ponctuelle_module", int(m.id)),
        "titre": m.title,
        "description": desc,
        "imageUrl": _opt_str(m.image_url),
        "format": "ponctuelle",
        "segmentSlug": formation_slug,
        "segmentLabel": formation_label,
        "reconversionPackId": None,
        "reconversionPackLabel": None,
        "dureeHeures": hours,
        "nombreLabs": labs,
        "examen": bool(m.is_certified),
        "durationText": _opt_str(m.duration),
        "practiceText": _opt_str(m.practice),
        "projectText": _opt_str(m.project),
        "evaluationText": _opt_str(m.evaluation),
        "supportsPdf": supports_payload_for_module(support_rows),
        "_sort": (1, m.sort_order, int(m.id)),
    }


def _row_sur_mesure(m: SurMesureModule, support_rows: list) -> dict:
    desc = (m.description or "").strip()
    return {
        "id": module_public_id("sur_mesure_module", int(m.id)),
        "displayCode": display_code_for("sur_mesure_module", int(m.id)),
        "titre": m.title,
        "description": desc,
        "imageUrl": None,
        "format": "sur_mesure",
        "segmentSlug": None,
        "segmentLabel": None,
        "reconversionPackId": None,
        "reconversionPackLabel": None,
        "dureeHeures": int(m.duration_hours),
        "nombreLabs": int(m.labs_count),
        "examen": bool(m.has_exam),
        "durationText": None,
        "practiceText": None,
        "projectText": None,
        "evaluationText": None,
        "supportsPdf": supports_payload_for_module(support_rows),
        "_sort": (2, m.sort_order, int(m.id)),
    }


def collect_all_module_rows(
    db: Session,
    search: str | None,
    *,
    format_filter: str | None = None,
    segment_slug: str | None = None,
    reconversion_pack_id: str | None = None,
) -> list[dict]:
    q = (search or "").strip().lower()
    fmt = (format_filter or "all").strip()
    seg = (segment_slug or "").strip()
    pack_id_filter = (reconversion_pack_id or "").strip()

    rc_rows: list[tuple[ReconversionPackModule, ReconversionPack, ReconversionTopic]] = []
    rc_gold_rows: list[tuple[ReconversionPackModule, ReconversionTopic]] = []
    pn_rows: list[tuple[PonctuelleModule, PonctuelleFormation]] = []
    sm_list: list[SurMesureModule] = []

    if fmt in ("all", "reconversion"):
        rc_query = (
            db.query(ReconversionPackModule, ReconversionPack, ReconversionTopic)
            .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
            .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
        )
        if seg and seg != "all":
            rc_query = rc_query.filter(ReconversionTopic.slug == seg)
        if pack_id_filter and pack_id_filter != "all":
            try:
                rc_query = rc_query.filter(ReconversionPack.id == int(pack_id_filter))
            except ValueError:
                rc_query = rc_query.filter(ReconversionPack.id == -1)
        if q:
            like = f"%{q}%"
            rc_query = rc_query.filter(
                or_(
                    ReconversionPackModule.title.ilike(like),
                    ReconversionPackModule.description.ilike(like),
                    ReconversionTopic.slug.ilike(like),
                    ReconversionTopic.hero_title.ilike(like),
                    ReconversionPack.tab_label.ilike(like),
                    ReconversionPack.badge_label.ilike(like),
                )
            )
        rc_rows = rc_query.order_by(
            ReconversionTopic.slug.asc(),
            ReconversionPack.sort_order.asc(),
            ReconversionPackModule.sort_order.asc(),
            ReconversionPackModule.id.asc(),
        ).all()

        # Fallback métier: les valeurs de référence (durée/pratique/projet/évaluation/image)
        # sont stockées dans le pack GOLD de chaque parcours.
        gold_query = (
            db.query(ReconversionPackModule, ReconversionTopic)
            .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
            .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
            .filter(ReconversionPack.style_key == "gold")
        )
        if seg and seg != "all":
            gold_query = gold_query.filter(ReconversionTopic.slug == seg)
        elif rc_rows:
            topic_slugs = sorted({t.slug for _m, _p, t in rc_rows})
            gold_query = gold_query.filter(ReconversionTopic.slug.in_(topic_slugs))
        if q:
            like = f"%{q}%"
            gold_query = gold_query.filter(
                or_(
                    ReconversionPackModule.title.ilike(like),
                    ReconversionPackModule.description.ilike(like),
                    ReconversionTopic.slug.ilike(like),
                    ReconversionTopic.hero_title.ilike(like),
                )
            )
        rc_gold_rows = gold_query.order_by(
            ReconversionTopic.slug.asc(),
            ReconversionPackModule.sort_order.asc(),
            ReconversionPackModule.id.asc(),
        ).all()

    if fmt in ("all", "ponctuelle"):
        pn_query = db.query(PonctuelleModule, PonctuelleFormation).join(
            PonctuelleFormation, PonctuelleModule.formation_id == PonctuelleFormation.id
        )
        if seg and seg != "all":
            pn_query = pn_query.filter(PonctuelleFormation.slug == seg)
        if q:
            like = f"%{q}%"
            pn_query = pn_query.filter(
                or_(
                    PonctuelleModule.title.ilike(like),
                    PonctuelleModule.description.ilike(like),
                    PonctuelleFormation.slug.ilike(like),
                    PonctuelleFormation.hero_title.ilike(like),
                )
            )
        pn_rows = pn_query.order_by(
            PonctuelleFormation.slug.asc(),
            PonctuelleModule.sort_order.asc(),
            PonctuelleModule.id.asc(),
        ).all()

    if fmt in ("all", "sur_mesure"):
        sm_query = db.query(SurMesureModule)
        if q:
            like = f"%{q}%"
            sm_query = sm_query.filter(
                or_(SurMesureModule.title.ilike(like), SurMesureModule.description.ilike(like))
            )
        try:
            sm_list = sm_query.order_by(SurMesureModule.sort_order.asc(), SurMesureModule.id.asc()).all()
        except ProgrammingError as e:
            orig = getattr(e, "orig", None)
            pgcode = getattr(orig, "pgcode", None)
            if pgcode == "42P01":
                db.rollback()
                sm_list = []
            else:
                raise

    rc_mod_ids = [int(m.id) for m, _p, _t in rc_rows]
    rc_supports_raw = batch_supports_map(db, "reconversion_pack_module", rc_mod_ids)

    # Also load supports for all sibling modules across packs (same topic + title)
    # so that a support uploaded on any pack variant is visible everywhere.
    _all_rc_topic_ids = {int(t.id) for _m, _p, t in rc_rows}
    _all_sibling_modules: list[tuple[ReconversionPackModule, ReconversionTopic]] = []
    if _all_rc_topic_ids:
        _all_sibling_modules = (
            db.query(ReconversionPackModule, ReconversionTopic)
            .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
            .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
            .filter(ReconversionTopic.id.in_(_all_rc_topic_ids))
            .all()
        )
    _sibling_extra_ids = [
        int(sm.id) for sm, _st in _all_sibling_modules if int(sm.id) not in rc_supports_raw
    ]
    if _sibling_extra_ids:
        _extra = batch_supports_map(db, "reconversion_pack_module", _sibling_extra_ids)
        rc_supports_raw.update(_extra)

    # Build a shared supports map: (topic_slug, norm_title) -> deduplicated supports list
    _topic_title_to_ids: dict[tuple[str, str], list[int]] = {}
    for sm, st in _all_sibling_modules:
        key = (st.slug, _norm_title_key(sm.title))
        _topic_title_to_ids.setdefault(key, []).append(int(sm.id))

    def _shared_supports(topic_slug: str, title: str, own_id: int) -> list:
        key = (topic_slug, _norm_title_key(title))
        sibling_ids = _topic_title_to_ids.get(key, [own_id])
        seen_names: set[str] = set()
        merged: list = []
        for sid in sibling_ids:
            for row in rc_supports_raw.get(sid, []):
                if row.file_name not in seen_names:
                    seen_names.add(row.file_name)
                    merged.append(row)
        return merged

    pn_mod_ids = [int(m.id) for m, _f in pn_rows]
    pn_supports = batch_supports_map(db, "ponctuelle_module", pn_mod_ids)
    sm_ids = [int(m.id) for m in sm_list]
    sm_supports = batch_supports_map(db, "sur_mesure_module", sm_ids)

    out: list[dict] = []
    rc_gold_by_topic_title: dict[tuple[str, str], ReconversionPackModule] = {}
    for m, t in rc_gold_rows:
        title_key = _norm_title_key(m.title)
        if not title_key:
            continue
        rc_gold_by_topic_title[(t.slug, title_key)] = m

    for m, p, t in rc_rows:
        pack_label = (p.tab_label or "").strip() or (p.badge_label or "").strip() or p.variant_slug
        fallback_gold = rc_gold_by_topic_title.get((t.slug, _norm_title_key(m.title)))
        out.append(
            _row_reconversion(
                db,
                m,
                int(p.id),
                pack_label,
                t.slug,
                t.hero_title,
                _shared_supports(t.slug, m.title, int(m.id)),
                fallback_module=fallback_gold,
            )
        )
    for m, f in pn_rows:
        out.append(
            _row_ponctuelle(
                db, m, f.slug, f.hero_title, pn_supports.get(int(m.id), [])
            )
        )
    for m in sm_list:
        out.append(_row_sur_mesure(m, sm_supports.get(int(m.id), [])))

    out.sort(key=lambda r: r["_sort"])
    for r in out:
        r.pop("_sort", None)
    return out


def get_filters_and_kpis(db: Session) -> dict:
    topics = (
        db.query(ReconversionTopic)
        .order_by(ReconversionTopic.hero_title.asc())
        .all()
    )
    forms = (
        db.query(PonctuelleFormation)
        .order_by(PonctuelleFormation.hero_title.asc())
        .all()
    )
    packs = (
        db.query(ReconversionPack, ReconversionTopic)
        .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
        .order_by(ReconversionTopic.hero_title.asc(), ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .all()
    )
    all_rows = collect_all_module_rows(db, None)
    total_hours = sum(int(r["dureeHeures"]) for r in all_rows)
    try:
        supports_n = db.query(ModuleSupport).count()
    except ProgrammingError as e:
        orig = getattr(e, "orig", None)
        pgcode = getattr(orig, "pgcode", None)
        if pgcode == "42P01":
            db.rollback()
            supports_n = 0
        else:
            raise

    def _compact_pack_label(p: ReconversionPack) -> str:
        raw = (p.badge_label or p.tab_label or p.variant_slug or "").strip()
        return raw.upper() if raw else str(p.id)

    return {
        "formats": [
            {"id": "reconversion", "label": "Reconversion"},
            {"id": "ponctuelle", "label": "Ponctuelle"},
            {"id": "sur_mesure", "label": "Sur mesure"},
        ],
        "reconversionTopics": [{"id": t.slug, "label": t.hero_title} for t in topics],
        "reconversionPacks": [
            {
                "id": str(p.id),
                "label": _compact_pack_label(p),
                "topicSlug": t.slug,
                "variantSlug": p.variant_slug,
                "packKind": p.pack_kind,
            }
            for p, t in packs
        ],
        "ponctuelleFormations": [{"id": f.slug, "label": f.hero_title} for f in forms],
        "kpis": {
            "modules": len(all_rows),
            "supports": int(supports_n),
            "totalHours": int(total_hours),
        },
    }


def list_modules_page(
    db: Session,
    *,
    format_filter: str | None,
    segment_slug: str | None,
    reconversion_pack_id: str | None,
    search: str | None,
    page: int,
    page_size: int,
) -> tuple[list[dict], int]:
    rows = collect_all_module_rows(
        db,
        search,
        format_filter=format_filter,
        segment_slug=segment_slug,
        reconversion_pack_id=reconversion_pack_id,
    )
    total = len(rows)
    page = max(1, page)
    page_size = min(max(1, page_size), 200)
    start = (page - 1) * page_size
    return rows[start : start + page_size], total


def get_one_row(db: Session, source: str, pk: int) -> dict | None:
    all_rows = collect_all_module_rows(db, None)
    mid = module_public_id(source, pk)
    for r in all_rows:
        if r["id"] == mid:
            return r
    return None


def create_module(db: Session, body) -> dict:
    if body.format == "reconversion":
        pack = None
        if body.reconversionPackId:
            try:
                pack_pk = int(body.reconversionPackId.strip())
            except ValueError as e:
                raise HTTPException(status_code=400, detail="reconversionPackId invalide.") from e
            pack = db.query(ReconversionPack).filter(ReconversionPack.id == pack_pk).first()
            if not pack:
                raise HTTPException(status_code=400, detail="Pack reconversion introuvable.")
        else:
            if not body.reconversionTopicSlug:
                raise HTTPException(status_code=400, detail="reconversionTopicSlug requis.")
            topic = find_reconversion_topic_by_slug(db, body.reconversionTopicSlug.strip())
            if not topic:
                raise HTTPException(status_code=400, detail="Parcours reconversion introuvable.")
            pack = pick_pack_for_topic(db, int(topic.id))
        next_order = (
            db.query(ReconversionPackModule)
            .filter(ReconversionPackModule.pack_id == int(pack.id))
            .count()
        )
        m = ReconversionPackModule(
            pack_id=int(pack.id),
            title=body.titre.strip(),
            module_kind="course",
            sort_order=next_order,
            description=body.description.strip() or None,
            image_url=(body.imageUrl.strip() if body.imageUrl and body.imageUrl.strip() else "/images/hero-formation.png"),
            duree=(body.durationText.strip() if body.durationText and body.durationText.strip() else f"{body.dureeHeures} h"),
            pratique=(
                body.practiceText.strip()
                if body.practiceText and body.practiceText.strip()
                else f"{body.nombreLabs} laboratoire(s)"
            ),
            projet=(body.projectText.strip() if body.projectText and body.projectText.strip() else "Projet encadré"),
            evaluation=(
                body.evaluationText.strip()
                if body.evaluationText and body.evaluationText.strip()
                else ("Examen final" if body.examen else "Évaluation continue")
            ),
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return get_one_row(db, "reconversion_pack_module", int(m.id))  # type: ignore[return-value]

    if body.format == "ponctuelle":
        if not body.ponctuelleFormationSlug:
            raise HTTPException(status_code=400, detail="ponctuelleFormationSlug requis.")
        form = _find_formation_by_slug(db, body.ponctuelleFormationSlug.strip())
        if not form:
            raise HTTPException(status_code=400, detail="Formation ponctuelle introuvable.")
        next_order = (
            db.query(PonctuelleModule)
            .filter(PonctuelleModule.formation_id == int(form.id))
            .count()
        )
        m = PonctuelleModule(
            formation_id=int(form.id),
            sort_order=next_order,
            title=body.titre.strip(),
            description=body.description.strip() or " ",
            image_url=(body.imageUrl.strip() if body.imageUrl and body.imageUrl.strip() else "/images/hero-formation.png"),
            duration=(body.durationText or f"{body.dureeHeures} h"),
            practice=(body.practiceText or f"{body.nombreLabs} atelier(s) pratique(s)"),
            project=(body.projectText or "Projet guidé"),
            evaluation=(body.evaluationText or ("Examen final" if body.examen else "Évaluation continue")),
            hover_detail=None,
            is_certified=bool(body.examen),
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return get_one_row(db, "ponctuelle_module", int(m.id))  # type: ignore[return-value]

    if body.format == "sur_mesure":
        next_order = db.query(SurMesureModule).count()
        m = SurMesureModule(
            title=body.titre.strip(),
            description=body.description.strip(),
            duration_hours=body.dureeHeures,
            labs_count=body.nombreLabs,
            has_exam=body.examen,
            sort_order=next_order,
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return get_one_row(db, "sur_mesure_module", int(m.id))  # type: ignore[return-value]

    raise HTTPException(status_code=400, detail="Format non supporté.")


def patch_module(db: Session, source: str, pk: int, body) -> dict:
    if source == "reconversion_pack_module":
        m = db.query(ReconversionPackModule).filter(ReconversionPackModule.id == pk).first()
        if not m:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        if body.titre is not None:
            m.title = body.titre.strip()
        if body.description is not None:
            m.description = body.description.strip() or None
        if body.dureeHeures is not None:
            m.duree = f"{body.dureeHeures} h"
        if body.nombreLabs is not None:
            m.pratique = f"{body.nombreLabs} laboratoire(s)"
        if body.examen is not None:
            m.evaluation = "Examen final" if body.examen else "Évaluation continue"
        if body.durationText is not None and body.durationText.strip():
            m.duree = body.durationText.strip()
        if body.practiceText is not None and body.practiceText.strip():
            m.pratique = body.practiceText.strip()
        if body.projectText is not None and body.projectText.strip():
            m.projet = body.projectText.strip()
        if body.evaluationText is not None and body.evaluationText.strip():
            m.evaluation = body.evaluationText.strip()
        if body.imageUrl is not None and body.imageUrl.strip():
            m.image_url = body.imageUrl.strip()
        if body.reconversionTopicSlug is not None:
            topic = find_reconversion_topic_by_slug(db, body.reconversionTopicSlug.strip())
            if not topic:
                raise HTTPException(status_code=400, detail="Parcours reconversion introuvable.")
            pack = pick_pack_for_topic(db, int(topic.id))
            m.pack_id = int(pack.id)
        if body.reconversionPackId is not None and body.reconversionPackId.strip():
            try:
                pack_pk = int(body.reconversionPackId.strip())
            except ValueError as e:
                raise HTTPException(status_code=400, detail="reconversionPackId invalide.") from e
            pack = db.query(ReconversionPack).filter(ReconversionPack.id == pack_pk).first()
            if not pack:
                raise HTTPException(status_code=400, detail="Pack reconversion introuvable.")
            m.pack_id = int(pack.id)
        db.commit()
        db.refresh(m)
        r = get_one_row(db, source, pk)
        if not r:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        return r

    if source == "ponctuelle_module":
        m = db.query(PonctuelleModule).filter(PonctuelleModule.id == pk).first()
        if not m:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        if body.titre is not None:
            m.title = body.titre.strip()
        if body.description is not None:
            m.description = body.description.strip() or " "
        if body.dureeHeures is not None:
            m.duration = f"{body.dureeHeures} h"
        if body.nombreLabs is not None:
            m.practice = f"{body.nombreLabs} atelier(s) pratique(s)"
        if body.examen is not None:
            m.is_certified = bool(body.examen)
            m.evaluation = "Examen final" if body.examen else "Évaluation continue"
        if body.durationText is not None and body.durationText.strip():
            m.duration = body.durationText.strip()
        if body.practiceText is not None and body.practiceText.strip():
            m.practice = body.practiceText.strip()
        if body.projectText is not None and body.projectText.strip():
            m.project = body.projectText.strip()
        if body.evaluationText is not None and body.evaluationText.strip():
            m.evaluation = body.evaluationText.strip()
        if body.imageUrl is not None and body.imageUrl.strip():
            m.image_url = body.imageUrl.strip()
        if body.ponctuelleFormationSlug is not None:
            form = _find_formation_by_slug(db, body.ponctuelleFormationSlug.strip())
            if not form:
                raise HTTPException(status_code=400, detail="Formation ponctuelle introuvable.")
            m.formation_id = int(form.id)
        db.commit()
        db.refresh(m)
        r = get_one_row(db, source, pk)
        if not r:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        return r

    if source == "sur_mesure_module":
        m = db.query(SurMesureModule).filter(SurMesureModule.id == pk).first()
        if not m:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        if body.titre is not None:
            m.title = body.titre.strip()
        if body.description is not None:
            m.description = body.description.strip()
        if body.dureeHeures is not None:
            m.duration_hours = body.dureeHeures
        if body.nombreLabs is not None:
            m.labs_count = body.nombreLabs
        if body.examen is not None:
            m.has_exam = bool(body.examen)
        db.commit()
        db.refresh(m)
        r = get_one_row(db, source, pk)
        if not r:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        return r

    raise HTTPException(status_code=400, detail="Type de module inconnu.")


def delete_module(db: Session, source: str, pk: int) -> None:
    _delete_support_files_for_module(db, source, pk)
    db.commit()

    if source == "reconversion_pack_module":
        m = db.query(ReconversionPackModule).filter(ReconversionPackModule.id == pk).first()
        if not m:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        db.delete(m)
    elif source == "ponctuelle_module":
        m = db.query(PonctuelleModule).filter(PonctuelleModule.id == pk).first()
        if not m:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        db.delete(m)
    elif source == "sur_mesure_module":
        m = db.query(SurMesureModule).filter(SurMesureModule.id == pk).first()
        if not m:
            raise HTTPException(status_code=404, detail="Module introuvable.")
        db.delete(m)
    else:
        raise HTTPException(status_code=400, detail="Type de module inconnu.")
    db.commit()


def _safe_pdf_storage_name(original: str) -> str:
    stem = Path(original or "support").stem
    cleaned = "".join(c for c in stem if c.isalnum() or c in "-_")[:72] or "support"
    return f"{cleaned}-{uuid.uuid4().hex}.pdf"


async def upload_support_pdf(
    db: Session, source: str, module_pk: int, upload: UploadFile
) -> dict:
    if not get_one_row(db, source, module_pk):
        raise HTTPException(status_code=404, detail="Module introuvable.")

    max_bytes = int(settings.admin_max_upload_mb) * 1024 * 1024
    ct = (upload.content_type or "").lower()
    if ct not in ("application/pdf", "application/x-pdf") and not ct.startswith("application/pdf"):
        # navigateur / OS parfois envoient octet-stream
        fn = (upload.filename or "").lower()
        if not fn.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    data = await upload.read()
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux (max {settings.admin_max_upload_mb} Mo).",
        )
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Le fichier ne semble pas être un PDF valide.")

    root = _ensure_upload_root()
    fname = _safe_pdf_storage_name(upload.filename or "document.pdf")
    rel_path = fname
    full = root / fname
    full.write_bytes(data)

    rec = ModuleSupport(
        module_source=source,
        module_id=module_pk,
        file_name=upload.filename or fname,
        file_path=rel_path,
        mime_type="application/pdf",
        size_bytes=len(data),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "id": str(rec.id),
        "fileName": rec.file_name,
        "url": module_support_file_public_url(int(rec.id)),
    }


def delete_support(db: Session, source: str, module_pk: int, support_id: int) -> None:
    row = (
        db.query(ModuleSupport)
        .filter(
            ModuleSupport.id == support_id,
            ModuleSupport.module_source == source,
            ModuleSupport.module_id == module_pk,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Support introuvable.")

    root = Path(settings.admin_uploads_dir).resolve()
    try:
        p = (root / row.file_path).resolve()
        if str(p).startswith(str(root)) and p.is_file():
            p.unlink()
    except OSError:
        pass
    db.delete(row)
    db.commit()

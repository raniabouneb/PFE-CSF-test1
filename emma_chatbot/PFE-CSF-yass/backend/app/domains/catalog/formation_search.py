"""Suggestions de recherche pour la page /formation (reconversion, ponctuelle, modules)."""

from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher
from typing import Any

from sqlalchemy import bindparam, case, func, literal, or_, text
from sqlalchemy.orm import Session

from app.constants.public_urls import (
    formation_ponctuelle_detail_href,
    href_for_reconversion_title,
    ponctuelle_slug_ok,
)
from app.persistence.models import (
    CertificationCard,
    PonctuelleFormation,
    PonctuelleModule,
    ReconversionPack,
    ReconversionPackModule,
    ReconversionTopic,
)

_MAX_Q = 120
_MAX_RECONVERSION = 15
_MAX_PONCTUELLE_FORMATION = 15
_MAX_MODULE = 25
_MAX_RECONVERSION_PACK_MODULE = 25
_MAX_CERTIFICATION = 15
# Seuil pg_trgm : `SET` en début de recherche + `similarity(...) > seuil` (reconversion, ponctuelle, certifs, modules).
_PG_TRGM_SESSION_THRESHOLD = 0.1
# --- Filtrage SQL pg_trgm : `similarity` (chaîne entière) + `strict_word_similarity` (meilleur *mot entier* du titre) ---
_PG_TRGM_STRICT_SIM_ONLY = 0.25
# Fautes de frappe (ex. « systele » ≈ « système ») : appliqué à `strict_word_similarity`, pas à `similarity` sur tout le titre.
# `word_similarity` seul laissait passer des bruits (trigrammes partiels entre mots sans rapport).
_PG_TRGM_WORD_SIM = 0.2

_MAX_FUZZY_SCAN_RC = 400
_MAX_FUZZY_SCAN_PO = 400
_MAX_FUZZY_SCAN_MOD = 600
_MAX_FUZZY_SCAN_CERT = 400
_MAX_FUZZY_EXTRA = 24
_FUZZY_MIN_SCORE_SHORT = 0.42
_FUZZY_MIN_SCORE_LONG = 0.34

# Mots / fenêtres courtes : « systele » ≈ « systeme » dans un long titre.
_TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-'][a-z0-9]+)*", re.IGNORECASE)

_RECONVERSION_SUFFIX = "reconversion professionnelle"
_PONCTUELLE_FORMATION_SUFFIX = "formation à la carte"
_CERTIFICATION_SUFFIX = "certification"

_HAS_UNACCENT: bool | None = None
_HAS_PG_TRGM: bool | None = None


def _sanitize_q(raw: str) -> str:
    s = (raw or "").strip()
    if len(s) > _MAX_Q:
        s = s[:_MAX_Q]
    # Évite que % et _ deviennent des métacaractères ILIKE.
    s = re.sub(r"[%_]", " ", s)
    return " ".join(s.split())


def _collapse_ws(s: str) -> str:
    """Normalise les espaces (tabs/newlines) → un seul espace, trim."""
    return " ".join((s or "").split())


def _compact_alnum_key(s: str) -> str:
    """
    Clé “compacte” pour matcher malgré espaces / ponctuation légère :
    garde uniquement [a-z0-9] après folding ASCII.
    Ex: "langage c" -> "langagec"
    """
    folded = fold_ascii_query(s)
    return re.sub(r"[^a-z0-9]+", "", folded)


def _compact_unaccent_expr(column):
    """`regexp_replace(unaccent(lower(col)), '[^a-z0-9]+', '', 'g')` (PostgreSQL)."""
    u = func.public.unaccent(func.lower(column))
    return func.regexp_replace(u, r"[^a-z0-9]+", "", "g")


def _compact_substring_filter_sql(column_sql: str, compact: str) -> str:
    """
    Fallback substring sur version compactée (sans espaces/ponctuation).
    Important quand `similarity` est trop strict (ex: requêtes collées vs titres avec espaces).
    """
    c = (compact or "").strip()
    if not c:
        return "(1=0)"
    # `LIKE` sur une chaîne déjà normalisée : pas besoin d'injecter `%` dans bindparam.
    like = f"%{c}%"
    return (
        "("
        f"regexp_replace(public.immutable_unaccent(lower({column_sql})), '[^a-z0-9]+', '', 'g') "
        f"LIKE {repr(like)}"
        ")"
    )


def fold_ascii_query(s: str) -> str:
    """Minuscules + suppression des signes diacritiques (é → e) pour comparaison avec unaccent côté SQL."""
    nfd = unicodedata.normalize("NFD", s)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return stripped.lower()


def _use_unaccent_extension(db: Session) -> bool:
    """`unaccent` (PostgreSQL) : même saisie « systeme » matche « système » en base."""
    global _HAS_UNACCENT
    if _HAS_UNACCENT is not None:
        return _HAS_UNACCENT
    try:
        db.execute(text("SELECT public.unaccent('hôtel'::text)"))
        _HAS_UNACCENT = True
    except Exception:
        _HAS_UNACCENT = False
    return bool(_HAS_UNACCENT)


def _use_pg_trgm_search(db: Session) -> bool:
    """Extension `pg_trgm` + fonction `immutable_unaccent` (recherche site)."""
    global _HAS_PG_TRGM
    if _HAS_PG_TRGM is not None:
        return _HAS_PG_TRGM
    try:
        db.execute(
            text(
                "SELECT (public.similarity("
                "public.immutable_unaccent(lower('système'::text)), "
                "public.immutable_unaccent(lower('systeme'::text))) "
                f"> {_PG_TRGM_STRICT_SIM_ONLY!s}) AS _trgm_ok"
            )
        )
        # Vérifie que `strict_word_similarity` est dispo (pg_trgm récent).
        db.execute(
            text(
                "SELECT (public.strict_word_similarity("
                "public.immutable_unaccent(lower('systele'::text)), "
                "public.immutable_unaccent(lower('developpement systeme embarque'::text))) "
                "> 0::float) AS _strict_word_trgm_ok"
            )
        )
        _HAS_PG_TRGM = True
    except Exception:
        _HAS_PG_TRGM = False
    return bool(_HAS_PG_TRGM)


def _trgm_col_match(column_ref: str, _th: float) -> str:
    """
    `similarity` sur la chaîne entière OU `strict_word_similarity` (requête vs le mot du titre
    le plus proche, sans « extension » parasite entre mots) — tolère les typos sur un mot.
    """
    u = "public.immutable_unaccent"
    qa = f"{u}(lower(:q))"
    ca = f"{u}(lower({column_ref}))"
    return (
        "("
        f"(public.similarity({ca}, {qa}) > {_PG_TRGM_STRICT_SIM_ONLY!s}) "
        f"OR (public.strict_word_similarity({qa}, {ca}) > {_PG_TRGM_WORD_SIM!s})"
        ")"
    )


def _trgm_pair_score_sql(column_ref: str) -> str:
    """Score de classement : max(similarité globale, similarité au meilleur mot entier)."""
    u = "public.immutable_unaccent"
    qa = f"{u}(lower(:q))"
    ca = f"{u}(lower({column_ref}))"
    return (
        "GREATEST(public.similarity("
        f"{ca}, {qa}), public.strict_word_similarity({qa}, {ca}))"
    )


def _trgm_or_cols(
    table_prefix: str,
    col_names: list[str],
    th: float,
) -> str:
    inner = " OR ".join(_trgm_col_match(f"{table_prefix}.{c}", th) for c in col_names)
    return f"({inner})"


def _reconversion_trgm_filter_sql(th: float) -> str:
    """Reconversion : uniquement titres de base (pas de packs)."""
    return _trgm_or_cols("reconversion_topic", ["hero_title", "hero_subtitle"], th)


def _ponctuelle_formation_trgm_filter_sql(th: float) -> str:
    return _trgm_or_cols(
        "ponctuelle_formation",
        ["hero_title", "hero_subtitle"],
        th,
    )


def _certification_trgm_filter_sql(th: float) -> str:
    # Filtre strict : uniquement sur `title`.
    return "(" + _trgm_col_match("certification_card.title", th) + ")"


def _ponctuelle_module_join_trgm_filter_sql(th: float) -> str:
    """Modules ponctuels + champs formation parente (sans ILIKE)."""
    parts = [
        _trgm_col_match("ponctuelle_module.title", th),
        _trgm_col_match("ponctuelle_formation.hero_title", th),
        _trgm_col_match("COALESCE(ponctuelle_formation.hero_subtitle, '')", th),
    ]
    return "(" + " OR ".join(parts) + ")"


def _reconversion_pack_module_join_trgm_filter_sql(th: float) -> str:
    """Modules reconversion (packs) + titres du topic parent (sans ILIKE)."""
    parts = [
        _trgm_col_match("reconversion_pack_module.title", th),
        _trgm_col_match("reconversion_topic.hero_title", th),
        _trgm_col_match("COALESCE(reconversion_topic.hero_subtitle, '')", th),
    ]
    return "(" + " OR ".join(parts) + ")"


def _unaccent_like(column, pat_inner: str):
    """`public.unaccent(lower(col)) LIKE '%' || public.unaccent(lower(:pat)) || '%'`"""
    inner = func.public.unaccent(func.lower(literal(pat_inner)))
    wrapped = func.concat(literal("%"), inner, literal("%"))
    return func.public.unaccent(func.lower(column)).like(wrapped)


def _unaccent_starts(column, pat_inner: str):
    inner = func.public.unaccent(func.lower(literal(pat_inner)))
    wrapped = func.concat(inner, literal("%"))
    return func.public.unaccent(func.lower(column)).like(wrapped)


def _max_local_similarity(q: str, blob: str) -> float:
    """
    Compare q à des morceaux pertinents du texte (mots tokenisés + fenêtre glissante),
    pour ne pas pénaliser une longue phrase quand l'utilisateur tape un mot approximatif
    (ex. « systele » → « systeme »).
    """
    if not q or not blob:
        return 0.0
    q = q.lower()
    blob = blob.lower()
    if q in blob:
        return 1.0
    best = 0.0
    for m in _TOKEN_RE.finditer(blob):
        w = m.group(0).lower()
        if len(w) < 2:
            continue
        best = max(best, SequenceMatcher(None, q, w).ratio())
        if len(w) >= len(q):
            best = max(
                best,
                SequenceMatcher(None, q, w[: min(len(w), len(q) + 6)]).ratio(),
            )
        elif len(w) >= 3 and len(q) >= 3:
            best = max(
                best,
                SequenceMatcher(None, q[: min(len(q), len(w) + 6)], w).ratio(),
            )

    if best >= 0.88:
        return best

    n, qlen = len(blob), len(q)
    if n < 3 or qlen < 2:
        return best
    max_win = min(n, qlen + 8)
    min_win = max(2, qlen - 3)
    step = 1 if n <= 100 else 2
    for win in range(min_win, max_win + 1):
        last = n - win
        for i in range(0, last + 1, step):
            chunk = blob[i : i + win]
            best = max(best, SequenceMatcher(None, q, chunk).ratio())
            if best >= 0.97:
                return best
    return best


def _relevance_score(q_folded: str, blob_folded: str) -> float:
    """Score 0–1 : sous-chaîne exacte (après normalisation) ou similarité locale (typos, accents)."""
    if not q_folded or not blob_folded:
        return 0.0
    if q_folded in blob_folded:
        return 1.0
    if len(q_folded) >= 4 and blob_folded in q_folded:
        return 0.92

    local_full = _max_local_similarity(q_folded, blob_folded)
    full_raw = SequenceMatcher(None, q_folded, blob_folded).ratio()

    toks = [t for t in q_folded.split() if len(t) >= 2]
    if not toks:
        return max(local_full, full_raw * 0.85)

    token_scores: list[float] = []
    for t in toks:
        if t in blob_folded:
            token_scores.append(1.0)
        else:
            token_scores.append(_max_local_similarity(t, blob_folded))
    token_avg = sum(token_scores) / len(token_scores)
    return max(local_full, full_raw * 0.8, token_avg * 0.98)


def _fuzzy_threshold(q_folded: str) -> float:
    return _FUZZY_MIN_SCORE_SHORT if len(q_folded) <= 6 else _FUZZY_MIN_SCORE_LONG


def _fuzzy_extras(
    db: Session,
    folded: str,
    seen_ids: set[str],
) -> list[tuple[float, dict[str, Any]]]:
    """Complète les matchs ILIKE par des titres proches (accents / typos légères) sur un échantillon borné."""
    if not folded:
        return []
    thr = _fuzzy_threshold(folded)
    out: list[tuple[float, dict[str, Any]]] = []

    for r in (
        db.query(ReconversionTopic)
        .order_by(ReconversionTopic.id.asc())
        .limit(_MAX_FUZZY_SCAN_RC)
        .all()
    ):
        slug = (r.slug or "").strip()
        sid = f"reconversion:{slug or r.id}"
        if sid in seen_ids:
            continue
        title = (r.hero_title or "").strip() or slug or "Reconversion"
        blob = fold_ascii_query(
            " ".join(
                x
                for x in (r.hero_title, r.hero_subtitle, r.slug)
                if x and str(x).strip()
            )
        )
        sc = _relevance_score(folded, blob)
        if sc < thr:
            continue
        href = f"/formation/reconversion/{slug}" if slug else href_for_reconversion_title(r.hero_title)
        out.append(
            (
                sc,
                {
                    "id": sid,
                    "kind": "reconversion",
                    "label": f"{title} — {_RECONVERSION_SUFFIX}",
                    "href": href,
                },
            )
        )

    for f in (
        db.query(PonctuelleFormation)
        .order_by(PonctuelleFormation.id.asc())
        .limit(_MAX_FUZZY_SCAN_PO)
        .all()
    ):
        slug = (f.slug or "").strip()
        if not ponctuelle_slug_ok(slug):
            continue
        sid = f"ponctuelle:{slug}"
        if sid in seen_ids:
            continue
        title = (f.hero_title or "").strip() or slug
        blob = fold_ascii_query(
            " ".join(
                x
                for x in (f.hero_title, f.hero_subtitle, f.slug)
                if x and str(x).strip()
            )
        )
        sc = _relevance_score(folded, blob)
        if sc < thr:
            continue
        out.append(
            (
                sc,
                {
                    "id": sid,
                    "kind": "ponctuelle",
                    "label": f"{title} — {_PONCTUELLE_FORMATION_SUFFIX}",
                    "href": formation_ponctuelle_detail_href(slug),
                },
            )
        )

    qmod = (
        db.query(PonctuelleModule, PonctuelleFormation)
        .join(PonctuelleFormation, PonctuelleModule.formation_id == PonctuelleFormation.id)
        .order_by(PonctuelleModule.id.asc())
        .limit(_MAX_FUZZY_SCAN_MOD)
        .all()
    )
    for mod, formation in qmod:
        fslug = (formation.slug or "").strip()
        if not ponctuelle_slug_ok(fslug):
            continue
        sid = f"ponctuelle_module:{mod.id}"
        if sid in seen_ids:
            continue
        mod_title = (mod.title or "").strip()
        if not mod_title:
            continue
        form_title = (formation.hero_title or "").strip() or fslug
        blob = fold_ascii_query(
            " ".join(
                x
                for x in (mod.title, formation.hero_title, formation.hero_subtitle, formation.slug)
                if x and str(x).strip()
            )
        )
        sc = _relevance_score(folded, blob)
        if sc < thr:
            continue
        href = f"{formation_ponctuelle_detail_href(fslug)}#ponctuelle-module-{mod.id}"
        out.append(
            (
                sc,
                {
                    "id": sid,
                    "kind": "ponctuelle_module",
                    "label": mod_title,
                    "subtitle": form_title,
                    "href": href,
                },
            )
        )

    for c in (
        db.query(CertificationCard)
        .order_by(CertificationCard.id.asc())
        .limit(_MAX_FUZZY_SCAN_CERT)
        .all()
    ):
        sid = f"certification:{c.id}"
        if sid in seen_ids:
            continue
        title = (c.title or "").strip() or "Certification"
        blob = fold_ascii_query(
            " ".join(
                x
                for x in (c.title, c.subtitle, c.category, c.description)
                if x and str(x).strip()
            )
        )
        sc = _relevance_score(folded, blob)
        if sc < thr:
            continue
        cert_sub = (c.category or "").strip()
        cert_item: dict[str, Any] = {
            "id": sid,
            "kind": "certification",
            "label": f"{title} — {_CERTIFICATION_SUFFIX}",
            "href": f"/certifications#certification-{c.id}",
        }
        if cert_sub:
            cert_item["subtitle"] = cert_sub
        out.append((sc, cert_item))

    out.sort(key=lambda x: x[0], reverse=True)
    return out[:_MAX_FUZZY_EXTRA]


def formation_search_suggestions(db: Session, q: str) -> dict[str, Any]:
    safe = _collapse_ws(_sanitize_q(q))
    if not safe:
        return {"suggestions": []}

    pattern = f"%{safe}%"
    starts = f"{safe}%"
    folded = fold_ascii_query(safe)
    if not folded:
        return {"suggestions": []}
    compact = _compact_alnum_key(safe)

    use_unaccent = _use_unaccent_extension(db)
    # pg_trgm est très strict sur les requêtes courtes (ex. "syste") avec un seuil à 0.25.
    # Pour garder un comportement stable, on réserve le chemin `similarity(...) > 0.25`
    # aux requêtes "assez longues", et on laisse `unaccent LIKE` gérer les préfixes courts.
    use_trgm = bool(use_unaccent and len(folded) >= 6 and _use_pg_trgm_search(db))
    if use_trgm:
        # TEST : désactivé pour vérifier le remontée des résultats sans seuil session pg_trgm.
        # db.execute(
        #     text(f"SET pg_trgm.similarity_threshold = {_PG_TRGM_SESSION_THRESHOLD!r}")
        # )
        pass
    try:
        return _formation_search_suggestions_impl(
            db, safe, pattern, starts, folded, compact, use_unaccent, use_trgm
        )
    finally:
        # TEST : RESET désactivé (SET pg_trgm commenté ci-dessus).
        # if use_trgm:
        #     try:
        #         db.execute(text("RESET pg_trgm.similarity_threshold"))
        #     except Exception:
        #         pass
        pass


def _formation_search_suggestions_impl(
    db: Session,
    safe: str,
    pattern: str,
    starts: str,
    folded: str,
    compact: str,
    use_unaccent: bool,
    use_trgm: bool,
) -> dict[str, Any]:
    # Slug : jokers ILIKE uniquement en repli sans unaccent (pas de pg_trgm).
    # (désactivé en mode strict : pas de recherche sur slug)
    suggestions: list[dict[str, Any]] = []
    mod_q_norm = (safe or "").lower().strip() or safe
    th = _PG_TRGM_SESSION_THRESHOLD
    bq_q = bindparam("q", mod_q_norm)
    folded_compact = re.sub(r"[^a-z0-9]+", "", folded)
    # Fallback “compact” :
    # - utile surtout quand `pg_trgm` est actif (requêtes longues) car `similarity` peut être trop strict
    #   vs titres avec espaces / ponctuation.
    # - aussi utile si la saisie est “collée” (`langagec`) alors que le titre contient des séparateurs.
    use_compact = bool(
        compact
        and len(compact) >= 4
        and (use_trgm or (use_unaccent and compact != folded_compact))
    )
    # --- Reconversion (topic) ---
    if use_trgm:
        rc_trgm = text(_reconversion_trgm_filter_sql(th)).bindparams(bq_q)
        rc_where = (
            or_(
                rc_trgm,
                text(_compact_substring_filter_sql("reconversion_topic.hero_title", compact)),
                text(_compact_substring_filter_sql("COALESCE(reconversion_topic.hero_subtitle, '')", compact)),
            )
            if use_compact
            else rc_trgm
        )
        rc_order = text(
            "GREATEST("
            f"{_trgm_pair_score_sql('reconversion_topic.hero_title')}, "
            f"{_trgm_pair_score_sql('reconversion_topic.hero_subtitle')}"
            ") DESC NULLS LAST"
        ).bindparams(bq_q)
        rc_rows = (
            db.query(ReconversionTopic)
            .filter(rc_where)
            .order_by(rc_order, ReconversionTopic.hero_title.asc())
            .limit(_MAX_RECONVERSION)
            .all()
        )
    elif use_unaccent:
        rc_filter = or_(
            _unaccent_like(ReconversionTopic.hero_title, folded),
            _unaccent_like(ReconversionTopic.hero_subtitle, folded),
            *(
                (
                    _compact_unaccent_expr(ReconversionTopic.hero_title).like(f"%{compact}%"),
                    _compact_unaccent_expr(ReconversionTopic.hero_subtitle).like(f"%{compact}%"),
                )
                if use_compact
                else ()
            ),
        )
        rc_rows = (
            db.query(ReconversionTopic)
            .filter(rc_filter)
            .order_by(ReconversionTopic.hero_title.asc())
            .limit(_MAX_RECONVERSION)
            .all()
        )
    else:
        rc_filter = or_(
            ReconversionTopic.hero_title.ilike(pattern),
            ReconversionTopic.hero_subtitle.ilike(pattern),
        )
        rc_rows = (
            db.query(ReconversionTopic)
            .filter(rc_filter)
            .order_by(ReconversionTopic.hero_title.asc())
            .limit(_MAX_RECONVERSION)
            .all()
        )
    for r in rc_rows:
        slug = (r.slug or "").strip()
        if slug:
            href = f"/formation/reconversion/{slug}"
        else:
            href = href_for_reconversion_title(r.hero_title)
        title = (r.hero_title or "").strip() or slug or "Reconversion"
        suggestions.append(
            {
                "id": f"reconversion:{slug or r.id}",
                "kind": "reconversion",
                "label": f"{title} — {_RECONVERSION_SUFFIX}",
                "href": href,
            }
        )

    # --- Formations à la carte (ponctuelle_formation) ---
    if use_trgm:
        po_trgm = text(_ponctuelle_formation_trgm_filter_sql(th)).bindparams(bq_q)
        po_where = (
            or_(
                po_trgm,
                text(_compact_substring_filter_sql("ponctuelle_formation.hero_title", compact)),
                text(_compact_substring_filter_sql("COALESCE(ponctuelle_formation.hero_subtitle, '')", compact)),
            )
            if use_compact
            else po_trgm
        )
        po_order = text(
            "GREATEST("
            f"{_trgm_pair_score_sql('ponctuelle_formation.hero_title')}, "
            f"{_trgm_pair_score_sql('ponctuelle_formation.hero_subtitle')}"
            ") DESC NULLS LAST"
        ).bindparams(bq_q)
        po_form = (
            db.query(PonctuelleFormation)
            .filter(po_where)
            .order_by(po_order, PonctuelleFormation.hero_title.asc())
            .limit(_MAX_PONCTUELLE_FORMATION)
            .all()
        )
    elif use_unaccent:
        po_filter = or_(
            _unaccent_like(PonctuelleFormation.hero_title, folded),
            _unaccent_like(PonctuelleFormation.hero_subtitle, folded),
            *(
                (
                    _compact_unaccent_expr(PonctuelleFormation.hero_title).like(f"%{compact}%"),
                    _compact_unaccent_expr(PonctuelleFormation.hero_subtitle).like(f"%{compact}%"),
                )
                if use_compact
                else ()
            ),
        )
        po_form = (
            db.query(PonctuelleFormation)
            .filter(po_filter)
            .order_by(PonctuelleFormation.hero_title.asc())
            .limit(_MAX_PONCTUELLE_FORMATION)
            .all()
        )
    else:
        po_filter = or_(
            PonctuelleFormation.hero_title.ilike(pattern),
            PonctuelleFormation.hero_subtitle.ilike(pattern),
        )
        po_form = (
            db.query(PonctuelleFormation)
            .filter(po_filter)
            .order_by(PonctuelleFormation.hero_title.asc())
            .limit(_MAX_PONCTUELLE_FORMATION)
            .all()
        )
    for f in po_form:
        slug = (f.slug or "").strip()
        if not ponctuelle_slug_ok(slug):
            continue
        title = (f.hero_title or "").strip() or slug
        suggestions.append(
            {
                "id": f"ponctuelle:{slug}",
                "kind": "ponctuelle",
                "label": f"{title} — {_PONCTUELLE_FORMATION_SUFFIX}",
                "href": formation_ponctuelle_detail_href(slug),
            }
        )

    # --- Certifications (certification_card) ---
    if use_trgm:
        cert_trgm = text(_certification_trgm_filter_sql(th)).bindparams(bq_q)
        cert_where = (
            or_(
                cert_trgm,
                text(_compact_substring_filter_sql("certification_card.title", compact)),
            )
            if use_compact
            else cert_trgm
        )
        cert_order = text(
            f"{_trgm_pair_score_sql('certification_card.title')} DESC NULLS LAST"
        ).bindparams(bq_q)
        cert_rows = (
            db.query(CertificationCard)
            .filter(cert_where)
            .order_by(cert_order, CertificationCard.title.asc())
            .limit(_MAX_CERTIFICATION)
            .all()
        )
    elif use_unaccent:
        cert_filter = or_(
            _unaccent_like(CertificationCard.title, folded),
            *(
                (_compact_unaccent_expr(CertificationCard.title).like(f"%{compact}%"),) if use_compact else ()
            ),
        )
        cert_rows = (
            db.query(CertificationCard)
            .filter(cert_filter)
            .order_by(CertificationCard.title.asc())
            .limit(_MAX_CERTIFICATION)
            .all()
        )
    else:
        cert_filter = CertificationCard.title.ilike(pattern)
        cert_rows = (
            db.query(CertificationCard)
            .filter(cert_filter)
            .order_by(CertificationCard.title.asc())
            .limit(_MAX_CERTIFICATION)
            .all()
        )
    for c in cert_rows:
        title_c = (c.title or "").strip() or "Certification"
        cat = (c.category or "").strip()
        item: dict[str, Any] = {
            "id": f"certification:{c.id}",
            "kind": "certification",
            "label": f"{title_c} — {_CERTIFICATION_SUFFIX}",
            "href": f"/certifications#certification-{c.id}",
        }
        if cat:
            item["subtitle"] = cat
        suggestions.append(item)

    # --- Modules ponctuels (ponctuelle_module + formation parente) ---
    if use_trgm:
        mod_trgm = text(_ponctuelle_module_join_trgm_filter_sql(th)).bindparams(bq_q)
        mod_trgm_where = (
            or_(
                mod_trgm,
                text(_compact_substring_filter_sql("ponctuelle_module.title", compact)),
                text(_compact_substring_filter_sql("ponctuelle_formation.hero_title", compact)),
                text(_compact_substring_filter_sql("COALESCE(ponctuelle_formation.hero_subtitle, '')", compact)),
            )
            if use_compact
            else mod_trgm
        )
        subtitle_expr = "COALESCE(ponctuelle_formation.hero_subtitle, '')"
        mod_trgm_order = text(
            "GREATEST("
            f"{_trgm_pair_score_sql('ponctuelle_module.title')}, "
            f"{_trgm_pair_score_sql('ponctuelle_formation.hero_title')}, "
            f"{_trgm_pair_score_sql(subtitle_expr)}"
            ") DESC NULLS LAST"
        ).bindparams(bq_q)
        mod_rows = (
            db.query(PonctuelleModule, PonctuelleFormation)
            .join(PonctuelleFormation, PonctuelleModule.formation_id == PonctuelleFormation.id)
            .filter(mod_trgm_where)
            .order_by(
                mod_trgm_order,
                PonctuelleModule.title.asc(),
                PonctuelleModule.id.asc(),
            )
            .limit(_MAX_MODULE)
            .all()
        )
    elif use_unaccent:
        mod_title_match = or_(
            _unaccent_like(PonctuelleModule.title, folded),
            _unaccent_like(PonctuelleFormation.hero_title, folded),
            _unaccent_like(PonctuelleFormation.hero_subtitle, folded),
            *(
                (
                    _compact_unaccent_expr(PonctuelleModule.title).like(f"%{compact}%"),
                    _compact_unaccent_expr(PonctuelleFormation.hero_title).like(f"%{compact}%"),
                    _compact_unaccent_expr(PonctuelleFormation.hero_subtitle).like(f"%{compact}%"),
                )
                if use_compact
                else ()
            ),
        )
        mod_order = case(
            (_unaccent_starts(PonctuelleModule.title, folded), 0),
            (_unaccent_starts(PonctuelleFormation.hero_title, folded), 1),
            else_=2,
        )
        mod_rows = (
            db.query(PonctuelleModule, PonctuelleFormation)
            .join(PonctuelleFormation, PonctuelleModule.formation_id == PonctuelleFormation.id)
            .filter(mod_title_match)
            .order_by(
                mod_order,
                PonctuelleModule.title.asc(),
                PonctuelleModule.id.asc(),
            )
            .limit(_MAX_MODULE)
            .all()
        )
    else:
        mod_title_match = or_(
            PonctuelleModule.title.ilike(pattern),
            PonctuelleFormation.hero_title.ilike(pattern),
            PonctuelleFormation.hero_subtitle.ilike(pattern),
        )
        mod_order = case(
            (PonctuelleModule.title.ilike(starts), 0),
            (PonctuelleFormation.hero_title.ilike(starts), 1),
            else_=2,
        )
        mod_rows = (
            db.query(PonctuelleModule, PonctuelleFormation)
            .join(PonctuelleFormation, PonctuelleModule.formation_id == PonctuelleFormation.id)
            .filter(mod_title_match)
            .order_by(
                mod_order,
                PonctuelleModule.title.asc(),
                PonctuelleModule.id.asc(),
            )
            .limit(_MAX_MODULE)
            .all()
        )
    for mod, formation in mod_rows:
        fslug = (formation.slug or "").strip()
        if not ponctuelle_slug_ok(fslug):
            continue
        mod_title = (mod.title or "").strip()
        if not mod_title:
            continue
        form_title = (formation.hero_title or "").strip() or fslug
        href = f"{formation_ponctuelle_detail_href(fslug)}#ponctuelle-module-{mod.id}"
        suggestions.append(
            {
                "id": f"ponctuelle_module:{mod.id}",
                "kind": "ponctuelle_module",
                "label": mod_title,
                "subtitle": form_title,
                "href": href,
            }
        )

    # --- Modules reconversion (reconversion_pack_module + topic parent) ---
    # Dédup intra-format : un même module peut apparaître dans plusieurs packs → une seule suggestion
    # par titre normalisé (`lower(btrim(title))`), en conservant la meilleure ligne selon le tri actuel.
    rc_mod_dedupe_key = func.lower(func.btrim(ReconversionPackModule.title))

    if use_trgm:
        rc_mod_trgm = text(_reconversion_pack_module_join_trgm_filter_sql(th)).bindparams(bq_q)
        rc_mod_where = (
            or_(
                rc_mod_trgm,
                text(_compact_substring_filter_sql("reconversion_pack_module.title", compact)),
                text(_compact_substring_filter_sql("reconversion_topic.hero_title", compact)),
                text(_compact_substring_filter_sql("COALESCE(reconversion_topic.hero_subtitle, '')", compact)),
            )
            if use_compact
            else rc_mod_trgm
        )
        rc_subtitle_expr = "COALESCE(reconversion_topic.hero_subtitle, '')"
        rc_mod_order = text(
            "GREATEST("
            f"{_trgm_pair_score_sql('reconversion_pack_module.title')}, "
            f"{_trgm_pair_score_sql('reconversion_topic.hero_title')}, "
            f"{_trgm_pair_score_sql(rc_subtitle_expr)}"
            ") DESC NULLS LAST"
        ).bindparams(bq_q)
        rc_mod_rows = (
            db.query(ReconversionPackModule, ReconversionPack, ReconversionTopic)
            .distinct(rc_mod_dedupe_key)
            .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
            .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
            .filter(rc_mod_where)
            .order_by(
                rc_mod_dedupe_key,
                rc_mod_order,
                ReconversionPackModule.title.asc(),
                ReconversionPackModule.id.asc(),
            )
            .limit(_MAX_RECONVERSION_PACK_MODULE)
            .all()
        )
    elif use_unaccent:
        rc_mod_filter = or_(
            _unaccent_like(ReconversionPackModule.title, folded),
            _unaccent_like(ReconversionTopic.hero_title, folded),
            _unaccent_like(ReconversionTopic.hero_subtitle, folded),
            *(
                (
                    _compact_unaccent_expr(ReconversionPackModule.title).like(f"%{compact}%"),
                    _compact_unaccent_expr(ReconversionTopic.hero_title).like(f"%{compact}%"),
                    _compact_unaccent_expr(ReconversionTopic.hero_subtitle).like(f"%{compact}%"),
                )
                if use_compact
                else ()
            ),
        )
        rc_mod_rows = (
            db.query(ReconversionPackModule, ReconversionPack, ReconversionTopic)
            .distinct(rc_mod_dedupe_key)
            .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
            .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
            .filter(rc_mod_filter)
            .order_by(
                rc_mod_dedupe_key,
                ReconversionPackModule.title.asc(),
                ReconversionPackModule.id.asc(),
            )
            .limit(_MAX_RECONVERSION_PACK_MODULE)
            .all()
        )
    else:
        rc_mod_filter = or_(
            ReconversionPackModule.title.ilike(pattern),
            ReconversionTopic.hero_title.ilike(pattern),
            ReconversionTopic.hero_subtitle.ilike(pattern),
        )
        rc_mod_rows = (
            db.query(ReconversionPackModule, ReconversionPack, ReconversionTopic)
            .distinct(rc_mod_dedupe_key)
            .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
            .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
            .filter(rc_mod_filter)
            .order_by(
                rc_mod_dedupe_key,
                ReconversionPackModule.title.asc(),
                ReconversionPackModule.id.asc(),
            )
            .limit(_MAX_RECONVERSION_PACK_MODULE)
            .all()
        )
    for mod, _pack, topic in rc_mod_rows:
        slug = (topic.slug or "").strip()
        if not slug:
            continue
        mod_title = (mod.title or "").strip()
        if not mod_title:
            continue
        track_title = (topic.hero_title or "").strip() or slug
        href = f"/formation/reconversion/{slug}#reconversion-pack-detail-mod-{mod.id}"
        suggestions.append(
            {
                "id": f"reconversion_module:{mod.id}",
                "kind": "reconversion_module",
                "label": mod_title,
                "subtitle": track_title,
                "href": href,
            }
        )

    # IMPORTANT (test de filtrage strict) :
    # - pas de couche Python (désactivation volontaire de `_fuzzy_extras`)
    # - pas de fallback : si SQL ne remonte rien, on retourne immédiatement []
    if not suggestions:
        return {"suggestions": []}

    return {"suggestions": suggestions[:60]}

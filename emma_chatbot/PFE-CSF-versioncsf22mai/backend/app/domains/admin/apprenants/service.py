from __future__ import annotations

import logging
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.timezones import ensure_utc
from app.domains.validation.service import (
    check_and_trigger_pack_recommendation,
    compute_module_presence,
    trigger_validation_documents_for_module,
)
from app.persistence.models import (
    AdminPlanningReminderRule,
    ApprenantGroup,
    ApprenantGroupAccess,
    ApprenantGroupMember,
    ApprenantMemberNote,
    GroupSession,
    LearnerCertificationResult,
    LearnerProgress,
    MemberEnrollment,
    PlanningAttendance,
    PlanningSession,
    PlanningSessionGroup,
    PonctuelleFormation,
    PonctuelleModule,
    ReconversionPack,
    ReconversionPackModule,
    ReconversionTopic,
    SessionAttendance,
    User,
    ValidationDocument,
)


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def module_ref(source: str, pk: int) -> str:
    return f"{source}:{pk}"


CATALOG_ENROLLMENT_MARKER = "__catalog_enrollment__"
SESSION_MODULE_REF_MARKER = "__session_module_ref__"


def _catalog_enrollment_description(enrollment_kind: str, target_ref: str) -> str:
    return f"{CATALOG_ENROLLMENT_MARKER}|{enrollment_kind}|{target_ref}"


def _parse_session_module_ref(description: str | None) -> str | None:
    if not description:
        return None
    for line in description.split("\n"):
        line = line.strip()
        if line.startswith(f"{SESSION_MODULE_REF_MARKER}|"):
            return line.split("|", 1)[1].strip() or None
    return None


def _is_catalog_enrollment_group(group: ApprenantGroup | None) -> bool:
    if not group:
        return False
    desc = (group.description or "").strip()
    if desc.startswith(f"{CATALOG_ENROLLMENT_MARKER}|"):
        return True
    # Compat: anciens groupes d'inscription créés avant le marqueur
    name = (group.name or "").strip().lower()
    return name.startswith("inscription")


def _set_member_module_unlocked(db: Session, member: ApprenantGroupMember, target_ref: str) -> None:
    ref = (target_ref or "").strip()
    if not ref:
        return
    row = (
        db.query(LearnerProgress)
        .filter(
            LearnerProgress.member_id == int(member.id),
            LearnerProgress.target_ref == ref,
        )
        .first()
    )
    if not row:
        ensure_member_progress_rows(db, member)
        row = (
            db.query(LearnerProgress)
            .filter(
                LearnerProgress.member_id == int(member.id),
                LearnerProgress.target_ref == ref,
            )
            .first()
        )
    if row:
        row.locked = False
        row.opened_by_admin = True
        if row.status == "not_started":
            row.status = "in_progress"
        db.flush()


def _unlock_module_for_member(db: Session, member: ApprenantGroupMember, target_ref: str) -> None:
    # Déverrouille pour le membre courant
    _set_member_module_unlocked(db, member, target_ref)
    # ...et persiste le déverrouillage sur tous les groupes du même apprenant
    # (inscription/session), afin qu'un nouveau groupe ne reverrouille pas
    # un module déjà ouvert.
    email_norm = normalize_email(member.email_normalized or member.email)
    if not email_norm:
        return
    peers = (
        db.query(ApprenantGroupMember)
        .filter(
            ApprenantGroupMember.email_normalized == email_norm,
            ApprenantGroupMember.id != int(member.id),
        )
        .all()
    )
    for peer in peers:
        _set_member_module_unlocked(db, peer, target_ref)


def _unlock_module_for_group_members(
    db: Session,
    group_id: int,
    target_ref: str,
    member_ids: list[int] | None = None,
) -> None:
    ref = (target_ref or "").strip()
    if not ref:
        return
    q = db.query(ApprenantGroupMember).filter(ApprenantGroupMember.group_id == int(group_id))
    if member_ids is not None:
        q = q.filter(ApprenantGroupMember.id.in_(member_ids))
    for member in q.all():
        _unlock_module_for_member(db, member, ref)


def first_int_from_text(value: str | None, default: int = 0) -> int:
    text = (value or "").strip()
    digits = []
    for char in text:
        if char.isdigit():
            digits.append(char)
        elif digits:
            break
    if digits:
        return int("".join(digits))
    return default


_RE_JOURS_HPAR_JOUR = re.compile(
    r"(\d+)\s*jours?\s*\(?(\d+)\s*h", re.IGNORECASE
)
_RE_HEURES = re.compile(r"(\d+)\s*h", re.IGNORECASE)


def minutes_from_duration_text(value: str | None, default_minutes: int = 120) -> int:
    text = (value or "").strip()
    if not text:
        return default_minutes

    # "2 jours (4h/jour)" or "3jours(4h/j)" → days * hours_per_day * 60
    m = _RE_JOURS_HPAR_JOUR.search(text)
    if m:
        days = int(m.group(1))
        h_per_day = int(m.group(2))
        total = days * h_per_day * 60
        return total if total > 0 else default_minutes

    # "6 heures" or "8h" → hours * 60
    m = _RE_HEURES.search(text)
    if m:
        hours = int(m.group(1))
        return hours * 60 if hours > 0 else default_minutes

    # Fallback: first integer treated as hours
    hours = first_int_from_text(text, 0)
    if hours <= 0:
        return default_minutes
    return hours * 60


def access_kind_label(access_kind: str) -> str:
    labels = {
        "reconversion_topic": "Parcours reconversion",
        "reconversion_pack": "Pack reconversion",
        "ponctuelle_formation": "Formation ponctuelle",
        "reconversion_module": "Module reconversion",
        "ponctuelle_module": "Module ponctuel",
    }
    return labels.get(access_kind, access_kind)


def _unique_preserved(items: list[str]) -> list[str]:
    out: list[str] = []
    for item in items:
        value = item.strip()
        if value and value not in out:
            out.append(value)
    return out


def _parse_int_id(raw: str, field_name: str) -> int:
    try:
        value = int(str(raw).strip())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"{field_name} invalide.") from e
    if value <= 0:
        raise HTTPException(status_code=400, detail=f"{field_name} invalide.")
    return value


def _opt_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    return text if text else None


def _compact_pack_label(pack: ReconversionPack) -> str:
    return (_opt_text(pack.badge_label) or _opt_text(pack.tab_label) or _opt_text(pack.variant_slug) or str(pack.id)).upper()


def _topic_by_slug(db: Session, slug: str) -> ReconversionTopic:
    topic = db.query(ReconversionTopic).filter(ReconversionTopic.slug == slug).first()
    if not topic:
        raise HTTPException(status_code=400, detail="Parcours reconversion introuvable.")
    return topic


def _ponctuelle_by_slug(db: Session, slug: str) -> PonctuelleFormation:
    form = db.query(PonctuelleFormation).filter(PonctuelleFormation.slug == slug).first()
    if not form:
        raise HTTPException(status_code=400, detail="Formation ponctuelle introuvable.")
    return form


def _pack_by_id(db: Session, pack_id: str | int) -> ReconversionPack:
    pack_pk = int(pack_id)
    pack = db.query(ReconversionPack).filter(ReconversionPack.id == pack_pk).first()
    if not pack:
        raise HTTPException(status_code=400, detail="Pack reconversion introuvable.")
    return pack


def _ponctuelle_module_by_target_ref(db: Session, target_ref: str) -> PonctuelleModule | None:
    if not target_ref.startswith("ponctuelle_module:"):
        return None
    module_id = _parse_int_id(target_ref.split(":")[-1], "targetRef")
    return db.query(PonctuelleModule).filter(PonctuelleModule.id == module_id).first()


def _reconversion_module_by_target_ref(db: Session, target_ref: str) -> ReconversionPackModule | None:
    if not target_ref.startswith("reconversion_pack_module:"):
        return None
    module_id = _parse_int_id(target_ref.split(":")[-1], "targetRef")
    return db.query(ReconversionPackModule).filter(ReconversionPackModule.id == module_id).first()


def _ponctuelle_formation_context_for_module(db: Session, target_ref: str) -> tuple[str | None, str | None]:
    row = _ponctuelle_module_by_target_ref(db, target_ref)
    if not row:
        return None, None
    form = db.query(PonctuelleFormation).filter(PonctuelleFormation.id == int(row.formation_id)).first()
    if not form:
        return None, None
    return form.slug, form.hero_title


def _group_ponctuelle_slugs(group: ApprenantGroup) -> list[str]:
    values: list[str] = []
    raw = group.ponctuelle_formation_slugs or []
    if isinstance(raw, list):
        values.extend(str(item) for item in raw if str(item).strip())
    if group.ponctuelle_formation_slug:
        values.append(group.ponctuelle_formation_slug)
    return _unique_preserved(values)


def _refresh_group_ponctuelle_scope_from_accesses(db: Session, group: ApprenantGroup) -> None:
    accesses = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.group_id == int(group.id))
        .order_by(ApprenantGroupAccess.id.asc())
        .all()
    )
    slugs = _group_ponctuelle_slugs(group)
    for access in accesses:
        if access.access_kind == "ponctuelle_formation":
            slugs.append(access.target_ref)
        elif access.access_kind == "ponctuelle_module":
            slug, _label = _ponctuelle_formation_context_for_module(db, access.target_ref)
            if slug:
                slugs.append(slug)
    unique = _unique_preserved(slugs)
    group.ponctuelle_formation_slugs = unique or None
    group.ponctuelle_formation_slug = unique[0] if len(unique) == 1 else None


def _gold_module_for(db: Session, module: ReconversionPackModule) -> ReconversionPackModule | None:
    """Find the equivalent module in the GOLD pack of the same topic."""
    pack = db.query(ReconversionPack).filter(ReconversionPack.id == int(module.pack_id)).first()
    if not pack:
        return None
    gold = (
        db.query(ReconversionPack)
        .filter(
            ReconversionPack.topic_id == pack.topic_id,
            ReconversionPack.style_key == "gold",
        )
        .first()
    )
    if not gold or gold.id == pack.id:
        return None
    return (
        db.query(ReconversionPackModule)
        .filter(
            ReconversionPackModule.pack_id == int(gold.id),
            ReconversionPackModule.title == module.title,
        )
        .first()
    )


def _gold_pack_duree_for_module(db: Session, module: ReconversionPackModule) -> str | None:
    gold = _gold_module_for(db, module)
    return gold.duree if gold else None


def _module_duration_minutes(db: Session, target_ref: str) -> int:
    ponctuelle = _ponctuelle_module_by_target_ref(db, target_ref)
    if ponctuelle:
        return minutes_from_duration_text(ponctuelle.duration, 120)
    reconversion = _reconversion_module_by_target_ref(db, target_ref)
    if reconversion:
        duree = reconversion.duree
        if not duree:
            duree = _gold_pack_duree_for_module(db, reconversion)
        return minutes_from_duration_text(duree, 120)
    return 120


def _target_label_for_session(db: Session, target_ref: str | None, fallback_label: str | None = None) -> str | None:
    if target_ref:
        ponctuelle = _ponctuelle_module_by_target_ref(db, target_ref)
        if ponctuelle:
            return ponctuelle.title
        reconversion = _reconversion_module_by_target_ref(db, target_ref)
        if reconversion:
            return reconversion.title
    return _opt_text(fallback_label)


def _set_minutes_and_mode_for_progress(db: Session, row: LearnerProgress) -> None:
    if row.access_kind in ("ponctuelle_module", "reconversion_module"):
        row.progress_mode = "hours"
        row.minutes_total = _module_duration_minutes(db, row.target_ref)
    else:
        row.progress_mode = "manual"
        if row.minutes_total is None:
            row.minutes_total = _module_duration_minutes(db, row.target_ref) if row.target_ref.startswith(("ponctuelle_module:", "reconversion_pack_module:")) else None


def _as_utc(dt: datetime) -> datetime:
    return ensure_utc(dt)


def _group_session_end_utc(session: GroupSession) -> datetime:
    start = _as_utc(session.scheduled_at)
    duration = int(session.duration_minutes or 0)
    if duration <= 0:
        duration = 120
    return start + timedelta(minutes=duration)


def _group_session_has_ended(session: GroupSession, now: datetime | None = None) -> bool:
    now = _as_utc(now or datetime.now(timezone.utc))
    return _group_session_end_utc(session) <= now


def _elapsed_group_sessions_for_module(
    db: Session, member: ApprenantGroupMember, target_ref: str
) -> list[GroupSession]:
    """Séances du groupe dont l'heure de fin est passée (progression temporelle, hors présence)."""
    sessions = (
        db.query(GroupSession)
        .filter(
            GroupSession.group_id == int(member.group_id),
            or_(
                GroupSession.target_ref == target_ref,
                GroupSession.target_ref.is_(None),
                GroupSession.target_ref == "",
            ),
        )
        .all()
    )
    return [s for s in sessions if _group_session_has_ended(s)]


def refresh_learner_progress_for_user(db: Session, user: User) -> None:
    """Recalcule la progression module (dates de séances) pour tous les groupes de l'apprenant."""
    members = learner_members_for_user(db, user)
    for member in members:
        _recompute_member_progress(db, member)
    if members:
        db.commit()


def _learner_module_progress_bars(db: Session, user: User, limit: int = 6) -> list[dict]:
    members = learner_members_for_user(db, user)
    bars: list[dict] = []
    seen_refs: set[str] = set()
    for member in members:
        for row in _member_progress_rows(db, int(member.id)):
            if row.access_kind not in ("ponctuelle_module", "reconversion_module"):
                continue
            ref = row.target_ref or ""
            if ref in seen_refs:
                continue
            seen_refs.add(ref)
            title = (row.title or ref).strip()
            if len(title) > 24:
                title = f"{title[:22]}…"
            group_presence = _presence_hours_for_group_member(
                db, int(member.id), int(member.group_id)
            )
            module_presence = _member_module_attendance_presence(db, member, ref)
            presence = (
                module_presence
                if module_presence["presentHours"] + module_presence["absentHours"] > 0
                else group_presence
            )
            bars.append(
                {
                    "title": title,
                    "percent": int(row.progress_percent or 0),
                    "targetRef": ref,
                    "groupId": str(member.group_id),
                    "memberId": str(member.id),
                    "presence": presence,
                }
            )
    bars.sort(key=lambda item: (-item["percent"], item["title"].lower()))
    return bars[:limit]


def _recompute_member_progress(db: Session, member: ApprenantGroupMember) -> None:
    rows = _member_progress_rows(db, int(member.id))
    group = db.query(ApprenantGroup).filter(ApprenantGroup.id == int(member.group_id)).first()
    forced_open_ref = _parse_session_module_ref(group.description if group else None)
    module_rows = [r for r in rows if r.access_kind in ("ponctuelle_module", "reconversion_module")]
    num_modules = len(module_rows) or 1
    newly_completed_refs: list[str] = []

    for row in rows:
        _set_minutes_and_mode_for_progress(db, row)
        was_completed = row.status == "completed"
        if row.access_kind in ("ponctuelle_module", "reconversion_module"):
            elapsed_sessions = _elapsed_group_sessions_for_module(db, member, row.target_ref)
            row.minutes_completed = sum(
                int(s.duration_minutes or 0) or 120 for s in elapsed_sessions
            )
            catalog_minutes = int(_module_duration_minutes(db, row.target_ref) or 120)
            if row.access_kind == "reconversion_module":
                all_module_sessions = (
                    db.query(GroupSession)
                    .filter(
                        GroupSession.group_id == int(member.group_id),
                        GroupSession.target_ref == row.target_ref,
                    )
                    .all()
                )
                total_planned = sum(int(s.duration_minutes or 0) for s in all_module_sessions)
                total_minutes = max(catalog_minutes, total_planned)
            else:
                total_minutes = int(row.minutes_total or catalog_minutes)
            row.minutes_total = total_minutes
            if row.completed_by_admin:
                row.progress_percent = 100
                row.status = "completed"
            elif total_minutes > 0:
                row.progress_percent = min(100, int(round((row.minutes_completed / total_minutes) * 100)))
                if row.progress_percent >= 100:
                    row.status = "completed"
                elif row.progress_percent > 0:
                    row.status = "in_progress"
                else:
                    row.status = "not_started"
            if row.status == "completed" and not was_completed and row.target_ref:
                newly_completed_refs.append(row.target_ref)
        else:
            if row.completed_by_admin and int(row.progress_percent or 0) < 100:
                row.progress_percent = 100
                row.status = "completed"
            if row.current_flag:
                row.locked = False
                row.opened_by_admin = True
    module_access_rows = [
        row for row in rows if row.access_kind in ("ponctuelle_module", "reconversion_module")
    ]
    for row in module_access_rows:
        if forced_open_ref and row.target_ref == forced_open_ref:
            row.locked = False
            row.opened_by_admin = True
            if row.status == "not_started":
                row.status = "in_progress"
            continue
        if row.opened_by_admin or row.completed_by_admin:
            row.locked = False
            continue
        if row.status == "completed" or int(row.progress_percent or 0) >= 100:
            row.locked = False
            row.opened_by_admin = True
            continue
        row.locked = True
    db.flush()

    for row in module_access_rows:
        if not row.target_ref:
            continue
        presence = compute_module_presence(db, int(member.id), row.target_ref)
        if int(presence.get("total_sessions") or 0) <= 0:
            continue
        existing = (
            db.query(ValidationDocument)
            .filter_by(
                member_id=int(member.id),
                kind="certificate",
                scope_ref=row.target_ref,
            )
            .first()
        )
        if existing is not None:
            continue
        try:
            trigger_validation_documents_for_module(db, int(member.id), row.target_ref)
            logger.info(
                "Validation documents triggered (presence) for member=%s module=%s",
                member.id,
                row.target_ref,
            )
        except Exception:
            logger.exception(
                "Failed to trigger validation for member=%s module=%s",
                member.id,
                row.target_ref,
            )

    reconversion_module_rows = [
        r for r in module_access_rows if r.access_kind == "reconversion_module"
    ]
    if newly_completed_refs and reconversion_module_rows:
        if group and group.reconversion_pack_id:
            all_done = all(
                r.status == "completed" or int(r.progress_percent or 0) >= 100
                for r in reconversion_module_rows
            )
            if all_done:
                try:
                    check_and_trigger_pack_recommendation(db, int(member.id), int(group.reconversion_pack_id))
                    logger.info("Pack recommendation checked for member=%s pack=%s", member.id, group.reconversion_pack_id)
                except Exception:
                    logger.exception("Failed to check pack recommendation for member=%s", member.id)


def _resolve_group_scope(group: ApprenantGroup, db: Session) -> dict:
    out = {
        "formationLabel": "Parcours sur mesure",
        "reconversionTopicLabel": None,
        "reconversionPackLabel": None,
        "ponctuelleFormationLabel": None,
        "ponctuelleFormationLabels": [],
    }
    if group.format == "reconversion":
        if group.reconversion_topic_slug:
            topic = _topic_by_slug(db, group.reconversion_topic_slug)
            out["reconversionTopicLabel"] = topic.hero_title
            out["formationLabel"] = topic.hero_title
        if group.reconversion_pack_id:
            pack = _pack_by_id(db, int(group.reconversion_pack_id))
            topic = db.query(ReconversionTopic).filter(ReconversionTopic.id == pack.topic_id).first()
            topic_label = topic.hero_title if topic else out["formationLabel"]
            pack_label = _compact_pack_label(pack)
            out["reconversionTopicLabel"] = topic_label
            out["reconversionPackLabel"] = pack_label
            out["formationLabel"] = f"{topic_label} — {pack_label}"
    elif group.format == "ponctuelle":
        labels: list[str] = []
        for slug in _group_ponctuelle_slugs(group):
            form = _ponctuelle_by_slug(db, slug)
            labels.append(form.hero_title)
        labels = _unique_preserved(labels)
        if labels:
            out["ponctuelleFormationLabels"] = labels
            out["ponctuelleFormationLabel"] = labels[0] if len(labels) == 1 else labels[0]
            out["formationLabel"] = labels[0] if len(labels) == 1 else f"Modules ponctuels — {len(labels)} formations"
    return out


def _group_member_full_name(member: ApprenantGroupMember) -> str:
    first = (member.first_name or "").strip()
    last = (member.last_name or "").strip()
    name = " ".join(part for part in (first, last) if part)
    if name:
        return name
    return member.email


def _member_progress_rows(db: Session, member_id: int) -> list[LearnerProgress]:
    return (
        db.query(LearnerProgress)
        .filter(LearnerProgress.member_id == member_id)
        .order_by(LearnerProgress.current_flag.desc(), LearnerProgress.updated_at.desc(), LearnerProgress.id.asc())
        .all()
    )


def _member_progress_average(db: Session, member_id: int) -> int:
    rows = _member_progress_rows(db, member_id)
    if not rows:
        return 0
    return int(round(sum(int(r.progress_percent or 0) for r in rows) / len(rows)))


def _member_attendance_rows(db: Session, member_id: int) -> list[SessionAttendance]:
    return db.query(SessionAttendance).filter(SessionAttendance.member_id == member_id).all()


def _member_attendance_rows_for_group(
    db: Session, member_id: int, group_id: int
) -> list[SessionAttendance]:
    return (
        db.query(SessionAttendance)
        .join(GroupSession, GroupSession.id == SessionAttendance.session_id)
        .filter(
            SessionAttendance.member_id == member_id,
            GroupSession.group_id == group_id,
        )
        .all()
    )


def _module_target_refs_for_group(db: Session, group_id: int) -> set[str]:
    refs: set[str] = set()
    accesses = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.group_id == group_id)
        .all()
    )
    for access in accesses:
        if access.access_kind in ("ponctuelle_module", "reconversion_module"):
            refs.add(access.target_ref)
        else:
            for target in expand_access_targets(db, access.access_kind, access.target_ref):
                refs.add(target["targetRef"])
    return refs


def _member_attendance_rate(db: Session, member_id: int) -> int:
    rows = [r for r in _member_attendance_rows(db, member_id) if (r.status or "") != "pending"]
    if not rows:
        return 0
    present_n = sum(1 for r in rows if r.status == "present")
    excused_n = sum(1 for r in rows if r.status == "excused")
    return int(round(((present_n + excused_n) / len(rows)) * 100))


def _session_duration_minutes(session: GroupSession) -> int:
    duration = int(session.duration_minutes or 0)
    return duration if duration > 0 else 120


def _presence_hours_from_attendance_sessions(
    pairs: list[tuple[SessionAttendance, GroupSession]],
) -> dict:
    """Heures présentes / absentes + %.

    Règle métier:
    - pending futur: ignoré
    - pending passé: compté absent (pas de pointage saisi)
    """
    present_minutes = 0
    absent_minutes = 0
    for attendance, session in pairs:
        status = (attendance.status or "").strip()
        if (session.status or "").strip() == "cancelled":
            continue
        minutes = _session_duration_minutes(session)
        if status in ("", "pending"):
            if _group_session_has_ended(session):
                absent_minutes += minutes
            continue
        if status in ("present", "excused"):
            present_minutes += minutes
        elif status == "absent":
            absent_minutes += minutes
    resolved_minutes = present_minutes + absent_minutes
    rate = (
        int(round((present_minutes / resolved_minutes) * 100))
        if resolved_minutes > 0
        else 0
    )
    return {
        "presentHours": int(round(present_minutes / 60)),
        "absentHours": int(round(absent_minutes / 60)),
        "attendancePercent": rate,
    }


def _attendance_session_pairs_for_group(
    db: Session,
    member_id: int,
    group_id: int,
    session_filter=None,
) -> list[tuple[SessionAttendance, GroupSession]]:
    q = (
        db.query(SessionAttendance, GroupSession)
        .join(GroupSession, GroupSession.id == SessionAttendance.session_id)
        .filter(
            SessionAttendance.member_id == member_id,
            GroupSession.group_id == group_id,
        )
    )
    if session_filter is not None:
        q = q.filter(session_filter)
    return q.all()


def _presence_hours_for_group_member(db: Session, member_id: int, group_id: int) -> dict:
    return _presence_hours_from_attendance_sessions(
        _attendance_session_pairs_for_group(db, member_id, group_id)
    )


def _user_attendance_presence(db: Session, user: User) -> dict:
    pairs: list[tuple[SessionAttendance, GroupSession]] = []
    for member in learner_members_for_user(db, user):
        pairs.extend(
            _attendance_session_pairs_for_group(db, int(member.id), int(member.group_id))
        )
    return _presence_hours_from_attendance_sessions(pairs)


def _member_module_attendance_presence(
    db: Session, member: ApprenantGroupMember, target_ref: str
) -> dict:
    """
    Présence (heures) pour une barre du dashboard : séances du module (target_ref),
    avec repli sur le groupe si mono-module ou séances sans target_ref.
    """
    group_id = int(member.group_id)
    member_id = int(member.id)
    single_module_group = len(_module_target_refs_for_group(db, group_id)) <= 1

    session_filter = GroupSession.target_ref == target_ref
    if single_module_group:
        session_filter = or_(
            GroupSession.target_ref == target_ref,
            GroupSession.target_ref.is_(None),
            GroupSession.target_ref == "",
        )

    presence = _presence_hours_from_attendance_sessions(
        _attendance_session_pairs_for_group(db, member_id, group_id, session_filter)
    )
    if presence["presentHours"] + presence["absentHours"] > 0:
        return presence

    if single_module_group:
        return _presence_hours_for_group_member(db, member_id, group_id)

    return presence


def _serialize_member(member: ApprenantGroupMember, db: Session) -> dict:
    notes_count = (
        db.query(ApprenantMemberNote)
        .filter(ApprenantMemberNote.member_id == int(member.id))
        .count()
    )
    return {
        "id": str(member.id),
        "groupId": str(member.group_id),
        "userId": member.user_id,
        "email": member.email,
        "firstName": member.first_name,
        "lastName": member.last_name,
        "fullName": _group_member_full_name(member),
        "status": member.status,
        "pointsTotal": int(member.points_total or 0),
        "linkedAt": member.linked_at,
        "attendanceRate": _member_attendance_rate(db, int(member.id)),
        "progressAverage": _member_progress_average(db, int(member.id)),
        "notesCount": int(notes_count),
    }


def _serialize_access(access: ApprenantGroupAccess, db: Session) -> dict:
    formation_label = None
    if access.access_kind == "ponctuelle_module":
        _formation_slug, formation_label = _ponctuelle_formation_context_for_module(db, access.target_ref)
    return {
        "id": str(access.id),
        "groupId": str(access.group_id),
        "accessKind": access.access_kind,
        "targetRef": access.target_ref,
        "label": access.label,
        "kindLabel": access_kind_label(access.access_kind),
        "targetLabel": access.label,
        "formationLabel": formation_label,
    }


def _attendance_summary(rows: list[SessionAttendance]) -> dict:
    counts = {"total": len(rows), "present": 0, "absent": 0, "excused": 0, "pending": 0}
    for row in rows:
        key = row.status if row.status in counts else "pending"
        counts[key] += 1
    return counts


def _mirror_to_planning_session(db: Session, gs: GroupSession, group_id: int) -> None:
    """Create a PlanningSession + PlanningSessionGroup so the session appears in the calendar."""
    sched = gs.scheduled_at
    if isinstance(sched, str):
        sched = datetime.fromisoformat(sched)
    date_val = sched.date() if hasattr(sched, "date") and callable(sched.date) else sched
    time_str = sched.strftime("%H:%M") if hasattr(sched, "strftime") else None
    ps = PlanningSession(
        title=gs.title,
        module_target_ref=gs.target_ref,
        module_label=gs.target_label or gs.title,
        date=date_val,
        start_time=time_str,
        duration_minutes=int(gs.duration_minutes or 0),
        location=None,
        status=gs.status or "planned",
    )
    db.add(ps)
    db.flush()
    db.add(PlanningSessionGroup(session_id=ps.id, group_id=group_id))
    gs.planning_session_id = int(ps.id)


def _serialize_session(session: GroupSession, db: Session) -> dict:
    rows = (
        db.query(SessionAttendance)
        .filter(SessionAttendance.session_id == int(session.id))
        .order_by(SessionAttendance.member_id.asc())
        .all()
    )
    return {
        "id": str(session.id),
        "groupId": str(session.group_id),
        "accessId": str(session.access_id) if session.access_id else None,
        "targetRef": session.target_ref,
        "targetKind": session.target_kind,
        "targetLabel": session.target_label,
        "title": session.title,
        "scheduledAt": session.scheduled_at,
        "durationMinutes": int(session.duration_minutes or 0),
        "status": session.status,
        "notes": session.notes,
        "attendanceSummary": _attendance_summary(rows),
        "attendance": [
            {"memberId": str(r.member_id), "status": r.status, "note": r.note}
            for r in rows
        ],
    }


def _serialize_progress(row: LearnerProgress) -> dict:
    return {
        "id": str(row.id),
        "memberId": str(row.member_id),
        "accessKind": row.access_kind,
        "targetRef": row.target_ref,
        "title": row.title,
        "progressPercent": int(row.progress_percent or 0),
        "status": row.status,
        "scorePercent": row.score_percent,
        "currentFlag": bool(row.current_flag),
        "locked": bool(row.locked),
        "openedByAdmin": bool(row.opened_by_admin),
        "completedByAdmin": bool(row.completed_by_admin),
        "progressMode": row.progress_mode or "manual",
        "minutesCompleted": int(row.minutes_completed or 0),
        "minutesTotal": row.minutes_total,
        "note": row.note,
        "updatedAt": row.updated_at,
    }


def _serialize_certification(row: LearnerCertificationResult) -> dict:
    return {
        "id": str(row.id),
        "memberId": str(row.member_id),
        "title": row.title,
        "scopeRef": row.scope_ref,
        "scorePercent": row.score_percent,
        "status": row.status,
        "issuer": row.issuer,
        "awardedAt": row.awarded_at,
    }


def _serialize_note(row: ApprenantMemberNote) -> dict:
    return {
        "id": str(row.id),
        "memberId": str(row.member_id),
        "authorName": row.author_name,
        "noteType": row.note_type,
        "content": row.content,
        "createdAt": row.created_at,
    }


def _history_for_member(
    sessions: list[tuple[GroupSession, SessionAttendance]],
    progresses: list[LearnerProgress],
    certs: list[LearnerCertificationResult],
    notes: list[ApprenantMemberNote],
) -> list[dict]:
    out: list[dict] = []
    for session, attendance in sessions:
        out.append(
            {
                "id": f"attendance-{attendance.id}",
                "date": attendance.updated_at or session.updated_at or session.created_at,
                "action": f"Séance — {session.title}",
                "details": f"Présence: {attendance.status}",
                "type": "presence",
            }
        )
    for row in progresses:
        out.append(
            {
                "id": f"progress-{row.id}",
                "date": row.updated_at or row.created_at,
                "action": f"Progression — {row.title}",
                "details": f"{row.progress_percent}% • statut {row.status}",
                "type": "formation",
            }
        )
    for row in certs:
        score = f"{row.score_percent}%" if row.score_percent is not None else "sans score"
        out.append(
            {
                "id": f"cert-{row.id}",
                "date": row.awarded_at or row.updated_at or row.created_at,
                "action": f"Certification — {row.title}",
                "details": f"{score} • statut {row.status}",
                "type": "evaluation",
            }
        )
    for row in notes:
        out.append(
            {
                "id": f"note-{row.id}",
                "date": row.created_at,
                "action": f"Note — {row.author_name}",
                "details": row.content,
                "type": "note",
            }
        )
    out.sort(key=lambda item: item["date"], reverse=True)
    return out


def _default_pack_for_topic(db: Session, topic_id: int) -> ReconversionPack | None:
    gold = (
        db.query(ReconversionPack)
        .filter(
            ReconversionPack.topic_id == topic_id,
            ReconversionPack.style_key == "gold",
        )
        .order_by(ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .first()
    )
    if gold:
        return gold
    full = (
        db.query(ReconversionPack)
        .filter(
            ReconversionPack.topic_id == topic_id,
            ReconversionPack.pack_kind == "full",
        )
        .order_by(ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .first()
    )
    if full:
        return full
    return (
        db.query(ReconversionPack)
        .filter(ReconversionPack.topic_id == topic_id)
        .order_by(ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .first()
    )


def resolve_access_label(db: Session, access_kind: str, target_ref: str) -> str:
    if access_kind == "reconversion_topic":
        topic = _topic_by_slug(db, target_ref)
        return topic.hero_title
    if access_kind == "reconversion_pack":
        pack = _pack_by_id(db, target_ref)
        topic = db.query(ReconversionTopic).filter(ReconversionTopic.id == pack.topic_id).first()
        topic_label = topic.hero_title if topic else "Reconversion"
        return f"{topic_label} — {_compact_pack_label(pack)}"
    if access_kind == "ponctuelle_formation":
        return _ponctuelle_by_slug(db, target_ref).hero_title
    if access_kind == "reconversion_module":
        module_id = _parse_int_id(target_ref.split(":")[-1], "targetRef")
        row = db.query(ReconversionPackModule).filter(ReconversionPackModule.id == module_id).first()
        if not row:
            raise HTTPException(status_code=400, detail="Module reconversion introuvable.")
        return row.title
    if access_kind == "ponctuelle_module":
        module_id = _parse_int_id(target_ref.split(":")[-1], "targetRef")
        row = db.query(PonctuelleModule).filter(PonctuelleModule.id == module_id).first()
        if not row:
            raise HTTPException(status_code=400, detail="Module ponctuelle introuvable.")
        return row.title
    raise HTTPException(status_code=400, detail="Type d'accès inconnu.")


def expand_access_targets(db: Session, access_kind: str, target_ref: str) -> list[dict]:
    if access_kind == "reconversion_topic":
        topic = _topic_by_slug(db, target_ref)
        pack = _default_pack_for_topic(db, int(topic.id))
        if not pack:
            return []
        access_kind = "reconversion_pack"
        target_ref = str(pack.id)
    if access_kind == "reconversion_pack":
        pack = _pack_by_id(db, target_ref)
        rows = (
            db.query(ReconversionPackModule)
            .filter(ReconversionPackModule.pack_id == int(pack.id))
            .order_by(ReconversionPackModule.sort_order.asc(), ReconversionPackModule.id.asc())
            .all()
        )
        result = []
        for row in rows:
            img = row.image_url
            if not img:
                gold = _gold_module_for(db, row)
                img = gold.image_url if gold else None
            result.append({
                "targetRef": module_ref("reconversion_pack_module", int(row.id)),
                "accessKind": "reconversion_module",
                "title": row.title,
                "description": row.description or "",
                "typeLabel": "Projet" if (row.module_kind or "").lower() == "project" else "Cours",
                "duration": _opt_text(row.duree) or "2h",
                "imageUrl": img or "/images/iot.png",
            })
        return result
    if access_kind == "ponctuelle_formation":
        form = _ponctuelle_by_slug(db, target_ref)
        rows = (
            db.query(PonctuelleModule)
            .filter(PonctuelleModule.formation_id == int(form.id))
            .order_by(PonctuelleModule.sort_order.asc(), PonctuelleModule.id.asc())
            .all()
        )
        return [
            {
                "targetRef": module_ref("ponctuelle_module", int(row.id)),
                "accessKind": "ponctuelle_module",
                "title": row.title,
                "description": row.description or "",
                "typeLabel": "Projet" if "projet" in (row.project or "").lower() else "Cours",
                "duration": _opt_text(row.duration) or "2h",
                "imageUrl": row.image_url or "/images/iot.png",
            }
            for row in rows
        ]
    if access_kind == "reconversion_module":
        module_id = _parse_int_id(target_ref.split(":")[-1], "targetRef")
        row = db.query(ReconversionPackModule).filter(ReconversionPackModule.id == module_id).first()
        if not row:
            raise HTTPException(status_code=400, detail="Module reconversion introuvable.")
        img = row.image_url
        if not img:
            gold = _gold_module_for(db, row)
            img = gold.image_url if gold else None
        return [
            {
                "targetRef": module_ref("reconversion_pack_module", int(row.id)),
                "accessKind": "reconversion_module",
                "title": row.title,
                "description": row.description or "",
                "typeLabel": "Projet" if (row.module_kind or "").lower() == "project" else "Cours",
                "duration": _opt_text(row.duree) or "2h",
                "imageUrl": img or "/images/iot.png",
            }
        ]
    if access_kind == "ponctuelle_module":
        module_id = _parse_int_id(target_ref.split(":")[-1], "targetRef")
        row = db.query(PonctuelleModule).filter(PonctuelleModule.id == module_id).first()
        if not row:
            raise HTTPException(status_code=400, detail="Module ponctuelle introuvable.")
        return [
            {
                "targetRef": module_ref("ponctuelle_module", int(row.id)),
                "accessKind": "ponctuelle_module",
                "title": row.title,
                "description": row.description or "",
                "typeLabel": "Projet" if "projet" in (row.project or "").lower() else "Cours",
                "duration": _opt_text(row.duration) or "2h",
                "imageUrl": row.image_url or "/images/iot.png",
            }
        ]
    return []


def ensure_member_progress_rows(db: Session, member: ApprenantGroupMember) -> None:
    accesses = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.group_id == int(member.group_id))
        .all()
    )
    existing = {
        row.target_ref: row
        for row in db.query(LearnerProgress).filter(LearnerProgress.member_id == int(member.id)).all()
    }
    created_rows: list[LearnerProgress] = []
    for access in accesses:
        targets = expand_access_targets(db, access.access_kind, access.target_ref)
        if not targets:
            targets = [
                {
                    "targetRef": access.target_ref,
                    "accessKind": access.access_kind,
                    "title": access.label,
                }
            ]
        for idx, target in enumerate(targets):
            target_ref = target["targetRef"]
            if target_ref in existing:
                continue
            access_kind = target.get("accessKind") or access.access_kind
            is_ponctuelle = str(access_kind) == "ponctuelle_module"
            is_hours_based = is_ponctuelle or access_kind == "reconversion_module"
            row = LearnerProgress(
                member_id=int(member.id),
                access_kind=access_kind,
                target_ref=target_ref,
                title=target.get("title") or access.label,
                progress_percent=0,
                status="not_started",
                current_flag=False,
                locked=True,
                opened_by_admin=False,
                completed_by_admin=False,
                progress_mode="hours" if is_hours_based else "manual",
                minutes_completed=0,
                minutes_total=_module_duration_minutes(db, target_ref) if is_hours_based else None,
            )
            created_rows.append(row)
            db.add(row)
    if created_rows:
        db.flush()
    _recompute_member_progress(db, member)


def _default_access_payload_for_group(db: Session, group: ApprenantGroup) -> tuple[str, str, str] | None:
    if group.format == "reconversion":
        if group.reconversion_pack_id:
            label = resolve_access_label(db, "reconversion_pack", str(group.reconversion_pack_id))
            return "reconversion_pack", str(group.reconversion_pack_id), label
        if group.reconversion_topic_slug:
            label = resolve_access_label(db, "reconversion_topic", group.reconversion_topic_slug)
            return "reconversion_topic", group.reconversion_topic_slug, label
        return None
    if group.format == "ponctuelle" and group.ponctuelle_formation_slug:
        label = resolve_access_label(db, "ponctuelle_formation", group.ponctuelle_formation_slug)
        return "ponctuelle_formation", group.ponctuelle_formation_slug, label
    return None


def sync_default_group_access(db: Session, group: ApprenantGroup) -> None:
    (
        db.query(ApprenantGroupAccess)
        .filter(
            ApprenantGroupAccess.group_id == int(group.id),
            ApprenantGroupAccess.access_kind.in_(["reconversion_topic", "reconversion_pack", "ponctuelle_formation"]),
        )
        .delete(synchronize_session=False)
    )
    payload = _default_access_payload_for_group(db, group)
    if payload is None:
        return
    access_kind, target_ref, label = payload
    db.add(
        ApprenantGroupAccess(
            group_id=int(group.id),
            access_kind=access_kind,
            target_ref=target_ref,
            label=label,
        )
    )
    db.flush()


def serialize_group_summary(group: ApprenantGroup, db: Session) -> dict:
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == int(group.id))
        .all()
    )
    accesses_n = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.group_id == int(group.id))
        .count()
    )
    progress_values: list[int] = []
    for member in members:
        progress_values.extend(
            int(row.progress_percent or 0) for row in _member_progress_rows(db, int(member.id))
        )
    scope = _resolve_group_scope(group, db)
    return {
        "id": str(group.id),
        "name": group.name,
        "description": group.description,
        "formationLabel": scope["formationLabel"],
        "format": group.format,
        "status": group.status,
        "startDate": group.start_date,
        "endDate": group.end_date,
        "reconversionTopicSlug": group.reconversion_topic_slug,
        "reconversionTopicLabel": scope["reconversionTopicLabel"],
        "reconversionPackId": str(group.reconversion_pack_id) if group.reconversion_pack_id else None,
        "reconversionPackLabel": scope["reconversionPackLabel"],
        "ponctuelleFormationSlug": group.ponctuelle_formation_slug,
        "ponctuelleFormationLabel": scope["ponctuelleFormationLabel"],
        "ponctuelleFormationSlugs": _group_ponctuelle_slugs(group),
        "ponctuelleFormationLabels": scope.get("ponctuelleFormationLabels") or [],
        "memberCount": len(members),
        "progressAverage": int(round(sum(progress_values) / len(progress_values))) if progress_values else 0,
        "accessCount": int(accesses_n),
    }


def get_filters_and_kpis(db: Session) -> dict:
    topics = db.query(ReconversionTopic).order_by(ReconversionTopic.hero_title.asc()).all()
    forms = db.query(PonctuelleFormation).order_by(PonctuelleFormation.hero_title.asc()).all()
    packs = (
        db.query(ReconversionPack, ReconversionTopic)
        .join(ReconversionTopic, ReconversionPack.topic_id == ReconversionTopic.id)
        .order_by(ReconversionTopic.hero_title.asc(), ReconversionPack.sort_order.asc(), ReconversionPack.id.asc())
        .all()
    )
    groups_n = db.query(ApprenantGroup).count()
    members_n = db.query(ApprenantGroupMember).count()
    progresses = db.query(LearnerProgress).all()
    avg_progress = int(round(sum(int(p.progress_percent or 0) for p in progresses) / len(progresses))) if progresses else 0
    return {
        "formats": [
            {"id": "reconversion", "label": "Reconversion"},
            {"id": "ponctuelle", "label": "Ponctuelle"},
            {"id": "sur_mesure", "label": "Sur mesure"},
        ],
        "reconversionTopics": [{"id": t.slug, "label": t.hero_title} for t in topics],
        "reconversionPacks": [
            {
                "id": str(pack.id),
                "label": _compact_pack_label(pack),
                "topicSlug": topic.slug,
                "variantSlug": pack.variant_slug,
                "packKind": pack.pack_kind,
            }
            for pack, topic in packs
        ],
        "ponctuelleFormations": [{"id": form.slug, "label": form.hero_title} for form in forms],
        "kpis": {
            "groups": groups_n,
            "members": members_n,
            "averageProgress": avg_progress,
        },
    }


def list_groups(
    db: Session,
    *,
    format_filter: str | None = None,
    reconversion_topic_slug: str | None = None,
    ponctuelle_formation_slug: str | None = None,
    reconversion_pack_id: str | None = None,
) -> list[dict]:
    rows = (
        db.query(ApprenantGroup)
        .order_by(ApprenantGroup.created_at.desc(), ApprenantGroup.id.desc())
        .all()
    )
    if format_filter and format_filter != "all":
        rows = [row for row in rows if row.format == format_filter]
    if reconversion_topic_slug and reconversion_topic_slug != "all":
        rows = [row for row in rows if row.reconversion_topic_slug == reconversion_topic_slug]
    if ponctuelle_formation_slug and ponctuelle_formation_slug != "all":
        rows = [row for row in rows if ponctuelle_formation_slug in _group_ponctuelle_slugs(row)]
    if reconversion_pack_id and reconversion_pack_id != "all":
        rows = [row for row in rows if row.reconversion_pack_id == int(reconversion_pack_id)]
    return [serialize_group_summary(row, db) for row in rows]


def get_group(db: Session, group_id: int) -> ApprenantGroup:
    row = db.query(ApprenantGroup).filter(ApprenantGroup.id == group_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Groupe introuvable.")
    return row


def get_member(db: Session, member_id: int) -> ApprenantGroupMember:
    row = db.query(ApprenantGroupMember).filter(ApprenantGroupMember.id == member_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Apprenant introuvable.")
    return row


def get_group_detail(db: Session, group_id: int) -> dict:
    group = get_group(db, group_id)
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == group_id)
        .order_by(ApprenantGroupMember.created_at.asc(), ApprenantGroupMember.id.asc())
        .all()
    )
    accesses = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.group_id == group_id)
        .order_by(ApprenantGroupAccess.created_at.asc(), ApprenantGroupAccess.id.asc())
        .all()
    )
    sessions = (
        db.query(GroupSession)
        .filter(GroupSession.group_id == group_id)
        .order_by(GroupSession.scheduled_at.asc(), GroupSession.id.asc())
        .all()
    )
    serialized_sessions = [_serialize_session(session, db) for session in sessions]

    existing_titles_dates = {
        (s.title, str(s.scheduled_at)[:10]) for s in sessions
    }
    planning_sessions = (
        db.query(PlanningSession)
        .join(PlanningSessionGroup, PlanningSessionGroup.session_id == PlanningSession.id)
        .filter(PlanningSessionGroup.group_id == group_id)
        .order_by(PlanningSession.date.asc(), PlanningSession.id.asc())
        .all()
    )
    for ps in planning_sessions:
        key = (ps.title, str(ps.date))
        if key in existing_titles_dates:
            continue
        sched_str = f"{ps.date}T{ps.start_time or '00:00'}:00" if ps.date else None
        serialized_sessions.append({
            "id": f"planning-{ps.id}",
            "groupId": str(group_id),
            "accessId": None,
            "targetRef": ps.module_target_ref,
            "targetKind": None,
            "targetLabel": ps.module_label,
            "title": ps.title,
            "scheduledAt": sched_str,
            "durationMinutes": ps.duration_minutes or 0,
            "status": ps.status or "planned",
            "notes": None,
            "attendanceSummary": {"present": 0, "absent": 0, "excused": 0, "pending": 0, "total": 0},
            "attendance": [],
            "source": "planning",
        })

    serialized_sessions.sort(key=lambda s: s.get("scheduledAt") or "")

    return {
        "group": serialize_group_summary(group, db),
        "members": [_serialize_member(member, db) for member in members],
        "accesses": [_serialize_access(access, db) for access in accesses],
        "sessions": serialized_sessions,
    }


def create_group(db: Session, body) -> dict:
    if body.format == "reconversion" and not (body.reconversionTopicSlug or body.reconversionPackId):
        raise HTTPException(status_code=400, detail="Choisissez un parcours ou un pack reconversion.")
    ponctuelle_module_refs = _unique_preserved([str(item) for item in getattr(body, "ponctuelleModuleRefs", []) or []])
    if body.format == "ponctuelle" and not (body.ponctuelleFormationSlug or ponctuelle_module_refs):
        raise HTTPException(status_code=400, detail="Choisissez une ou plusieurs formations/modules ponctuels.")
    pack_id: int | None = None
    topic_slug = body.reconversionTopicSlug
    ponctuelle_slugs: list[str] = []
    if body.reconversionPackId:
        pack = _pack_by_id(db, body.reconversionPackId)
        pack_id = int(pack.id)
        topic = db.query(ReconversionTopic).filter(ReconversionTopic.id == pack.topic_id).first()
        topic_slug = topic.slug if topic else topic_slug
    if topic_slug:
        _topic_by_slug(db, topic_slug)
    if body.ponctuelleFormationSlug:
        ponctuelle_slugs.append(_ponctuelle_by_slug(db, body.ponctuelleFormationSlug).slug)
    for target_ref in ponctuelle_module_refs:
        row = _ponctuelle_module_by_target_ref(db, target_ref)
        if not row:
            raise HTTPException(status_code=400, detail="Module ponctuel introuvable.")
        form = db.query(PonctuelleFormation).filter(PonctuelleFormation.id == int(row.formation_id)).first()
        if form:
            ponctuelle_slugs.append(form.slug)
    ponctuelle_slugs = _unique_preserved(ponctuelle_slugs)
    row = ApprenantGroup(
        name=body.name.strip(),
        description=_opt_text(body.description),
        format=body.format,
        reconversion_topic_slug=topic_slug,
        reconversion_pack_id=pack_id,
        ponctuelle_formation_slug=ponctuelle_slugs[0] if len(ponctuelle_slugs) == 1 else None,
        ponctuelle_formation_slugs=ponctuelle_slugs or None,
        start_date=body.startDate,
        end_date=body.endDate,
        status=body.status,
    )
    db.add(row)
    db.flush()
    if body.format == "ponctuelle" and ponctuelle_module_refs:
        for target_ref in ponctuelle_module_refs:
            db.add(
                ApprenantGroupAccess(
                    group_id=int(row.id),
                    access_kind="ponctuelle_module",
                    target_ref=target_ref,
                    label=resolve_access_label(db, "ponctuelle_module", target_ref),
                )
            )
        db.flush()
        _refresh_group_ponctuelle_scope_from_accesses(db, row)
    else:
        sync_default_group_access(db, row)
    db.commit()
    db.refresh(row)
    return serialize_group_summary(row, db)


def patch_group(db: Session, group_id: int, body) -> dict:
    row = get_group(db, group_id)
    ponctuelle_module_refs = (
        _unique_preserved([str(item) for item in body.ponctuelleModuleRefs or []])
        if body.ponctuelleModuleRefs is not None
        else None
    )
    if body.name is not None:
        row.name = body.name.strip()
    if body.description is not None:
        row.description = _opt_text(body.description)
    if body.status is not None:
        row.status = body.status
    if body.startDate is not None:
        row.start_date = body.startDate
    if body.endDate is not None:
        row.end_date = body.endDate
    if body.reconversionPackId is not None:
        if body.reconversionPackId.strip():
            pack = _pack_by_id(db, body.reconversionPackId)
            row.reconversion_pack_id = int(pack.id)
            topic = db.query(ReconversionTopic).filter(ReconversionTopic.id == pack.topic_id).first()
            row.reconversion_topic_slug = topic.slug if topic else row.reconversion_topic_slug
        else:
            row.reconversion_pack_id = None
    if body.reconversionTopicSlug is not None:
        if body.reconversionTopicSlug.strip():
            topic = _topic_by_slug(db, body.reconversionTopicSlug.strip())
            row.reconversion_topic_slug = topic.slug
        else:
            row.reconversion_topic_slug = None
    if body.ponctuelleFormationSlug is not None:
        if body.ponctuelleFormationSlug.strip():
            form = _ponctuelle_by_slug(db, body.ponctuelleFormationSlug.strip())
            row.ponctuelle_formation_slug = form.slug
            row.ponctuelle_formation_slugs = [form.slug]
        else:
            row.ponctuelle_formation_slug = None
            row.ponctuelle_formation_slugs = None
    if ponctuelle_module_refs is not None:
        formation_slugs: list[str] = []
        for target_ref in ponctuelle_module_refs:
            module_row = _ponctuelle_module_by_target_ref(db, target_ref)
            if not module_row:
                raise HTTPException(status_code=400, detail="Module ponctuel introuvable.")
            form = db.query(PonctuelleFormation).filter(PonctuelleFormation.id == int(module_row.formation_id)).first()
            if form:
                formation_slugs.append(form.slug)
        row.ponctuelle_formation_slugs = _unique_preserved(formation_slugs) or None
        row.ponctuelle_formation_slug = formation_slugs[0] if len(_unique_preserved(formation_slugs)) == 1 else None
        (
            db.query(ApprenantGroupAccess)
            .filter(
                ApprenantGroupAccess.group_id == int(row.id),
                ApprenantGroupAccess.access_kind.in_(["ponctuelle_formation", "ponctuelle_module"]),
            )
            .delete(synchronize_session=False)
        )
        for target_ref in ponctuelle_module_refs:
            db.add(
                ApprenantGroupAccess(
                    group_id=int(row.id),
                    access_kind="ponctuelle_module",
                    target_ref=target_ref,
                    label=resolve_access_label(db, "ponctuelle_module", target_ref),
                )
            )
        db.flush()
    elif row.format == "ponctuelle" and body.ponctuelleFormationSlug is not None:
        sync_default_group_access(db, row)
    elif row.format == "reconversion":
        sync_default_group_access(db, row)
    _refresh_group_ponctuelle_scope_from_accesses(db, row)
    db.commit()
    db.refresh(row)
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == int(row.id))
        .all()
    )
    for member in members:
        ensure_member_progress_rows(db, member)
    db.commit()
    return serialize_group_summary(row, db)


def delete_group(db: Session, group_id: int) -> None:
    row = get_group(db, group_id)
    db.delete(row)
    db.commit()


def link_pending_members_for_user(db: Session, user: User) -> int:
    email = normalize_email(user.email)
    rows = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.email_normalized == email)
        .all()
    )
    updated = 0
    for row in rows:
        changed = False
        if row.user_id != user.id:
            row.user_id = user.id
            changed = True
        if row.status in ("pending", "linked"):
            row.status = "active"
            changed = True
        if row.linked_at is None:
            row.linked_at = datetime.now(timezone.utc)
            changed = True
        if changed:
            updated += 1
            ensure_member_progress_rows(db, row)
    if updated:
        db.commit()
    return updated


def create_member(db: Session, group_id: int, body) -> dict:
    get_group(db, group_id)
    email = normalize_email(str(body.email))
    exists = (
        db.query(ApprenantGroupMember)
        .filter(
            ApprenantGroupMember.group_id == group_id,
            ApprenantGroupMember.email_normalized == email,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Cet email existe déjà dans le groupe.")
    user = db.query(User).filter(User.email == email).first()
    row = ApprenantGroupMember(
        group_id=group_id,
        user_id=user.id if user else None,
        email=email,
        email_normalized=email,
        first_name=_opt_text(body.firstName),
        last_name=_opt_text(body.lastName),
        status="active" if user else "pending",
        linked_at=datetime.now(timezone.utc) if user else None,
    )
    db.add(row)
    db.flush()
    sessions = db.query(GroupSession).filter(GroupSession.group_id == group_id).all()
    for session in sessions:
        db.add(
            SessionAttendance(
                session_id=int(session.id),
                member_id=int(row.id),
                status="pending",
            )
        )
    ensure_member_progress_rows(db, row)
    db.commit()
    db.refresh(row)
    return _serialize_member(row, db)


def patch_member(db: Session, member_id: int, body) -> dict:
    row = get_member(db, member_id)
    if body.firstName is not None:
        row.first_name = _opt_text(body.firstName)
    if body.lastName is not None:
        row.last_name = _opt_text(body.lastName)
    if body.status is not None:
        row.status = body.status
    if body.pointsTotal is not None:
        row.points_total = body.pointsTotal
    db.commit()
    db.refresh(row)
    return _serialize_member(row, db)


def delete_member(db: Session, member_id: int) -> None:
    row = get_member(db, member_id)
    db.delete(row)
    db.commit()


def create_access(db: Session, group_id: int, body) -> dict:
    group = get_group(db, group_id)
    label = resolve_access_label(db, body.accessKind, body.targetRef)
    exists = (
        db.query(ApprenantGroupAccess)
        .filter(
            ApprenantGroupAccess.group_id == group_id,
            ApprenantGroupAccess.access_kind == body.accessKind,
            ApprenantGroupAccess.target_ref == body.targetRef,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Cet accès existe déjà.")
    row = ApprenantGroupAccess(
        group_id=group_id,
        access_kind=body.accessKind,
        target_ref=body.targetRef,
        label=label,
    )
    db.add(row)
    db.flush()
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == group_id)
        .all()
    )
    for member in members:
        ensure_member_progress_rows(db, member)
    if group.format == "ponctuelle":
        _refresh_group_ponctuelle_scope_from_accesses(db, group)
    db.commit()
    db.refresh(row)
    return _serialize_access(row, db)


def delete_access(db: Session, group_id: int, access_id: int) -> None:
    group = get_group(db, group_id)
    row = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.id == access_id, ApprenantGroupAccess.group_id == group_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Accès introuvable.")
    target_refs = [item["targetRef"] for item in expand_access_targets(db, row.access_kind, row.target_ref)] or [row.target_ref]
    db.delete(row)
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == group_id)
        .all()
    )
    for member in members:
        (
            db.query(LearnerProgress)
            .filter(
                LearnerProgress.member_id == int(member.id),
                LearnerProgress.target_ref.in_(target_refs),
            )
            .delete(synchronize_session=False)
        )
        _recompute_member_progress(db, member)
    if group.format == "ponctuelle":
        _refresh_group_ponctuelle_scope_from_accesses(db, group)
    db.commit()


def create_session(db: Session, group_id: int, body) -> dict:
    group = get_group(db, group_id)
    access_id: int | None = None
    target_kind = _opt_text(body.targetKind)
    target_ref = _opt_text(body.targetRef)
    target_label = _target_label_for_session(db, target_ref, body.targetLabel)
    if body.accessId:
        access_id = _parse_int_id(body.accessId, "accessId")
        access = (
            db.query(ApprenantGroupAccess)
            .filter(ApprenantGroupAccess.id == access_id, ApprenantGroupAccess.group_id == group_id)
            .first()
        )
        if not access:
            raise HTTPException(status_code=400, detail="Accès de séance introuvable pour ce groupe.")
        if target_ref is None:
            target_ref = access.target_ref
            target_kind = access.access_kind
            target_label = access.label
    row = GroupSession(
        group_id=group_id,
        access_id=access_id,
        target_ref=target_ref,
        target_kind=target_kind,
        target_label=target_label,
        title=body.title.strip(),
        scheduled_at=body.scheduledAt,
        duration_minutes=body.durationMinutes,
        status=body.status,
        notes=_opt_text(body.notes),
    )
    db.add(row)
    db.flush()
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == group_id)
        .all()
    )
    member_ids: list[int] = []
    for member in members:
        member_ids.append(int(member.id))
        db.add(
            SessionAttendance(
                session_id=int(row.id),
                member_id=int(member.id),
                status="pending",
            )
        )
    unlock_ref = (target_ref or "").strip()
    if not unlock_ref and access_id:
        access = db.query(ApprenantGroupAccess).filter(ApprenantGroupAccess.id == access_id).first()
        if access and access.access_kind in ("ponctuelle_module", "reconversion_module"):
            unlock_ref = access.target_ref
    if not unlock_ref:
        unlock_ref = _parse_session_module_ref(group.description) or ""
    if unlock_ref:
        _unlock_module_for_group_members(db, group_id, unlock_ref, member_ids)
    for member in members:
        _recompute_member_progress(db, member)

    _mirror_to_planning_session(db, row, group_id)

    db.commit()
    db.refresh(row)

    if row.planning_session_id:
        try:
            from app.domains.learner.session_notifications import dispatch_planning_session_notifications

            dispatch_planning_session_notifications(db, int(row.planning_session_id))
        except Exception:
            import logging

            logging.getLogger(__name__).exception(
                "Notifications CSF non envoyées pour séance groupe %s", row.id
            )

    return _serialize_session(row, db)


def patch_session(db: Session, session_id: int, body) -> dict:
    session = db.query(GroupSession).filter(GroupSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable.")
    if body.title is not None:
        session.title = body.title.strip()
    if body.accessId is not None:
        if str(body.accessId).strip():
            access_id = _parse_int_id(body.accessId, "accessId")
            access = (
                db.query(ApprenantGroupAccess)
                .filter(ApprenantGroupAccess.id == access_id, ApprenantGroupAccess.group_id == int(session.group_id))
                .first()
            )
            if not access:
                raise HTTPException(status_code=400, detail="Accès de séance introuvable pour ce groupe.")
            session.access_id = int(access.id)
            if body.targetRef is None:
                session.target_ref = access.target_ref
                session.target_kind = access.access_kind
                session.target_label = access.label
        else:
            session.access_id = None
    if body.targetRef is not None:
        session.target_ref = _opt_text(body.targetRef)
        session.target_label = _target_label_for_session(db, session.target_ref, body.targetLabel)
    if body.targetKind is not None:
        session.target_kind = _opt_text(body.targetKind)
    if body.targetLabel is not None and body.targetRef is None:
        session.target_label = _opt_text(body.targetLabel)
    if body.scheduledAt is not None:
        session.scheduled_at = body.scheduledAt
    if body.durationMinutes is not None:
        session.duration_minutes = body.durationMinutes
    if body.status is not None:
        session.status = body.status
    if body.notes is not None:
        session.notes = _opt_text(body.notes)
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == int(session.group_id))
        .all()
    )
    for member in members:
        _recompute_member_progress(db, member)
    db.commit()
    db.refresh(session)
    return _serialize_session(session, db)


def delete_session(db: Session, session_id: int) -> None:
    session = db.query(GroupSession).filter(GroupSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable.")
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == int(session.group_id))
        .all()
    )
    db.delete(session)
    for member in members:
        _recompute_member_progress(db, member)
    db.commit()


def patch_session_attendance(db: Session, session_id: int, body) -> dict:
    session = db.query(GroupSession).filter(GroupSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable.")
    has_present = False
    for item in body.items:
        member_id = int(item.memberId)
        row = (
            db.query(SessionAttendance)
            .filter(
                SessionAttendance.session_id == session_id,
                SessionAttendance.member_id == member_id,
            )
            .first()
        )
        if not row:
            row = SessionAttendance(session_id=session_id, member_id=member_id)
            db.add(row)
        row.status = item.status
        row.note = _opt_text(item.note)
        if item.status == "present":
            has_present = True
    if has_present and session.status == "planned":
        session.status = "completed"

    _sync_group_to_planning(db, session, body.items)

    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == int(session.group_id))
        .all()
    )
    for member in members:
        _recompute_member_progress(db, member)
    db.commit()
    db.refresh(session)
    return _serialize_session(session, db)


def _sync_group_to_planning(
    db: Session, group_session: GroupSession, items: list
) -> None:
    """Mirror SessionAttendance changes into PlanningAttendance."""
    planning_id = group_session.planning_session_id
    if not planning_id:
        return

    now = datetime.now(timezone.utc)
    for item in items:
        member_id = int(item.memberId)
        is_present = item.status == "present"
        pa = (
            db.query(PlanningAttendance)
            .filter(
                PlanningAttendance.session_id == planning_id,
                PlanningAttendance.member_id == member_id,
            )
            .first()
        )
        if pa:
            pa.present = is_present
            pa.marked_at = now
        else:
            db.add(PlanningAttendance(
                session_id=planning_id,
                member_id=member_id,
                present=is_present,
                marked_at=now,
            ))

    ps = db.query(PlanningSession).get(planning_id)
    if ps and ps.status == "planned" and any(i.status == "present" for i in items):
        ps.status = "completed"


def patch_member_progress(db: Session, member_id: int, body) -> list[dict]:
    member = get_member(db, member_id)
    out: list[dict] = []
    for item in body.items:
        row = (
            db.query(LearnerProgress)
            .filter(
                LearnerProgress.member_id == member_id,
                LearnerProgress.target_ref == item.targetRef,
            )
            .first()
        )
        if not row:
            row = LearnerProgress(
                member_id=member_id,
                access_kind=item.accessKind,
                target_ref=item.targetRef,
                title=item.title,
            )
            db.add(row)
        if item.currentFlag:
            (
                db.query(LearnerProgress)
                .filter(
                    LearnerProgress.member_id == member_id,
                    LearnerProgress.target_ref != item.targetRef,
                )
                .update({"current_flag": False}, synchronize_session=False)
            )
        row.access_kind = item.accessKind
        row.title = item.title
        row.progress_percent = item.progressPercent
        row.status = item.status
        row.score_percent = item.scorePercent
        row.current_flag = item.currentFlag
        row.locked = item.locked
        row.opened_by_admin = item.openedByAdmin
        row.completed_by_admin = item.completedByAdmin
        row.progress_mode = item.progressMode
        row.minutes_completed = item.minutesCompleted
        row.minutes_total = item.minutesTotal
        row.note = _opt_text(item.note)
    _recompute_member_progress(db, member)
    db.commit()
    rows = _member_progress_rows(db, int(member.id))
    out.extend(_serialize_progress(row) for row in rows)
    return out


def patch_member_certifications(db: Session, member_id: int, body) -> list[dict]:
    get_member(db, member_id)
    seen_ids: list[int] = []
    for item in body.items:
        row: LearnerCertificationResult | None = None
        if item.id:
            cert_id = _parse_int_id(item.id, "id")
            row = (
                db.query(LearnerCertificationResult)
                .filter(
                    LearnerCertificationResult.id == cert_id,
                    LearnerCertificationResult.member_id == member_id,
                )
                .first()
            )
        if not row:
            row = LearnerCertificationResult(member_id=member_id)
            db.add(row)
            db.flush()
        row.title = item.title.strip()
        row.scope_ref = _opt_text(item.scopeRef)
        row.score_percent = item.scorePercent
        row.status = item.status
        row.issuer = _opt_text(item.issuer)
        row.awarded_at = item.awardedAt
        seen_ids.append(int(row.id))
    db.commit()
    rows = (
        db.query(LearnerCertificationResult)
        .filter(LearnerCertificationResult.member_id == member_id)
        .order_by(LearnerCertificationResult.awarded_at.desc(), LearnerCertificationResult.id.desc())
        .all()
    )
    return [_serialize_certification(row) for row in rows]


def create_member_note(db: Session, member_id: int, body, author: User) -> dict:
    get_member(db, member_id)
    row = ApprenantMemberNote(
        member_id=member_id,
        author_user_id=author.id,
        author_name=(author.name or author.email),
        note_type=body.noteType,
        content=body.content.strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_note(row)


def get_member_profile(db: Session, member_id: int) -> dict:
    member = get_member(db, member_id)
    group = get_group(db, int(member.group_id))
    accesses = (
        db.query(ApprenantGroupAccess)
        .filter(ApprenantGroupAccess.group_id == int(group.id))
        .order_by(ApprenantGroupAccess.id.asc())
        .all()
    )
    progresses = _member_progress_rows(db, int(member.id))
    certs = (
        db.query(LearnerCertificationResult)
        .filter(LearnerCertificationResult.member_id == int(member.id))
        .order_by(LearnerCertificationResult.awarded_at.desc(), LearnerCertificationResult.id.desc())
        .all()
    )
    notes = (
        db.query(ApprenantMemberNote)
        .filter(ApprenantMemberNote.member_id == int(member.id))
        .order_by(ApprenantMemberNote.created_at.desc(), ApprenantMemberNote.id.desc())
        .all()
    )
    session_rows = (
        db.query(GroupSession, SessionAttendance)
        .join(SessionAttendance, SessionAttendance.session_id == GroupSession.id)
        .filter(
            GroupSession.group_id == int(group.id),
            SessionAttendance.member_id == int(member.id),
        )
        .order_by(GroupSession.scheduled_at.desc(), GroupSession.id.desc())
        .all()
    )
    user = db.query(User).filter(User.id == member.user_id).first() if member.user_id else None
    return {
        "member": _serialize_member(member, db),
        "group": serialize_group_summary(group, db),
        "accesses": [_serialize_access(access, db) for access in accesses],
        "progress": [_serialize_progress(row) for row in progresses],
        "certifications": [_serialize_certification(row) for row in certs],
        "notes": [_serialize_note(row) for row in notes],
        "history": _history_for_member(session_rows, progresses, certs, notes),
        "learnerCv": getattr(user, "learner_cv", None),
    }


def get_member_attendance_history(db: Session, member_id: int) -> dict:
    member = get_member(db, member_id)
    rows = (
        db.query(GroupSession, SessionAttendance)
        .outerjoin(
            SessionAttendance,
            and_(
                SessionAttendance.session_id == GroupSession.id,
                SessionAttendance.member_id == member_id,
            ),
        )
        .filter(GroupSession.group_id == int(member.group_id))
        .order_by(GroupSession.scheduled_at.desc())
        .all()
    )
    items: list[dict] = []
    for session, attendance in rows:
        items.append(
            {
                "sessionId": str(session.id),
                "sessionTitle": session.title,
                "scheduledAt": session.scheduled_at,
                "targetLabel": session.target_label,
                "status": attendance.status if attendance else "pending",
            }
        )
    non_pending = [i for i in items if i["status"] != "pending"]
    rate = 0
    if non_pending:
        present_n = sum(1 for i in non_pending if i["status"] in ("present", "excused"))
        rate = int(round(present_n / len(non_pending) * 100))
    return {"items": items, "attendanceRate": rate}


def learner_members_for_user(db: Session, user: User) -> list[ApprenantGroupMember]:
    return (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.user_id == user.id)
        # Important: prioriser les groupes les plus récents (session-module)
        # pour éviter qu'un ancien groupe "inscription" verrouillé masque
        # l'accès déjà ouvert sur le même pack/module.
        .order_by(ApprenantGroupMember.created_at.desc(), ApprenantGroupMember.id.desc())
        .all()
    )


def learner_course_payloads(db: Session, user: User) -> list[dict]:
    refresh_learner_progress_for_user(db, user)
    payloads: list[dict] = []
    seen_course_keys: set[str] = set()
    members = learner_members_for_user(db, user)
    member_groups: list[tuple[ApprenantGroupMember, ApprenantGroup]] = []
    progress_by_member: dict[int, dict[str, LearnerProgress]] = {}
    certs_by_member: dict[int, list[LearnerCertificationResult]] = defaultdict(list)
    for member in members:
        group = get_group(db, int(member.group_id))
        member_groups.append((member, group))
        progress_by_member[int(member.id)] = {
            row.target_ref: row for row in _member_progress_rows(db, int(member.id))
        }
        certs_by_member[int(member.id)] = (
            db.query(LearnerCertificationResult)
            .filter(LearnerCertificationResult.member_id == int(member.id))
            .all()
        )
    # Priorise les groupes session (non-catalogue) avant les groupes d'inscription.
    member_groups.sort(
        key=lambda mg: (
            1 if _is_catalog_enrollment_group(mg[1]) else 0,
            -(mg[0].created_at.timestamp() if mg[0].created_at else 0),
        )
    )
    for member, group in member_groups:
        accesses = (
            db.query(ApprenantGroupAccess)
            .filter(ApprenantGroupAccess.group_id == int(group.id))
            .order_by(ApprenantGroupAccess.id.asc())
            .all()
        )
        presence_hours = _presence_hours_for_group_member(db, int(member.id), int(group.id))
        present_hours = int(presence_hours["presentHours"])
        absent_hours = int(presence_hours["absentHours"])
        attendance_rate = int(presence_hours["attendancePercent"])
        progress_lookup = progress_by_member[int(member.id)]
        group_scope = _resolve_group_scope(group, db)
        if group.format == "ponctuelle":
            module_map: dict[str, dict] = {}
            for access in accesses:
                targets = expand_access_targets(db, access.access_kind, access.target_ref)
                if not targets and access.access_kind == "ponctuelle_module":
                    targets = [
                        {
                            "targetRef": access.target_ref,
                            "accessKind": "ponctuelle_module",
                            "title": access.label,
                            "imageUrl": "/images/iot.png",
                        }
                    ]
                for target in targets:
                    module_map[target["targetRef"]] = target
            modules = list(module_map.values())
            if not modules:
                continue
            module_cards = []
            module_refs = [module["targetRef"] for module in modules]
            progress_values: list[int] = []
            total_minutes = 0
            completed_minutes = 0
            current_title: str | None = None
            for idx, module in enumerate(modules):
                row = progress_lookup.get(module["targetRef"])
                progress_percent = int(row.progress_percent or 0) if row else 0
                progress_values.append(progress_percent)
                total_minutes += int((row.minutes_total if row and row.minutes_total is not None else _module_duration_minutes(db, module["targetRef"])) or 0)
                completed_minutes += int(row.minutes_completed or 0) if row else 0
                if current_title is None and ((row and row.current_flag) or progress_percent < 100 or idx == 0):
                    current_title = module["title"]
                locked = bool(row.locked) if row else True
                if row and row.opened_by_admin:
                    locked = False
                module_cards.append(
                    {
                        "id": module["targetRef"],
                        "title": module["title"],
                        "statusLabel": (
                            "Verrouillé"
                            if locked
                            else (
                                "Terminé 100%"
                                if progress_percent >= 100
                                else ("En cours" if progress_percent > 0 else "À faire")
                            )
                        ),
                        "variant": "completed" if progress_percent >= 100 else "in_progress",
                        "progress": None if progress_percent >= 100 else progress_percent,
                        "imageSrc": module.get("imageUrl") or "/images/iot.png",
                        "locked": locked,
                    }
                )
            progress_percent = (
                min(100, int(round((completed_minutes / total_minutes) * 100)))
                if total_minutes > 0
                else (int(round(sum(progress_values) / len(progress_values))) if progress_values else 0)
            )
            cert_rows = [
                row
                for row in certs_by_member[int(member.id)]
                if not row.scope_ref or row.scope_ref in module_refs
            ]
            course_key = f"ponctuelle:{'|'.join(sorted(module_refs))}"
            if course_key in seen_course_keys:
                continue
            seen_course_keys.add(course_key)
            payloads.append(
                {
                    "memberId": str(member.id),
                    "groupId": str(group.id),
                    "accessId": f"group-{group.id}",
                    "groupLabel": group.name,
                    "title": group_scope["formationLabel"],
                    "subtitle": f"{len(modules)} modules suivis · module actuel : {current_title}",
                    "badges": [
                        {"label": "Formation ponctuelle", "variant": "success"},
                        {"label": f"Présence {attendance_rate}%", "variant": "success"},
                        {"label": "En cours" if progress_percent < 100 else "Terminé", "variant": "warning" if progress_percent < 100 else "success"},
                    ],
                    "stats": [
                        {"label": "Présences", "value": f"{present_hours} h"},
                        {"label": "Absences", "value": f"{absent_hours} h"},
                        {"label": "Séances passées", "value": f"{int(round(completed_minutes / 60))} h / {int(round(total_minutes / 60))} h"},
                    ],
                    "progressPercent": progress_percent,
                    # Afficher aussi le module unique (ponctuelle mono-module)
                    # pour permettre le clic + tag verrouillé/déverrouillé.
                    "modules": module_cards,
                    "rawModules": modules,
                    "attendanceRate": attendance_rate,
                    "presentHours": present_hours,
                    "absentHours": absent_hours,
                    "certifications": [_serialize_certification(row) for row in cert_rows],
                    "minutesCompleted": completed_minutes,
                    "minutesTotal": total_minutes,
                }
            )
            continue
        for access in accesses:
            modules = expand_access_targets(db, access.access_kind, access.target_ref)
            module_cards = []
            progress_values: list[int] = []
            current_title: str | None = None
            total_minutes = 0
            completed_minutes = 0
            for idx, module in enumerate(modules):
                row = progress_lookup.get(module["targetRef"])
                progress_percent = int(row.progress_percent or 0) if row else 0
                progress_values.append(progress_percent)
                total_minutes += int((row.minutes_total if row and row.minutes_total is not None else _module_duration_minutes(db, module["targetRef"])) or 0)
                completed_minutes += int(row.minutes_completed or 0) if row else 0
                if current_title is None and ((row and row.current_flag) or progress_percent < 100 or idx == 0):
                    current_title = module["title"]
                locked = bool(row.locked) if row else False
                module_cards.append(
                    {
                        "id": module["targetRef"],
                        "title": module["title"],
                        "statusLabel": (
                            "Verrouillé"
                            if locked
                            else ("Terminé 100%" if progress_percent >= 100 else ("En cours" if progress_percent > 0 else "À faire"))
                        ),
                        "variant": "completed" if progress_percent >= 100 else "in_progress",
                        "progress": None if progress_percent >= 100 else progress_percent,
                        "imageSrc": module.get("imageUrl") or "/images/iot.png",
                        "locked": locked,
                    }
                )
            completed_modules = sum(1 for v in progress_values if v >= 100)
            progress_percent = int(round((completed_modules / len(progress_values)) * 100)) if progress_values else 0
            cert_rows = [
                row
                for row in certs_by_member[int(member.id)]
                if not row.scope_ref or row.scope_ref == access.target_ref or row.scope_ref in [m["targetRef"] for m in modules]
            ]
            status_label = "Terminé" if progress_percent >= 100 else "En cours"
            subtitle = (
                f"{len(modules)} modules suivis · module actuel : {current_title}"
                if modules
                else access.label
            )
            course_key = f"{access.access_kind}:{access.target_ref}"
            if course_key in seen_course_keys:
                continue
            seen_course_keys.add(course_key)
            payloads.append(
                {
                    "memberId": str(member.id),
                    "groupId": str(group.id),
                    "accessId": str(access.id),
                    "groupLabel": group.name,
                    "title": access.label,
                    "subtitle": subtitle,
                    "badges": [
                        {
                            "label": "Reconversion métier" if access.access_kind.startswith("reconversion") else "Formation ponctuelle",
                            "variant": "neutral" if access.access_kind.startswith("reconversion") else "success",
                        },
                        {"label": f"Présence {attendance_rate}%", "variant": "success"},
                        {"label": status_label, "variant": "warning" if progress_percent < 100 else "success"},
                    ],
                    "stats": [
                        {"label": "Présences", "value": f"{present_hours} h"},
                        {"label": "Absences", "value": f"{absent_hours} h"},
                        {"label": "Avancement global", "value": f"{completed_modules} / {len(modules)} module{'s' if len(modules) > 1 else ''} terminé{'s' if completed_modules > 1 else ''}"},
                    ],
                    "progressPercent": progress_percent,
                    "modules": module_cards,
                    "rawModules": modules,
                    "attendanceRate": attendance_rate,
                    "presentHours": present_hours,
                    "absentHours": absent_hours,
                    "certifications": [_serialize_certification(row) for row in cert_rows],
                    "minutesCompleted": completed_minutes,
                    "minutesTotal": total_minutes,
                }
            )
    return payloads


def learner_dashboard_data(db: Session, user: User) -> dict:
    courses = learner_course_payloads(db, user)
    certifications: list[LearnerCertificationResult] = []
    members = learner_members_for_user(db, user)
    member_ids = [int(m.id) for m in members]
    for member in members:
        certifications.extend(
            db.query(LearnerCertificationResult)
            .filter(LearnerCertificationResult.member_id == int(member.id))
            .all()
        )
    existing_scope_refs = {row.scope_ref for row in certifications if row.scope_ref}
    pending_docs: list[ValidationDocument] = []
    if member_ids:
        pending_docs = (
            db.query(ValidationDocument)
            .filter(
                ValidationDocument.member_id.in_(member_ids),
                ValidationDocument.status == "pending_admin",
            )
            .order_by(ValidationDocument.submitted_at.desc())
            .all()
        )
    pending_docs = [doc for doc in pending_docs if doc.scope_ref not in existing_scope_refs]
    pending_validation_count = len(pending_docs)
    passed = [row for row in certifications if row.status == "passed"]
    failed = [row for row in certifications if row.status == "failed"]
    upcoming_sessions = (
        db.query(GroupSession, ApprenantGroupMember, SessionAttendance)
        .join(SessionAttendance, SessionAttendance.session_id == GroupSession.id)
        .join(ApprenantGroupMember, ApprenantGroupMember.id == SessionAttendance.member_id)
        .filter(
            ApprenantGroupMember.user_id == user.id,
            GroupSession.scheduled_at >= datetime.now(timezone.utc),
        )
        .order_by(GroupSession.scheduled_at.asc(), GroupSession.id.asc())
        .limit(8)
        .all()
    )
    notifications = []
    calendar_events = []
    for session, member, attendance in upcoming_sessions:
        scheduled = session.scheduled_at
        notifications.append(
            {
                "id": f"session-{session.id}",
                "icon": "calendar",
                "title": session.title,
                "description": (
                    f"Séance planifiée pour le groupe {get_group(db, int(member.group_id)).name}"
                    + (f" • {session.target_label}" if session.target_label else "")
                ),
                "time": scheduled.strftime("%d/%m/%Y %H:%M"),
            }
        )
        calendar_events.append(
            {
                "id": f"evt-{session.id}",
                "day": scheduled.day,
                "month": scheduled.strftime("%b").upper(),
                "title": session.title,
                "time": scheduled.strftime("%H:%M"),
                "description": (
                    get_group(db, int(member.group_id)).name
                    + (f" • {session.target_label}" if session.target_label else "")
                ),
            }
        )
    attendance_presence = _user_attendance_presence(db, user)
    points_total = sum(int(member.points_total or 0) for member in members)
    completed_courses = sum(1 for course in courses if int(course["progressPercent"]) >= 100)
    obtained = len(passed)
    total = len(certifications) + pending_validation_count
    success_pct = int(round((obtained / total) * 100)) if total else 0
    fail_pct = int(round((len(failed) / total) * 100)) if total else 0
    active_formations = [
        {
            "id": f"{course['groupId']}:{course['accessId']}",
            "title": course["title"],
            "badges": [
                {
                    "label": course["badges"][0]["label"],
                    "className": (
                        "bg-[#0D3570]/12 text-[#0B264F] ring-1 ring-[#0D3570]/20"
                        if course["badges"][0]["variant"] == "neutral"
                        else "bg-[#0A566E]/14 text-[#053d54] ring-1 ring-[#0A566E]/35"
                    ),
                },
                {
                    "label": f"{course['progressPercent']}% de progression",
                    "className": (
                        "bg-[#5ab396]/30 text-[#053d54] ring-1 ring-[#5ab396]/40"
                        if course["progressPercent"] >= 50
                        else "bg-[#1F6CA3]/15 text-[#0D3570] ring-1 ring-[#1F6CA3]/25"
                    ),
                },
            ],
            "progressLabel": "Progression globale",
            "progress": course["progressPercent"],
        }
        for course in courses[:4]
    ]
    return {
        "greetingName": (user.first_name or user.name or user.email.split("@")[0]),
        "formationsCard": {
            "count": len(courses),
            "completed": completed_courses,
            "moduleBars": _learner_module_progress_bars(db, user),
        },
        "certificationsCard": {
            "obtained": obtained,
            "total": total,
            "percentage": success_pct,
            "failPercentage": fail_pct,
        },
        "activeFormations": active_formations,
        "notifications": notifications[:3],
        "profileCard": {
            "name": user.name or user.email,
            "email": user.email,
            "points": points_total,
            "attendance": attendance_presence["attendancePercent"],
            "attendanceSummary": attendance_presence,
        },
        "calendarEvents": calendar_events[:3],
    }


def learner_certifications_data(db: Session, user: User) -> dict:
    members = learner_members_for_user(db, user)
    member_ids = [int(m.id) for m in members]

    certs: list[LearnerCertificationResult] = []
    for member in members:
        certs.extend(
            db.query(LearnerCertificationResult)
            .filter(LearnerCertificationResult.member_id == int(member.id))
            .order_by(LearnerCertificationResult.awarded_at.desc(), LearnerCertificationResult.id.desc())
            .all()
        )

    ready = [row for row in certs if row.status == "passed"]
    pending_cert = [row for row in certs if row.status == "pending"]
    failed = [row for row in certs if row.status == "failed"]

    existing_scope_refs = {row.scope_ref for row in certs if row.scope_ref}

    pending_docs: list[ValidationDocument] = []
    if member_ids:
        pending_docs = (
            db.query(ValidationDocument)
            .filter(
                ValidationDocument.member_id.in_(member_ids),
                ValidationDocument.status == "pending_admin",
            )
            .order_by(ValidationDocument.submitted_at.desc())
            .all()
        )
    pending_docs = [
        doc for doc in pending_docs
        if doc.scope_ref not in existing_scope_refs
    ]

    pending_validation_count = len(pending_docs)

    summary = {
        "readyToPrint": len(ready),
        "unlocked": len([row for row in certs if row.status in ("passed", "available", "unlocked")]),
        "successRate": int(round((len(ready) / len(certs)) * 100)) if certs else 0,
        "blocked": len(failed),
        "pendingValidation": pending_validation_count,
    }

    pending_rows_from_docs = [
        {
            "id": f"doc-{doc.id}",
            "certification": doc.scope_label,
            "type": "Certification liée à une formation",
            "date": (
                (doc.submitted_at or doc.created_at).strftime("%d/%m/%Y")
                if (doc.submitted_at or doc.created_at)
                else "—"
            ),
            "score": f"{doc.test_score_percent or 0}%",
            "result": "pending",
            "resultLabel": "En cours de validation",
            "docStatus": "En attente de décision admin",
        }
        for doc in pending_docs
    ]

    pending_rows_from_certs = [
        {
            "id": str(row.id),
            "certification": row.title,
            "type": "Certification liée à une formation",
            "date": (row.awarded_at or row.updated_at or row.created_at).strftime("%d/%m/%Y"),
            "score": f"{row.score_percent or 0}%",
            "result": "failed" if row.status == "failed" else "pending",
            "resultLabel": "Non réussi" if row.status == "failed" else "En validation",
            "docStatus": "Certificat prêt" if row.status == "passed" else "Prêt après contrôle admin",
        }
        for row in (pending_cert + failed)
    ]

    all_pending_rows = (pending_rows_from_docs + pending_rows_from_certs)[:10]

    return {
        "summary": summary,
        "readyCertificates": [
            {
                "id": str(row.id),
                "title": row.title,
                "description": f"{row.issuer or 'Certification CSF'} • score {row.score_percent or 0}%",
            }
            for row in ready[:5]
        ],
        "pendingRows": all_pending_rows,
        "linkedCards": [
            {
                "id": str(row.id),
                "category": "Liées aux formations",
                "title": row.title,
                "description": f"Statut actuel: {row.status}.",
                "status": "unlocked" if row.status == "passed" else ("available" if row.status == "pending" else "locked"),
            }
            for row in certs[:8]
        ],
    }


def learner_module_detail(db: Session, user: User, module_id: str) -> dict:
    members = learner_members_for_user(db, user)
    member_ids = [int(member.id) for member in members]
    if not member_ids:
        raise HTTPException(status_code=404, detail="Module introuvable.")
    progress = (
        db.query(LearnerProgress)
        .filter(
            LearnerProgress.member_id.in_(member_ids),
            LearnerProgress.target_ref == module_id,
        )
        .order_by(LearnerProgress.current_flag.desc(), LearnerProgress.updated_at.desc())
        .first()
    )
    if not progress:
        raise HTTPException(status_code=404, detail="Module introuvable.")
    if bool(progress.locked):
        raise HTTPException(status_code=403, detail="Ce module n'est pas encore ouvert par l'administration.")
    member = get_member(db, int(progress.member_id))
    title = progress.title
    description = ""
    level = "Intermédiaire"
    type_label = "Cours"
    duration_label = "2h"
    if module_id.startswith("reconversion_pack_module:"):
        pk = _parse_int_id(module_id.split(":")[-1], "moduleId")
        row = db.query(ReconversionPackModule).filter(ReconversionPackModule.id == pk).first()
        if row:
            title = row.title
            description = row.description or ""
            level = "Projet" if (row.module_kind or "").lower() == "project" else "Intermédiaire"
            type_label = "Projet" if (row.module_kind or "").lower() == "project" else "Cours"
            duration_label = _opt_text(row.duree) or duration_label
    elif module_id.startswith("ponctuelle_module:"):
        pk = _parse_int_id(module_id.split(":")[-1], "moduleId")
        row = db.query(PonctuelleModule).filter(PonctuelleModule.id == pk).first()
        if row:
            title = row.title
            description = row.description or ""
            level = "Ponctuelle"
            type_label = "Projet" if "projet" in (row.project or "").lower() else "Cours"
            duration_label = _opt_text(row.duration) or duration_label
    certs = (
        db.query(LearnerCertificationResult)
        .filter(
            LearnerCertificationResult.member_id == int(member.id),
            LearnerCertificationResult.scope_ref == module_id,
        )
        .all()
    )
    sessions = (
        db.query(GroupSession, SessionAttendance)
        .join(SessionAttendance, SessionAttendance.session_id == GroupSession.id)
        .filter(
            GroupSession.group_id == int(member.group_id),
            SessionAttendance.member_id == int(member.id),
            GroupSession.target_ref == module_id,
        )
        .order_by(GroupSession.scheduled_at.asc())
        .all()
    )
    present = sum(1 for _session, attendance in sessions if attendance.status == "present")
    absent = sum(1 for _session, attendance in sessions if attendance.status == "absent")
    attendance_days = []
    by_day: dict[int, str] = {}
    if sessions:
        base_dt = sessions[0][0].scheduled_at
    else:
        base_dt = datetime.now(timezone.utc)
    year = base_dt.year
    month = base_dt.month
    for session, attendance in sessions:
        if session.scheduled_at.year == year and session.scheduled_at.month == month:
            by_day[session.scheduled_at.day] = "present" if attendance.status == "present" else "absent"
    import calendar

    weekday_names = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]
    for day in range(1, calendar.monthrange(year, month)[1] + 1):
        weekday = datetime(year, month, day).weekday()
        attendance_days.append(
            {
                "day": day,
                "weekdayShort": weekday_names[weekday],
                "status": by_day.get(day, "free"),
            }
        )
    return {
        "id": module_id,
        "badges": [get_group(db, int(member.group_id)).name, f"Progression {progress.progress_percent}%"],
        "title": title,
        "levelLabel": level,
        "description": description or "Module assigné depuis votre parcours de formation.",
        "courses": [
            {
                "id": module_id,
                "title": title,
                "progressPercent": int(progress.progress_percent or 0),
                "description": description or "Contenu du module accessible via votre groupe.",
                "typeLabel": type_label,
                "duration": duration_label,
                "status": "Terminé" if int(progress.progress_percent or 0) >= 100 else ("En cours" if int(progress.progress_percent or 0) > 0 else "À faire"),
            }
        ],
        "stats": {
            "coursPercent": int(progress.progress_percent or 0),
            "labsPercent": int(progress.progress_percent or 0),
            "testsTotal": len(certs),
            "testsPassed": sum(1 for row in certs if row.status == "passed"),
            "testsFailed": sum(1 for row in certs if row.status == "failed"),
        },
        "attendanceLegend": f"Présences {present} • Absences {absent}",
        "attendanceDays": attendance_days,
    }


def _group_session_is_fully_pending(db: Session, session_id: int) -> bool:
    rows = (
        db.query(SessionAttendance)
        .filter(SessionAttendance.session_id == session_id)
        .all()
    )
    if not rows:
        return True
    return all((r.status or "") == "pending" for r in rows)


def _module_session_summary_dict_by_group(db: Session, group: ApprenantGroup) -> dict:
    accesses = (
        db.query(ApprenantGroupAccess)
        .filter(
            ApprenantGroupAccess.group_id == int(group.id),
            ApprenantGroupAccess.access_kind.in_(
                ["ponctuelle_module", "reconversion_module", "reconversion_pack"]
            ),
        )
        .order_by(ApprenantGroupAccess.id.asc())
        .all()
    )
    member_count = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == int(group.id))
        .count()
    )
    sessions = db.query(GroupSession).filter(GroupSession.group_id == int(group.id)).all()
    session_count = len(sessions)
    pending_count = 0
    for s in sessions:
        attendances = (
            db.query(SessionAttendance)
            .filter(SessionAttendance.session_id == int(s.id))
            .all()
        )
        if not attendances or all((a.status or "") == "pending" for a in attendances):
            pending_count += 1
    return {
        "id": str(group.id),
        "groupId": str(group.id),
        "sessionLabel": group.name,
        "accesses": [
            {
                "id": str(a.id),
                "moduleRef": a.target_ref,
                "moduleLabel": a.label,
                "accessKind": a.access_kind,
            }
            for a in accesses
        ],
        "memberCount": int(member_count),
        "sessionCount": session_count,
        "pendingSessionCount": pending_count,
    }


def _require_module_session_group(db: Session, group_id: int) -> ApprenantGroup:
    group = get_group(db, group_id)
    if _is_catalog_enrollment_group(group):
        raise HTTPException(status_code=404, detail="Session-module introuvable.")
    has_module = (
        db.query(ApprenantGroupAccess)
        .filter(
            ApprenantGroupAccess.group_id == group_id,
            ApprenantGroupAccess.access_kind.in_(
                ["ponctuelle_module", "reconversion_module", "reconversion_pack"]
            ),
        )
        .first()
    )
    if not has_module:
        raise HTTPException(status_code=404, detail="Session-module introuvable.")
    return group


def _member_attendance_rate_for_group(db: Session, member_id: int, group_id: int) -> int:
    rows = (
        db.query(SessionAttendance)
        .join(GroupSession, GroupSession.id == SessionAttendance.session_id)
        .filter(
            SessionAttendance.member_id == member_id,
            GroupSession.group_id == group_id,
        )
        .all()
    )
    settled = [r for r in rows if (r.status or "") != "pending"]
    if not settled:
        return 0
    present_n = sum(1 for r in settled if r.status == "present")
    excused_n = sum(1 for r in settled if r.status == "excused")
    return int(round(((present_n + excused_n) / len(settled)) * 100))


def list_module_sessions(db: Session) -> list[dict]:
    group_ids_q = (
        db.query(ApprenantGroupAccess.group_id)
        .filter(
            ApprenantGroupAccess.access_kind.in_(
                ["ponctuelle_module", "reconversion_module", "reconversion_pack"]
            )
        )
        .distinct()
    )
    groups = (
        db.query(ApprenantGroup)
        .filter(ApprenantGroup.id.in_(group_ids_q))
        .order_by(ApprenantGroup.created_at.desc(), ApprenantGroup.id.desc())
        .all()
    )
    groups = [g for g in groups if not _is_catalog_enrollment_group(g)]
    return [_module_session_summary_dict_by_group(db, g) for g in groups]


def create_module_session(db: Session, body) -> dict:
    modules = body.modules
    if not modules:
        raise HTTPException(status_code=400, detail="Au moins un module est requis.")
    label = (body.sessionLabel or "").strip()
    if not label:
        label = (modules[0].moduleLabel or "").strip()
    if not label:
        raise HTTPException(status_code=400, detail="sessionLabel est requis.")
    kinds = [m.accessKind for m in modules]
    if len(kinds) != len(set(kinds)):
        raise HTTPException(status_code=400, detail="Maximum 1 module ponctuel et 1 module reconversion.")
    has_ponctuel = any(m.accessKind == "ponctuelle_module" for m in modules)
    has_reconv = any(m.accessKind == "reconversion_module" for m in modules)
    has_pack = any(m.accessKind == "reconversion_pack" for m in modules)
    if has_pack and has_reconv:
        raise HTTPException(
            status_code=400,
            detail="Choisissez un pack ou un module reconversion, pas les deux.",
        )
    if len(modules) > 2:
        raise HTTPException(
            status_code=400,
            detail="Maximum un module ponctuel et un pack ou module reconversion.",
        )
    if has_ponctuel and (has_reconv or has_pack):
        fmt = "sur_mesure"
    elif has_ponctuel:
        fmt = "ponctuelle"
    else:
        fmt = "reconversion"
    group = ApprenantGroup(
        name=label,
        description=None,
        format=fmt,
        reconversion_topic_slug=None,
        reconversion_pack_id=None,
        ponctuelle_formation_slug=None,
        ponctuelle_formation_slugs=None,
        start_date=None,
        end_date=None,
        status="active",
    )
    db.add(group)
    db.flush()
    for m in modules:
        ref = (m.moduleRef or "").strip()
        mod_label = (m.moduleLabel or "").strip()
        if not ref or not mod_label:
            raise HTTPException(status_code=400, detail="moduleRef et moduleLabel sont requis pour chaque module.")
        db.add(
            ApprenantGroupAccess(
                group_id=int(group.id),
                access_kind=m.accessKind,
                target_ref=ref,
                label=mod_label,
            )
        )
    db.flush()
    if has_ponctuel:
        _refresh_group_ponctuelle_scope_from_accesses(db, group)
    if has_pack:
        pack_entry = next(m for m in modules if m.accessKind == "reconversion_pack")
        pack = _pack_by_id(db, pack_entry.moduleRef)
        group.reconversion_pack_id = int(pack.id)
        topic = db.query(ReconversionTopic).filter(ReconversionTopic.id == int(pack.topic_id)).first()
        if topic:
            group.reconversion_topic_slug = topic.slug
    pack_module_ref = _opt_text(getattr(body, "packSessionModuleRef", None))
    if has_pack and pack_module_ref:
        marker_line = f"{SESSION_MODULE_REF_MARKER}|{pack_module_ref}"
        group.description = (
            f"{group.description}\n{marker_line}".strip()
            if group.description
            else marker_line
        )
    db.commit()
    db.refresh(group)
    return _module_session_summary_dict_by_group(db, group)


def list_module_session_members(db: Session, group_id: int) -> list[dict]:
    _require_module_session_group(db, group_id)
    gid = int(group_id)
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id == gid)
        .order_by(ApprenantGroupMember.created_at.asc(), ApprenantGroupMember.id.asc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "email": m.email,
            "firstName": m.first_name,
            "lastName": m.last_name,
            "fullName": _group_member_full_name(m),
            "status": m.status,
            "attendanceRate": _member_attendance_rate_for_group(db, int(m.id), gid),
        }
        for m in members
    ]


def add_member_to_module_session(db: Session, group_id: int, body) -> dict:
    group = _require_module_session_group(db, group_id)
    gid = int(group.id)
    email = normalize_email(str(body.email))
    unlock_ref = _parse_session_module_ref(group.description)
    if not unlock_ref:
        direct_module_access = (
            db.query(ApprenantGroupAccess)
            .filter(
                ApprenantGroupAccess.group_id == gid,
                ApprenantGroupAccess.access_kind.in_(["ponctuelle_module", "reconversion_module"]),
            )
            .order_by(ApprenantGroupAccess.id.asc())
            .first()
        )
        if direct_module_access:
            unlock_ref = direct_module_access.target_ref
    exists = (
        db.query(ApprenantGroupMember)
        .filter(
            ApprenantGroupMember.group_id == gid,
            ApprenantGroupMember.email_normalized == email,
        )
        .first()
    )
    if exists:
        if unlock_ref:
            _unlock_module_for_member(db, exists, unlock_ref)
        ensure_member_progress_rows(db, exists)
        _recompute_member_progress(db, exists)
        db.commit()
        db.refresh(group)
        return _module_session_summary_dict_by_group(db, group)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    member = ApprenantGroupMember(
        group_id=gid,
        user_id=user.id if user else None,
        email=email,
        email_normalized=email,
        first_name=_opt_text(user.first_name) if user else None,
        last_name=_opt_text(user.last_name) if user else None,
        status="active" if user else "pending",
        linked_at=datetime.now(timezone.utc) if user else None,
    )
    db.add(member)
    db.flush()
    sessions = db.query(GroupSession).filter(GroupSession.group_id == gid).all()
    for session in sessions:
        db.add(
            SessionAttendance(
                session_id=int(session.id),
                member_id=int(member.id),
                status="pending",
            )
        )
    if unlock_ref:
        _unlock_module_for_member(db, member, unlock_ref)
    ensure_member_progress_rows(db, member)
    _recompute_member_progress(db, member)
    db.commit()
    db.refresh(group)
    return _module_session_summary_dict_by_group(db, group)


def remove_member_from_module_session(db: Session, group_id: int, member_id: int) -> None:
    _require_module_session_group(db, group_id)
    member = get_member(db, member_id)
    if int(member.group_id) != group_id:
        raise HTTPException(status_code=404, detail="Apprenant introuvable pour cette session-module.")
    delete_member(db, member_id)


def delete_module_session(db: Session, group_id: int) -> None:
    _require_module_session_group(db, group_id)
    delete_group(db, group_id)


def list_active_enrollments(db: Session, access_kind: str | None, target_ref: str | None) -> list[dict]:
    q = (
        db.query(LearnerProgress, ApprenantGroupMember)
        .join(ApprenantGroupMember, ApprenantGroupMember.id == LearnerProgress.member_id)
        .filter(LearnerProgress.current_flag.is_(True))
    )
    if access_kind:
        q = q.filter(LearnerProgress.access_kind == access_kind)
    if target_ref:
        q = q.filter(LearnerProgress.target_ref == target_ref)
    rows = q.order_by(LearnerProgress.updated_at.desc(), LearnerProgress.id.desc()).all()
    out: list[dict] = []
    for lp, member in rows:
        group = get_group(db, int(member.group_id))
        user = db.query(User).filter(User.id == member.user_id).first() if member.user_id else None
        email = user.email if user else member.email
        full_name = _group_member_full_name(member)
        if lp.access_kind == "reconversion_module":
            formation_type = _resolve_group_scope(group, db)["formationLabel"]
        elif lp.access_kind == "ponctuelle_module":
            formation_type = "Ponctuelle"
        else:
            formation_type = _resolve_group_scope(group, db)["formationLabel"]
        out.append(
            {
                "memberId": str(member.id),
                "email": email,
                "fullName": full_name,
                "moduleRef": lp.target_ref,
                "moduleLabel": lp.title,
                "accessKind": lp.access_kind,
                "formationType": formation_type,
                "attendanceRate": _member_attendance_rate(db, int(member.id)),
            }
        )
    return out


def list_enrollments(
    db: Session,
    enrollment_kind: str | None = None,
    target_ref: str | None = None,
) -> list[dict]:
    """Liste toutes les inscriptions actives avec stats de présence."""
    q = db.query(MemberEnrollment).filter(MemberEnrollment.status == "active")
    if enrollment_kind:
        q = q.filter(MemberEnrollment.enrollment_kind == enrollment_kind)
    if target_ref:
        q = q.filter(MemberEnrollment.target_ref == target_ref)
    rows = q.order_by(MemberEnrollment.created_at.desc()).all()
    result = []
    for row in rows:
        members = db.query(ApprenantGroupMember).filter(
            ApprenantGroupMember.email_normalized == row.email_normalized
        ).all()
        session_count = 0
        attendance_rate = 0
        for member in members:
            att_rows = [
                a for a in _member_attendance_rows(db, int(member.id)) if (a.status or "") != "pending"
            ]
            session_count += len(att_rows)
            if att_rows:
                present_n = sum(1 for a in att_rows if a.status in ("present", "excused"))
                attendance_rate = max(
                    attendance_rate, int(round((present_n / len(att_rows)) * 100))
                )
        result.append(
            {
                "id": str(row.id),
                "email": row.email,
                "emailNormalized": row.email_normalized,
                "userId": row.user_id,
                "enrollmentKind": row.enrollment_kind,
                "targetRef": row.target_ref,
                "targetLabel": row.target_label,
                "enrolledBy": row.enrolled_by,
                "status": row.status,
                "sessionCount": session_count,
                "attendanceRate": attendance_rate,
                "createdAt": row.created_at,
            }
        )
    return result


def ensure_enrollment_catalog_group(
    db: Session,
    enrollment_kind: str,
    target_ref: str,
    target_label: str,
) -> ApprenantGroup:
    """Groupe catalogue : affiche la formation sur le dashboard, modules verrouillés."""
    marker = _catalog_enrollment_description(enrollment_kind, target_ref)
    group = (
        db.query(ApprenantGroup)
        .filter(ApprenantGroup.description == marker)
        .first()
    )
    if group:
        return group
    label = (target_label or target_ref).strip() or "Formation"
    if enrollment_kind == "ponctuelle_module":
        fmt = "ponctuelle"
        access_kind = "ponctuelle_module"
        pack_id = None
        topic_slug = None
        ponctuelle_slug = None
        module_refs = [target_ref]
    elif enrollment_kind == "reconversion_pack":
        fmt = "reconversion"
        access_kind = "reconversion_pack"
        pack = _pack_by_id(db, target_ref)
        pack_id = int(pack.id)
        topic = db.query(ReconversionTopic).filter(ReconversionTopic.id == int(pack.topic_id)).first()
        topic_slug = topic.slug if topic else None
        ponctuelle_slug = None
        module_refs = []
    else:
        fmt = "reconversion"
        access_kind = "reconversion_module"
        pack_id = None
        topic_slug = None
        ponctuelle_slug = None
        module_refs = []
    group = ApprenantGroup(
        name=f"Inscription — {label}",
        description=marker,
        format=fmt,
        reconversion_topic_slug=topic_slug,
        reconversion_pack_id=pack_id,
        ponctuelle_formation_slug=ponctuelle_slug,
        ponctuelle_formation_slugs=None,
        start_date=None,
        end_date=None,
        status="active",
    )
    db.add(group)
    db.flush()
    if enrollment_kind == "ponctuelle_module":
        for ref in module_refs:
            db.add(
                ApprenantGroupAccess(
                    group_id=int(group.id),
                    access_kind="ponctuelle_module",
                    target_ref=ref,
                    label=resolve_access_label(db, "ponctuelle_module", ref),
                )
            )
        db.flush()
        _refresh_group_ponctuelle_scope_from_accesses(db, group)
    else:
        db.add(
            ApprenantGroupAccess(
                group_id=int(group.id),
                access_kind=access_kind,
                target_ref=target_ref,
                label=label,
            )
        )
        db.flush()
    return group


def sync_enrollment_to_catalog_member(db: Session, enrollment: MemberEnrollment) -> None:
    """Ajoute l'apprenant au groupe catalogue (progression verrouillée)."""
    group = ensure_enrollment_catalog_group(
        db,
        enrollment.enrollment_kind,
        enrollment.target_ref,
        enrollment.target_label,
    )
    gid = int(group.id)
    email_norm = enrollment.email_normalized
    exists = (
        db.query(ApprenantGroupMember)
        .filter(
            ApprenantGroupMember.group_id == gid,
            ApprenantGroupMember.email_normalized == email_norm,
        )
        .first()
    )
    if exists:
        ensure_member_progress_rows(db, exists)
        _recompute_member_progress(db, exists)
        return
    user = (
        db.query(User).filter(User.id == enrollment.user_id).first()
        if enrollment.user_id
        else db.query(User).filter(func.lower(User.email) == email_norm).first()
    )
    member = ApprenantGroupMember(
        group_id=gid,
        user_id=user.id if user else None,
        email=enrollment.email,
        email_normalized=email_norm,
        first_name=_opt_text(user.first_name) if user else None,
        last_name=_opt_text(user.last_name) if user else None,
        status="active" if user else "pending",
        linked_at=datetime.now(timezone.utc) if user else None,
    )
    db.add(member)
    db.flush()
    ensure_member_progress_rows(db, member)
    _recompute_member_progress(db, member)


def list_pack_modules_for_enrollment(db: Session, pack_id: str) -> list[dict]:
    return expand_access_targets(db, "reconversion_pack", pack_id)


def create_enrollment(
    db: Session,
    email: str,
    enrollment_kind: str,
    target_ref: str,
    target_label: str,
    enrolled_by_user_id: str,
) -> dict:
    """Crée une inscription directe. Lève 409 si déjà inscrit."""
    email_norm = normalize_email(email)
    existing = (
        db.query(MemberEnrollment)
        .filter(
            MemberEnrollment.email_normalized == email_norm,
            MemberEnrollment.enrollment_kind == enrollment_kind,
            MemberEnrollment.target_ref == target_ref,
            MemberEnrollment.status == "active",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Cet apprenant est déjà inscrit à ce module/pack.")

    user = db.query(User).filter(func.lower(User.email) == email_norm).first()
    row = MemberEnrollment(
        email=email.strip(),
        email_normalized=email_norm,
        user_id=user.id if user else None,
        enrollment_kind=enrollment_kind,
        target_ref=target_ref,
        target_label=target_label,
        enrolled_by=enrolled_by_user_id,
        status="active",
    )
    db.add(row)
    db.flush()
    sync_enrollment_to_catalog_member(db, row)
    db.commit()
    db.refresh(row)
    return {
        "id": str(row.id),
        "email": row.email,
        "emailNormalized": row.email_normalized,
        "userId": row.user_id,
        "enrollmentKind": row.enrollment_kind,
        "targetRef": row.target_ref,
        "targetLabel": row.target_label,
        "status": row.status,
        "sessionCount": 0,
        "attendanceRate": 0,
        "createdAt": row.created_at,
    }


def delete_enrollment(db: Session, enrollment_id: int) -> dict:
    """Archive (soft delete) une inscription."""
    row = db.query(MemberEnrollment).filter(MemberEnrollment.id == enrollment_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Inscription introuvable.")
    group = (
        db.query(ApprenantGroup)
        .filter(
            ApprenantGroup.description
            == _catalog_enrollment_description(row.enrollment_kind, row.target_ref)
        )
        .first()
    )
    if group:
        member = (
            db.query(ApprenantGroupMember)
            .filter(
                ApprenantGroupMember.group_id == int(group.id),
                ApprenantGroupMember.email_normalized == row.email_normalized,
            )
            .first()
        )
        if member:
            delete_member(db, int(member.id))
    row.status = "archived"
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


def list_enrolled_members_for_target(
    db: Session,
    enrollment_kind: str,
    target_ref: str,
) -> list[dict]:
    """Membres inscrits à un pack/module (planification intelligente)."""
    rows = (
        db.query(MemberEnrollment)
        .filter(
            MemberEnrollment.enrollment_kind == enrollment_kind,
            MemberEnrollment.target_ref == target_ref,
            MemberEnrollment.status == "active",
        )
        .order_by(MemberEnrollment.created_at.asc())
        .all()
    )
    result = []
    for row in rows:
        members = db.query(ApprenantGroupMember).filter(
            ApprenantGroupMember.email_normalized == row.email_normalized
        ).all()
        attendance_rate = 0
        for member in members:
            rate = _member_attendance_rate(db, int(member.id))
            attendance_rate = max(attendance_rate, rate)
        full_name = row.email
        user = db.query(User).filter(User.id == row.user_id).first() if row.user_id else None
        if user:
            first = (user.first_name or "").strip()
            last = (user.last_name or "").strip()
            full_name = " ".join(p for p in (first, last) if p) or row.email
        result.append(
            {
                "enrollmentId": str(row.id),
                "email": row.email,
                "emailNormalized": row.email_normalized,
                "fullName": full_name,
                "userId": row.user_id,
                "attendanceRate": attendance_rate,
            }
        )
    return result

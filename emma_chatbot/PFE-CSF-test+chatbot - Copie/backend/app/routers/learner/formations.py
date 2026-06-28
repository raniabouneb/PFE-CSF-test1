"""Learner endpoints for formations, progression and planning.

Prefix: /learner/formations
All routes require an authenticated user (any role).

Reads from the existing infrastructure tables:
- apprenant_group, apprenant_group_member, apprenant_group_access
- learner_progress
- planning_session, planning_session_group, planning_attendance
"""

from __future__ import annotations

import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_

from app.core.auth_deps import CurrentUser
from app.core.dependencies import Db
from app.domains.catalog.module_support_public import module_support_file_public_url
from app.persistence.models.tables import (
    ApprenantGroup,
    ApprenantGroupAccess,
    ApprenantGroupMember,
    LearnerProgress,
    ModuleSupport,
    ReconversionPack,
    ReconversionPackModule,
)

router = APIRouter()


# ── Pydantic response models ──────────────────────────────────────────

class ModuleProgressOut(BaseModel):
    module_id: str
    titre: str
    duree_minutes: int | None = None
    minutes_validees: int = 0
    progress_percent: int = 0

class PackModuleProgressOut(BaseModel):
    module_id: str
    titre: str
    ordre: int = 0
    statut: str = "locked"
    unlocked_at: str | None = None
    completed_at: str | None = None

class EnrollmentOut(BaseModel):
    enrollment_id: str
    groupe_id: str
    groupe_nom: str
    type: str
    groupe_statut: str
    progress_percent: int = 0
    modules: list[ModuleProgressOut] = []
    pack_modules: list[PackModuleProgressOut] = []

class LearnerSessionOut(BaseModel):
    session_id: str
    titre: str
    date: str
    heure_debut: str | None = None
    duree_minutes: int | None = None
    lieu: str | None = None
    statut: str
    module_titre: str | None = None
    groupe_nom: str | None = None

class SupportOut(BaseModel):
    id: str
    file_name: str
    url: str

class ModuleDetailOut(BaseModel):
    id: str
    titre: str
    description: str | None = None
    duree_minutes: int | None = None
    pdf_url: str | None = None
    minutes_validees: int = 0
    statut: str | None = None
    sessions: list[LearnerSessionOut] = []
    supports: list[SupportOut] = []


# ── GET / — list enrollments with progression ──────────────────────────

@router.get("/", response_model=list[EnrollmentOut])
def api_list_formations(user: CurrentUser, db: Db) -> list[EnrollmentOut]:
    memberships = db.execute(
        select(ApprenantGroupMember, ApprenantGroup)
        .join(ApprenantGroup, ApprenantGroup.id == ApprenantGroupMember.group_id)
        .where(ApprenantGroupMember.user_id == user.id)
    ).all()

    result: list[EnrollmentOut] = []
    for member, group in memberships:
        enrollment_id = f"{group.id}-{member.id}"
        group_format = (group.format or "ponctuelle").lower()

        progress_rows = db.execute(
            select(LearnerProgress).where(
                LearnerProgress.member_id == member.id
            )
        ).scalars().all()

        if group_format == "reconversion":
            out = _build_reconversion(enrollment_id, member, group, progress_rows)
        else:
            out = _build_ponctuelle(enrollment_id, member, group, progress_rows)

        result.append(out)
    return result


# ── GET /{enrollment_id}/modules/{module_id} ──────────────────────────

@router.get("/{enrollment_id}/modules/{module_id}", response_model=ModuleDetailOut)
def api_module_detail(
    enrollment_id: str,
    module_id: str,
    user: CurrentUser,
    db: Db,
) -> ModuleDetailOut:
    parts = enrollment_id.split("-", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=404, detail="Enrollment introuvable")

    group_id_str, member_id_str = parts
    try:
        group_id = int(group_id_str)
        member_id = int(member_id_str)
    except ValueError:
        raise HTTPException(status_code=404, detail="Enrollment introuvable")

    member = db.execute(
        select(ApprenantGroupMember).where(
            ApprenantGroupMember.id == member_id,
            ApprenantGroupMember.user_id == user.id,
            ApprenantGroupMember.group_id == group_id,
        )
    ).scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Enrollment introuvable")

    progress = db.execute(
        select(LearnerProgress).where(
            LearnerProgress.member_id == member_id,
            LearnerProgress.target_ref == module_id,
        )
    ).scalar_one_or_none()

    group = db.get(ApprenantGroup, group_id)
    group_format = (group.format or "ponctuelle").lower() if group else "ponctuelle"

    if progress and group_format == "reconversion" and progress.locked:
        raise HTTPException(status_code=403, detail="Ce module est verrouillé")

    titre = progress.title if progress else "Module"
    minutes_total = progress.minutes_total if progress else None
    minutes_completed = progress.minutes_completed if progress else 0

    statut: str | None = None
    if progress:
        statut = progress.status

    sessions = _get_module_sessions(db, member_id, group_id, module_id)
    supports = _get_module_supports(db, module_id)

    first_url = supports[0].url if supports else None

    return ModuleDetailOut(
        id=module_id,
        titre=titre,
        description=None,
        duree_minutes=minutes_total,
        pdf_url=first_url,
        minutes_validees=minutes_completed,
        statut=statut,
        sessions=sessions,
        supports=supports,
    )


# ── GET /planning ─────────────────────────────────────────────────────

@router.get("/planning", response_model=list[LearnerSessionOut])
def api_learner_planning(user: CurrentUser, db: Db) -> list[LearnerSessionOut]:
    today = datetime.date.today()

    member_rows = db.execute(
        select(ApprenantGroupMember).where(
            ApprenantGroupMember.user_id == user.id
        )
    ).scalars().all()

    if not member_rows:
        return []

    member_group_map: dict[int, int] = {}
    group_ids: set[int] = set()
    member_ids: set[int] = set()
    for m in member_rows:
        member_group_map[m.id] = m.group_id
        group_ids.add(m.group_id)
        member_ids.add(m.id)

    try:
        from app.persistence.models.tables import PlanningSession, PlanningSessionGroup
    except ImportError:
        return []

    stmt = (
        select(PlanningSession, PlanningSessionGroup.group_id)
        .join(PlanningSessionGroup, PlanningSessionGroup.session_id == PlanningSession.id)
        .where(
            PlanningSessionGroup.group_id.in_(group_ids),
            PlanningSession.date >= today,
            PlanningSession.status != "cancelled",
        )
        .order_by(PlanningSession.date.asc())
    )

    rows = db.execute(stmt).all()

    groups_cache: dict[int, ApprenantGroup] = {}
    for gid in group_ids:
        g = db.get(ApprenantGroup, gid)
        if g:
            groups_cache[gid] = g

    seen: set[int] = set()
    result: list[LearnerSessionOut] = []
    for sess, gid in rows:
        if sess.id in seen:
            continue
        seen.add(sess.id)
        g = groups_cache.get(gid)
        result.append(
            LearnerSessionOut(
                session_id=str(sess.id),
                titre=sess.title,
                date=str(sess.date),
                heure_debut=sess.start_time,
                duree_minutes=sess.duration_minutes,
                lieu=sess.location,
                statut=sess.status,
                module_titre=sess.module_label,
                groupe_nom=g.name if g else None,
            )
        )

    return result


# ── Google Calendar (apprenant — même OAuth que l’admin) ───────────────


@router.get("/gcal/status")
def learner_gcal_status(user: CurrentUser, db: Db) -> dict:
    from app.core.config import settings
    from app.domains.admin.planning import gcal_service

    redirect_uri = settings.google_calendar_redirect_uri
    configured = bool(settings.google_client_id and settings.google_client_secret)
    if not configured:
        return {
            "connected": False,
            "configured": False,
            "calendarId": None,
            "embedUrl": None,
            "openUrl": gcal_service.build_open_url(),
            "redirectUri": redirect_uri,
        }
    view = gcal_service.get_connection_view(db, user.id, fallback_email=user.email)
    profile_email = (user.email or "").strip().lower()
    calendar_id = (view.get("calendarId") or "").strip().lower()
    email_mismatch = bool(
        view.get("connected")
        and profile_email
        and calendar_id
        and "@" in calendar_id
        and calendar_id != profile_email
    )
    return {
        "configured": True,
        "connected": bool(view.get("connected")),
        "calendarId": view.get("calendarId"),
        "embedUrl": view.get("embedUrl"),
        "openUrl": view.get("openUrl") or gcal_service.build_open_url(),
        "redirectUri": redirect_uri,
        "profileEmail": user.email,
        "emailMismatch": email_mismatch,
    }


@router.get("/gcal/auth-url")
def learner_gcal_auth_url(user: CurrentUser) -> dict:
    from app.domains.admin.planning import gcal_service

    try:
        url = gcal_service.get_google_auth_url(user.id, return_to="learner")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"url": url}


@router.delete("/gcal/disconnect")
def learner_gcal_disconnect(user: CurrentUser, db: Db) -> dict:
    from app.domains.admin.planning import gcal_service

    gcal_service.disconnect_google_calendar(db, user.id)
    return {"ok": True}


# ── helpers ────────────────────────────────────────────────────────────

def _build_ponctuelle(
    enrollment_id: str,
    member: Any,
    group: Any,
    progress_rows: list[Any],
) -> EnrollmentOut:
    modules: list[ModuleProgressOut] = []
    total_min = 0
    total_done = 0

    for p in progress_rows:
        dur = p.minutes_total or 0
        done = p.minutes_completed or 0
        pct = int(done / dur * 100) if dur > 0 else p.progress_percent or 0
        modules.append(
            ModuleProgressOut(
                module_id=str(p.target_ref),
                titre=p.title,
                duree_minutes=p.minutes_total,
                minutes_validees=done,
                progress_percent=min(pct, 100),
            )
        )
        total_min += dur
        total_done += done

    global_pct = int(total_done / total_min * 100) if total_min > 0 else 0

    return EnrollmentOut(
        enrollment_id=enrollment_id,
        groupe_id=str(group.id),
        groupe_nom=group.name,
        type="ponctuelle",
        groupe_statut=group.status or "pending",
        progress_percent=min(global_pct, 100),
        modules=modules,
    )


def _build_reconversion(
    enrollment_id: str,
    member: Any,
    group: Any,
    progress_rows: list[Any],
) -> EnrollmentOut:
    pack_modules: list[PackModuleProgressOut] = []
    done_count = 0
    total_count = 0

    sorted_rows = sorted(progress_rows, key=lambda p: getattr(p, "id", 0))

    for idx, p in enumerate(sorted_rows):
        total_count += 1
        statut = "locked"
        if p.status == "completed" or p.completed_by_admin:
            statut = "done"
            done_count += 1
        elif p.opened_by_admin or not p.locked:
            statut = "open"

        pack_modules.append(
            PackModuleProgressOut(
                module_id=str(p.target_ref),
                titre=p.title,
                ordre=idx,
                statut=statut,
            )
        )

    global_pct = int(done_count / total_count * 100) if total_count > 0 else 0

    return EnrollmentOut(
        enrollment_id=enrollment_id,
        groupe_id=str(group.id),
        groupe_nom=group.name,
        type="reconversion",
        groupe_statut=group.status or "pending",
        progress_percent=min(global_pct, 100),
        pack_modules=pack_modules,
    )


def _get_module_supports(db: Any, module_id: str) -> list[SupportOut]:
    """Return supports for a module. For reconversion modules, also includes
    supports from sibling modules with the same title across all packs of
    the same topic."""
    parts = module_id.split(":", 1)
    if len(parts) != 2:
        return []
    source, pk_str = parts
    try:
        pk = int(pk_str)
    except ValueError:
        return []

    module_ids_to_query: list[int] = [pk]

    if source == "reconversion_pack_module":
        module_row = db.execute(
            select(ReconversionPackModule).where(ReconversionPackModule.id == pk)
        ).scalar_one_or_none()
        if module_row:
            pack_row = db.execute(
                select(ReconversionPack).where(ReconversionPack.id == int(module_row.pack_id))
            ).scalar_one_or_none()
            if pack_row:
                siblings = db.execute(
                    select(ReconversionPackModule.id)
                    .join(ReconversionPack, ReconversionPackModule.pack_id == ReconversionPack.id)
                    .where(
                        ReconversionPack.topic_id == pack_row.topic_id,
                        ReconversionPackModule.title == module_row.title,
                        ReconversionPackModule.id != pk,
                    )
                ).scalars().all()
                module_ids_to_query.extend(int(sid) for sid in siblings)

    rows = db.execute(
        select(ModuleSupport)
        .where(
            ModuleSupport.module_source == source,
            ModuleSupport.module_id.in_(module_ids_to_query),
        )
        .order_by(ModuleSupport.id.asc())
    ).scalars().all()

    seen: set[str] = set()
    result: list[SupportOut] = []
    for r in rows:
        if r.file_name in seen:
            continue
        seen.add(r.file_name)
        result.append(SupportOut(
            id=str(r.id),
            file_name=r.file_name,
            url=module_support_file_public_url(int(r.id)),
        ))
    return result


def _get_module_sessions(
    db: Any, member_id: int, group_id: int, module_id: str
) -> list[LearnerSessionOut]:
    try:
        from app.persistence.models.tables import PlanningSession, PlanningSessionGroup
    except ImportError:
        return []

    stmt = (
        select(PlanningSession)
        .join(PlanningSessionGroup, PlanningSessionGroup.session_id == PlanningSession.id)
        .where(
            PlanningSessionGroup.group_id == group_id,
            PlanningSession.module_target_ref == module_id,
        )
        .order_by(PlanningSession.date.asc())
    )

    rows = db.execute(stmt).scalars().all()

    return [
        LearnerSessionOut(
            session_id=str(s.id),
            titre=s.title,
            date=str(s.date),
            heure_debut=s.start_time,
            duree_minutes=s.duration_minutes,
            lieu=s.location,
            statut=s.status,
            module_titre=s.module_label,
            groupe_nom=None,
        )
        for s in rows
    ]

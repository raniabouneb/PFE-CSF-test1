"""Admin endpoints for LMS sessions (new UUID-based schema).

Prefix: /admin/sessions  (mounted by the admin router)
All routes require admin authentication.
"""

from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import and_, select

from app.core.auth_deps import AdminUser
from app.core.dependencies import Db
from app.models.lms import (
    Attendance,
    Enrollment,
    Groupe,
    Session as LmsSession,
    SessionGroup,
)
from app.persistence.models.tables import User
from app.schemas.session import (
    AttendanceMark,
    AttendanceOut,
    GroupAddBody,
    SessionCreate,
    SessionDetail,
    SessionPatch,
    SessionWithGroups,
    UnlockModuleBody,
)
from app.services.progression_service import mark_attendance, unlock_next_module
from app.services.session_service import (
    _build_session_with_groups,
    create_session,
    get_apprenants_for_session,
)

router = APIRouter()


# ── POST / ──────────────────────────────────────────────────────────────

@router.post("/", response_model=SessionWithGroups)
def api_create_session(
    body: SessionCreate,
    _admin: AdminUser,
    db: Db,
) -> SessionWithGroups:
    return create_session(db, body)


# ── GET / (with filters) ───────────────────────────────────────────────

@router.get("/", response_model=list[SessionWithGroups])
def api_list_sessions(
    _admin: AdminUser,
    db: Db,
    date_from: datetime.date | None = Query(None),
    date_to: datetime.date | None = Query(None),
    groupe_id: uuid.UUID | None = Query(None),
) -> list[SessionWithGroups]:
    stmt = select(LmsSession)

    if date_from:
        stmt = stmt.where(LmsSession.date >= date_from)
    if date_to:
        stmt = stmt.where(LmsSession.date <= date_to)
    if groupe_id:
        stmt = (
            stmt.join(SessionGroup, SessionGroup.session_id == LmsSession.id)
            .where(SessionGroup.groupe_id == groupe_id)
        )

    stmt = stmt.order_by(LmsSession.date.desc())
    rows = db.execute(stmt).scalars().all()
    return [_build_session_with_groups(db, s) for s in rows]


# ── GET /{session_id} ──────────────────────────────────────────────────

@router.get("/{session_id}", response_model=SessionDetail)
def api_get_session(
    session_id: uuid.UUID,
    _admin: AdminUser,
    db: Db,
) -> SessionDetail:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")

    base = _build_session_with_groups(db, sess)
    apprenants = get_apprenants_for_session(db, session_id)

    return SessionDetail(**base.model_dump(), apprenants=apprenants)


# ── PATCH /{session_id} ────────────────────────────────────────────────

@router.patch("/{session_id}", response_model=SessionWithGroups)
def api_patch_session(
    session_id: uuid.UUID,
    body: SessionPatch,
    _admin: AdminUser,
    db: Db,
) -> SessionWithGroups:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")

    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(sess, field, value)

    db.commit()
    db.refresh(sess)
    return _build_session_with_groups(db, sess)


# ── DELETE /{session_id} ───────────────────────────────────────────────

@router.delete("/{session_id}")
def api_delete_session(
    session_id: uuid.UUID,
    _admin: AdminUser,
    db: Db,
) -> dict:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if sess.statut != "planifiee":
        raise HTTPException(
            status_code=409,
            detail="Seules les sessions planifiées peuvent être supprimées",
        )

    db.delete(sess)
    db.commit()
    return {"ok": True}


# ── POST /{session_id}/groups ──────────────────────────────────────────

@router.post("/{session_id}/groups", response_model=SessionWithGroups)
def api_add_group(
    session_id: uuid.UUID,
    body: GroupAddBody,
    _admin: AdminUser,
    db: Db,
) -> SessionWithGroups:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    grp = db.get(Groupe, body.groupe_id)
    if not grp:
        raise HTTPException(status_code=404, detail="Groupe introuvable")

    exists = db.execute(
        select(SessionGroup).where(
            SessionGroup.session_id == session_id,
            SessionGroup.groupe_id == body.groupe_id,
        )
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="Groupe déjà lié à cette session")

    db.add(SessionGroup(session_id=session_id, groupe_id=body.groupe_id))
    db.commit()
    return _build_session_with_groups(db, sess)


# ── DELETE /{session_id}/groups/{groupe_id} ────────────────────────────

@router.delete("/{session_id}/groups/{groupe_id}", response_model=SessionWithGroups)
def api_remove_group(
    session_id: uuid.UUID,
    groupe_id: uuid.UUID,
    _admin: AdminUser,
    db: Db,
) -> SessionWithGroups:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")

    sg = db.execute(
        select(SessionGroup).where(
            SessionGroup.session_id == session_id,
            SessionGroup.groupe_id == groupe_id,
        )
    ).scalar_one_or_none()
    if not sg:
        raise HTTPException(status_code=404, detail="Lien session-groupe introuvable")

    db.delete(sg)
    db.commit()
    return _build_session_with_groups(db, sess)


# ── POST /{session_id}/attendance ──────────────────────────────────────

@router.post("/{session_id}/attendance", response_model=list[AttendanceOut])
def api_mark_attendance(
    session_id: uuid.UUID,
    body: list[AttendanceMark],
    _admin: AdminUser,
    db: Db,
) -> list[AttendanceOut]:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")

    for entry in body:
        mark_attendance(db, session_id, entry.apprenant_id, entry.present)

    return _get_attendance_list(db, session_id)


# ── GET /{session_id}/attendance ───────────────────────────────────────

@router.get("/{session_id}/attendance", response_model=list[AttendanceOut])
def api_get_attendance(
    session_id: uuid.UUID,
    _admin: AdminUser,
    db: Db,
) -> list[AttendanceOut]:
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    return _get_attendance_list(db, session_id)


# ── POST /enrollments/{enrollment_id}/unlock-module ────────────────────

@router.post("/enrollments/{enrollment_id}/unlock-module")
def api_unlock_module(
    enrollment_id: uuid.UUID,
    body: UnlockModuleBody,
    _admin: AdminUser,
    db: Db,
) -> dict:
    unlock_next_module(db, enrollment_id, body.module_id)
    return {"ok": True}


# ── internal helper ─────────────────────────────────────────────────────

def _get_attendance_list(db, session_id: uuid.UUID) -> list[AttendanceOut]:
    """Build attendance list for a session: all expected learners + presence."""
    stmt = (
        select(
            Enrollment.apprenant_id,
            User.email,
            User.first_name,
            User.last_name,
            Groupe.type.label("enrollment_type"),
            Attendance.present,
            Attendance.marked_at,
        )
        .select_from(SessionGroup)
        .join(Groupe, Groupe.id == SessionGroup.groupe_id)
        .join(Enrollment, Enrollment.groupe_id == Groupe.id)
        .join(User, User.id == Enrollment.apprenant_id)
        .outerjoin(
            Attendance,
            and_(
                Attendance.session_id == session_id,
                Attendance.apprenant_id == Enrollment.apprenant_id,
            ),
        )
        .where(SessionGroup.session_id == session_id)
        .distinct(Enrollment.apprenant_id)
    )

    rows = db.execute(stmt).all()
    return [
        AttendanceOut(
            apprenant_id=r.apprenant_id,
            email=r.email,
            first_name=r.first_name,
            last_name=r.last_name,
            enrollment_type=r.enrollment_type,
            present=r.present if r.present is not None else False,
            marked_at=r.marked_at,
        )
        for r in rows
    ]

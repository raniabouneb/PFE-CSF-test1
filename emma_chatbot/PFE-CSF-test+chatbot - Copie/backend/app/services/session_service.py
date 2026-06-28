"""
Service layer for the LMS sessions (new UUID-based schema).

All functions receive a synchronous SQLAlchemy ``Session`` (the project does
not use async drivers) and are meant to be called from FastAPI route handlers
via the ``Db`` dependency.
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lms import (
    Enrollment,
    Groupe,
    Module,
    Session as LmsSession,
    SessionGroup,
)
from app.persistence.models.tables import User
from app.schemas.session import (
    ApprenantInSession,
    GroupeRef,
    ModuleRef,
    SessionCreate,
    SessionWithGroups,
)


# ── helpers ──────────────────────────────────────────────────────────────

def _build_session_with_groups(
    db: Session,
    sess: LmsSession,
) -> SessionWithGroups:
    """Serialize an LmsSession row into a SessionWithGroups schema."""
    module: ModuleRef | None = None
    if sess.module_id:
        mod = db.get(Module, sess.module_id)
        if mod:
            module = ModuleRef.model_validate(mod)

    sg_rows = (
        db.execute(
            select(Groupe)
            .join(SessionGroup, SessionGroup.groupe_id == Groupe.id)
            .where(SessionGroup.session_id == sess.id)
        )
        .scalars()
        .all()
    )
    groupes = [GroupeRef.model_validate(g) for g in sg_rows]

    return SessionWithGroups(
        id=sess.id,
        module_id=sess.module_id,
        titre=sess.titre,
        date=sess.date,
        heure_debut=sess.heure_debut,
        duree_minutes=sess.duree_minutes,
        lieu=sess.lieu,
        statut=sess.statut,
        created_at=sess.created_at,
        module=module,
        groupes=groupes,
    )


# ── 1. create_session ───────────────────────────────────────────────────

def create_session(db: Session, data: SessionCreate) -> SessionWithGroups:
    """Create a session and link it to the supplied groups."""
    sess = LmsSession(
        id=uuid.uuid4(),
        module_id=data.module_id,
        titre=data.titre,
        date=data.date,
        heure_debut=data.heure_debut,
        duree_minutes=data.duree_minutes,
        lieu=data.lieu,
        statut=data.statut,
    )
    db.add(sess)
    db.flush()

    for gid in data.group_ids:
        grp = db.get(Groupe, gid)
        if not grp:
            raise HTTPException(
                status_code=404,
                detail=f"Groupe {gid} introuvable",
            )
        db.add(SessionGroup(session_id=sess.id, groupe_id=gid))

    db.commit()
    db.refresh(sess)

    return _build_session_with_groups(db, sess)


# ── 2. get_sessions_for_planning ────────────────────────────────────────

def get_sessions_for_planning(db: Session) -> list[SessionWithGroups]:
    """Return every session with its linked groups and module (admin calendar)."""
    rows = (
        db.execute(select(LmsSession).order_by(LmsSession.date.desc()))
        .scalars()
        .all()
    )
    return [_build_session_with_groups(db, s) for s in rows]


# ── 3. get_sessions_for_apprenant ───────────────────────────────────────

def get_sessions_for_apprenant(
    db: Session,
    apprenant_id: str,
) -> list[SessionWithGroups]:
    """Return sessions where *apprenant_id* belongs to one of the linked groups.

    Join path: sessions → session_groups → groupes → enrollments
    """
    stmt = (
        select(LmsSession)
        .join(SessionGroup, SessionGroup.session_id == LmsSession.id)
        .join(Groupe, Groupe.id == SessionGroup.groupe_id)
        .join(Enrollment, Enrollment.groupe_id == Groupe.id)
        .where(Enrollment.apprenant_id == apprenant_id)
        .distinct()
        .order_by(LmsSession.date.desc())
    )
    rows = db.execute(stmt).scalars().all()
    return [_build_session_with_groups(db, s) for s in rows]


# ── 4. get_apprenants_for_session ───────────────────────────────────────

def get_apprenants_for_session(
    db: Session,
    session_id: uuid.UUID,
) -> list[ApprenantInSession]:
    """Deduplicated list of learners concerned by a session.

    Union of all learners enrolled in any group linked to the session via
    ``session_groups → enrollments``.  Each result carries the group's
    ``type`` as ``enrollment_type`` ('ponctuelle' or 'reconversion').
    """
    sess = db.get(LmsSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")

    stmt = (
        select(
            Enrollment.apprenant_id,
            User.email,
            User.first_name,
            User.last_name,
            Groupe.type.label("enrollment_type"),
        )
        .select_from(SessionGroup)
        .join(Groupe, Groupe.id == SessionGroup.groupe_id)
        .join(Enrollment, Enrollment.groupe_id == Groupe.id)
        .join(User, User.id == Enrollment.apprenant_id)
        .where(SessionGroup.session_id == session_id)
        .distinct(Enrollment.apprenant_id)
    )

    rows = db.execute(stmt).all()
    return [
        ApprenantInSession(
            apprenant_id=r.apprenant_id,
            email=r.email,
            first_name=r.first_name,
            last_name=r.last_name,
            enrollment_type=r.enrollment_type,
        )
        for r in rows
    ]

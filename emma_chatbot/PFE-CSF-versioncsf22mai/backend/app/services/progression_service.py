"""
Service layer for attendance tracking and progression calculation.

Transactions use ``begin_nested()`` savepoints so that a failure inside
one step does not corrupt the rest of the request.  The caller (route
handler) owns the final ``db.commit()``.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session

from app.models.lms import (
    Attendance,
    Enrollment,
    Groupe,
    PackModule,
    PackProgression,
    Progression,
    Session as LmsSession,
    SessionGroup,
)


# ── 1. mark_attendance ──────────────────────────────────────────────────

def mark_attendance(
    db: Session,
    session_id: uuid.UUID,
    apprenant_id: str,
    present: bool,
) -> None:
    """Upsert attendance then recalculate progression for this learner."""
    now = datetime.now(timezone.utc)

    with db.begin_nested():
        att = db.execute(
            select(Attendance).where(
                Attendance.session_id == session_id,
                Attendance.apprenant_id == apprenant_id,
            )
        ).scalar_one_or_none()

        if att:
            att.present = present
            att.marked_at = now
        else:
            db.add(
                Attendance(
                    session_id=session_id,
                    apprenant_id=apprenant_id,
                    present=present,
                    marked_at=now,
                )
            )

    recalculate_progression(db, session_id, apprenant_id)
    db.commit()


# ── 2. recalculate_progression ──────────────────────────────────────────

def recalculate_progression(
    db: Session,
    session_id: uuid.UUID,
    apprenant_id: str,
) -> None:
    """Recalculate progression rows affected by a session/attendance change.

    For each of the learner's enrollments whose group is linked to this
    session:
      * **ponctuelle** → ``progression.minutes_validees`` = SUM of
        ``duree_minutes`` from completed sessions where the learner was
        present.
      * **reconversion** → if *every* completed session of this module
        (within the reconversion group) has ``present=True``, the
        ``pack_progression`` row is set to ``'done'``.  The next module
        is **not** unlocked automatically.
    """
    sess = db.get(LmsSession, session_id)
    if not sess or not sess.module_id:
        return

    module_id = sess.module_id

    enrollments = (
        db.execute(
            select(Enrollment, Groupe.type)
            .join(Groupe, Groupe.id == Enrollment.groupe_id)
            .where(Enrollment.apprenant_id == apprenant_id)
        )
        .all()
    )

    for enrollment, groupe_type in enrollments:
        linked = db.execute(
            select(SessionGroup).where(
                SessionGroup.groupe_id == enrollment.groupe_id,
                SessionGroup.session_id == session_id,
            )
        ).first()
        if not linked:
            continue

        if groupe_type == "ponctuelle":
            _recalc_ponctuelle(db, enrollment, module_id, apprenant_id)
        elif groupe_type == "reconversion":
            _recalc_reconversion(db, enrollment, module_id, apprenant_id)


def _recalc_ponctuelle(
    db: Session,
    enrollment: Enrollment,
    module_id: uuid.UUID,
    apprenant_id: str,
) -> None:
    """Sum validated minutes from completed sessions where present."""
    total = (
        db.execute(
            select(sa_func.coalesce(sa_func.sum(LmsSession.duree_minutes), 0))
            .select_from(LmsSession)
            .join(SessionGroup, SessionGroup.session_id == LmsSession.id)
            .join(
                Attendance,
                and_(
                    Attendance.session_id == LmsSession.id,
                    Attendance.apprenant_id == apprenant_id,
                    Attendance.present.is_(True),
                ),
            )
            .where(
                LmsSession.module_id == module_id,
                SessionGroup.groupe_id == enrollment.groupe_id,
                LmsSession.statut == "terminee",
            )
        )
        .scalar_one()
    )

    with db.begin_nested():
        prog = db.execute(
            select(Progression).where(
                Progression.enrollment_id == enrollment.id,
                Progression.module_id == module_id,
            )
        ).scalar_one_or_none()

        if prog:
            prog.minutes_validees = total
        else:
            db.add(
                Progression(
                    enrollment_id=enrollment.id,
                    module_id=module_id,
                    minutes_validees=total,
                )
            )


def _recalc_reconversion(
    db: Session,
    enrollment: Enrollment,
    module_id: uuid.UUID,
    apprenant_id: str,
) -> None:
    """Sum validated minutes from completed sessions where present,
    and mark as done only when cumulative duration reaches the module total."""
    from app.models.lms import Module

    total_attended = (
        db.execute(
            select(sa_func.coalesce(sa_func.sum(LmsSession.duree_minutes), 0))
            .select_from(LmsSession)
            .join(SessionGroup, SessionGroup.session_id == LmsSession.id)
            .join(
                Attendance,
                and_(
                    Attendance.session_id == LmsSession.id,
                    Attendance.apprenant_id == apprenant_id,
                    Attendance.present.is_(True),
                ),
            )
            .where(
                LmsSession.module_id == module_id,
                SessionGroup.groupe_id == enrollment.groupe_id,
                LmsSession.statut == "terminee",
            )
        )
        .scalar_one()
    )

    module_row = db.get(Module, module_id)
    total_minutes = (module_row.duree_minutes if module_row and module_row.duree_minutes else 0) or 120

    is_done = total_minutes > 0 and total_attended >= total_minutes

    with db.begin_nested():
        pp = db.execute(
            select(PackProgression).where(
                PackProgression.enrollment_id == enrollment.id,
                PackProgression.module_id == module_id,
            )
        ).scalar_one_or_none()

        now = datetime.now(timezone.utc)
        new_statut = "done" if is_done else "open"

        if pp:
            if is_done and pp.statut != "done":
                pp.statut = "done"
                pp.completed_at = now
            elif not is_done and pp.statut == "done":
                pp.statut = "open"
                pp.completed_at = None
        else:
            db.add(
                PackProgression(
                    enrollment_id=enrollment.id,
                    module_id=module_id,
                    statut=new_statut,
                    unlocked_at=now,
                    completed_at=now if is_done else None,
                )
            )


# ── 3. unlock_next_module ───────────────────────────────────────────────

def unlock_next_module(
    db: Session,
    enrollment_id: uuid.UUID,
    current_module_id: uuid.UUID,
) -> None:
    """Admin action: unlock the next module in the pack after *current_module_id*.

    Finds the pack containing ``current_module_id`` via ``pack_modules``,
    locates the next entry by ``ordre``, and flips the corresponding
    ``pack_progression`` row from ``'locked'`` to ``'open'``.
    """
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment introuvable")

    current_pm = db.execute(
        select(PackModule).where(PackModule.module_id == current_module_id)
    ).scalar_one_or_none()

    if not current_pm:
        raise HTTPException(
            status_code=404,
            detail="Module non trouvé dans un pack de reconversion",
        )

    next_pm = db.execute(
        select(PackModule)
        .where(
            PackModule.pack_id == current_pm.pack_id,
            PackModule.ordre > current_pm.ordre,
        )
        .order_by(PackModule.ordre.asc())
        .limit(1)
    ).scalar_one_or_none()

    if not next_pm:
        raise HTTPException(
            status_code=404,
            detail="Aucun module suivant dans ce pack",
        )

    now = datetime.now(timezone.utc)

    with db.begin_nested():
        pp = db.execute(
            select(PackProgression).where(
                PackProgression.enrollment_id == enrollment_id,
                PackProgression.module_id == next_pm.module_id,
            )
        ).scalar_one_or_none()

        if pp:
            if pp.statut == "locked":
                pp.statut = "open"
                pp.unlocked_at = now
        else:
            db.add(
                PackProgression(
                    enrollment_id=enrollment_id,
                    module_id=next_pm.module_id,
                    statut="open",
                    unlocked_at=now,
                )
            )

    db.commit()

"""Service layer for multi-group planning sessions."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.timezones import parse_tunis_datetime_to_utc
from app.persistence.models import (
    ApprenantGroup,
    ApprenantGroupAccess,
    ApprenantGroupMember,
    GroupSession,
    LearnerProgress,
    PlanningAttendance,
    PlanningSession,
    PlanningSessionGroup,
    SessionAttendance,
)

import logging

logger = logging.getLogger(__name__)

def _try_sync_planning_to_google(
    db: Session,
    admin_user_id: str | None,
    planning_session_id: int,
) -> None:
    if not admin_user_id:
        return
    try:
        from app.domains.admin.planning.gcal_service import sync_planning_session_to_google

        sync_planning_session_to_google(db, admin_user_id, planning_session_id)
    except Exception:
        logger.exception(
            "Google Calendar sync failed for planning session %s",
            planning_session_id,
        )


def _serialize_session(session: PlanningSession, db: Session) -> dict:
    groups = (
        db.query(PlanningSessionGroup, ApprenantGroup)
        .join(ApprenantGroup, ApprenantGroup.id == PlanningSessionGroup.group_id)
        .filter(PlanningSessionGroup.session_id == session.id)
        .all()
    )
    group_list = []
    for psg, grp in groups:
        member_count = (
            db.query(func.count(ApprenantGroupMember.id))
            .filter(ApprenantGroupMember.group_id == grp.id)
            .scalar()
        )
        group_list.append({
            "id": grp.id,
            "name": grp.name,
            "format": grp.format,
            "member_count": member_count,
        })
    return {
        "id": session.id,
        "title": session.title,
        "module_target_ref": session.module_target_ref,
        "module_label": session.module_label,
        "date": str(session.date),
        "start_time": session.start_time,
        "duration_minutes": session.duration_minutes,
        "location": session.location,
        "status": session.status,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        "groups": group_list,
    }


def create_planning_session(
    db: Session,
    title: str,
    module_target_ref: str | None,
    module_label: str | None,
    date_str: str,
    start_time: str | None,
    duration_minutes: int,
    location: str | None,
    group_ids: list[int],
    *,
    admin_user_id: str | None = None,
    google_event_id: str | None = None,
) -> dict:
    session = PlanningSession(
        title=title,
        module_target_ref=module_target_ref,
        module_label=module_label,
        date=date.fromisoformat(date_str),
        start_time=start_time,
        duration_minutes=duration_minutes,
        location=location,
        google_event_id=google_event_id,
    )
    db.add(session)
    db.flush()

    for gid in group_ids:
        db.add(PlanningSessionGroup(session_id=session.id, group_id=gid))

    scheduled_at = parse_tunis_datetime_to_utc(date_str, start_time)
    target_kind = None
    if module_target_ref:
        target_kind = "reconversion_module" if "reconversion" in module_target_ref else "ponctuelle_module"
    for gid in group_ids:
        access_id: int | None = None
        if module_target_ref:
            access_row = (
                db.query(ApprenantGroupAccess)
                .filter(
                    ApprenantGroupAccess.group_id == gid,
                    ApprenantGroupAccess.target_ref == module_target_ref,
                )
                .first()
            )
            if access_row:
                access_id = int(access_row.id)
        gs = GroupSession(
            group_id=gid,
            planning_session_id=int(session.id),
            access_id=access_id,
            target_ref=module_target_ref,
            target_kind=target_kind,
            target_label=module_label,
            title=title,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            status="planned",
        )
        db.add(gs)
        db.flush()
        members = (
            db.query(ApprenantGroupMember)
            .filter(ApprenantGroupMember.group_id == gid)
            .all()
        )
        for member in members:
            db.add(SessionAttendance(
                session_id=int(gs.id),
                member_id=int(member.id),
                status="pending",
            ))

    db.commit()
    db.refresh(session)

    if admin_user_id:
        _try_sync_planning_to_google(db, admin_user_id, int(session.id))
        db.refresh(session)

    from app.domains.admin.apprenants.service import (
        _parse_session_module_ref,
        _recompute_member_progress,
        _unlock_module_for_group_members,
    )

    for gid in group_ids:
        unlock_ref = (module_target_ref or "").strip()
        if not unlock_ref:
            grp = db.query(ApprenantGroup).filter(ApprenantGroup.id == gid).first()
            unlock_ref = _parse_session_module_ref(grp.description if grp else None) or ""
        if unlock_ref:
            _unlock_module_for_group_members(db, gid, unlock_ref)
        members = (
            db.query(ApprenantGroupMember)
            .filter(ApprenantGroupMember.group_id == gid)
            .all()
        )
        for member in members:
            _recompute_member_progress(db, member)
    if group_ids:
        db.commit()

    try:
        from app.domains.learner.session_notifications import dispatch_planning_session_notifications

        dispatch_planning_session_notifications(db, int(session.id))
    except Exception:
        logger.exception("Notifications CSF non envoyées pour planning %s", session.id)

    return _serialize_session(session, db)


def create_planning_session_from_google_event(
    db: Session,
    *,
    admin_user_id: str,
    google_event_id: str,
    group_id: int,
    module_target_ref: str,
    module_label: str,
) -> dict:
    from app.domains.admin.planning.gcal_service import (
        get_calendar_event,
        sync_planning_session_to_google,
    )

    existing = (
        db.query(PlanningSession)
        .filter(PlanningSession.google_event_id == google_event_id)
        .first()
    )
    if existing:
        raise ValueError("Cet événement Google est déjà lié à une séance CSF.")

    event = get_calendar_event(db, admin_user_id, google_event_id)
    if not event:
        raise ValueError("Événement Google introuvable ou calendrier non connecté.")

    from app.domains.admin.planning.gcal_service import _parse_google_event_times

    date_str, start_time, duration = _parse_google_event_times(event)
    title = (event.get("summary") or "").strip() or module_label
    location = (event.get("location") or "").strip() or None

    result = create_planning_session(
        db,
        title=title,
        module_target_ref=module_target_ref,
        module_label=module_label,
        date_str=date_str,
        start_time=start_time,
        duration_minutes=duration,
        location=location,
        group_ids=[group_id],
        admin_user_id=None,
        google_event_id=google_event_id,
    )

    session_id = int(result["id"])
    sync_planning_session_to_google(db, admin_user_id, session_id)
    return get_planning_session_detail(db, session_id) or result


def auto_link_planning_from_google(
    db: Session,
    *,
    admin_user_id: str,
    group_id: int,
    module_target_ref: str,
    module_label: str,
    since_iso: str,
    session_label: str | None = None,
    google_event_id: str | None = None,
) -> dict:
    from app.domains.admin.planning.gcal_service import (
        list_calendar_events,
        pick_event_for_auto_link,
    )

    if google_event_id:
        session = create_planning_session_from_google_event(
            db,
            admin_user_id=admin_user_id,
            google_event_id=google_event_id.strip(),
            group_id=group_id,
            module_target_ref=module_target_ref,
            module_label=module_label,
        )
        return {"linked": True, "session": session, "candidates": []}

    since = datetime.fromisoformat(since_iso.replace("Z", "+00:00"))
    if since.tzinfo is None:
        since = since.replace(tzinfo=timezone.utc)

    events = list_calendar_events(
        db,
        admin_user_id,
        days_back=2,
        days_forward=365,
        max_results=50,
        updated_since=since - timedelta(minutes=5),
    )
    pick, candidates = pick_event_for_auto_link(
        events,
        group_id=group_id,
        module_target_ref=module_target_ref,
        module_label=module_label,
        session_label=session_label,
        since=since,
    )
    if not pick:
        return {
            "linked": False,
            "candidateCount": len(candidates),
            "candidates": candidates,
            "message": (
                "Plusieurs événements Google récents : choisissez lequel lier à cette session-module."
                if len(candidates) > 1
                else "Aucun nouvel événement Google détecté. Créez/enregistrez l'événement dans l'agenda connecté, puis synchronisez."
            ),
        }

    session = create_planning_session_from_google_event(
        db,
        admin_user_id=admin_user_id,
        google_event_id=str(pick["id"]),
        group_id=group_id,
        module_target_ref=module_target_ref,
        module_label=module_label,
    )
    return {"linked": True, "session": session, "candidates": []}


def get_planning_sessions(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    q = db.query(PlanningSession)
    if date_from:
        q = q.filter(PlanningSession.date >= date_from)
    if date_to:
        q = q.filter(PlanningSession.date <= date_to)
    q = q.order_by(PlanningSession.date.asc(), PlanningSession.id.asc())
    sessions = q.all()
    return [_serialize_session(s, db) for s in sessions]


def get_planning_session_detail(db: Session, session_id: int) -> dict | None:
    session = db.query(PlanningSession).filter(PlanningSession.id == session_id).first()
    if not session:
        return None
    return _serialize_session(session, db)


def get_session_attendees(db: Session, session_id: int) -> list[dict]:
    group_links = (
        db.query(PlanningSessionGroup)
        .filter(PlanningSessionGroup.session_id == session_id)
        .all()
    )
    group_ids = [gl.group_id for gl in group_links]
    if not group_ids:
        return []

    members = (
        db.query(ApprenantGroupMember, ApprenantGroup)
        .join(ApprenantGroup, ApprenantGroup.id == ApprenantGroupMember.group_id)
        .filter(ApprenantGroupMember.group_id.in_(group_ids))
        .all()
    )

    attendance_map: dict[int, bool | None] = {}
    attendance_rows = (
        db.query(PlanningAttendance)
        .filter(PlanningAttendance.session_id == session_id)
        .all()
    )
    for att in attendance_rows:
        attendance_map[att.member_id] = att.present

    seen: set[int] = set()
    result = []
    for member, group in members:
        if member.id in seen:
            continue
        seen.add(member.id)
        result.append({
            "member_id": member.id,
            "email": member.email,
            "first_name": member.first_name,
            "last_name": member.last_name,
            "group_name": group.name,
            "group_format": group.format,
            "present": attendance_map.get(member.id),
        })
    return result


def save_attendance(db: Session, session_id: int, records: list[dict]) -> None:
    now = datetime.now(timezone.utc)
    for rec in records:
        existing = (
            db.query(PlanningAttendance)
            .filter(
                PlanningAttendance.session_id == session_id,
                PlanningAttendance.member_id == rec["member_id"],
            )
            .first()
        )
        if existing:
            existing.present = rec["present"]
            existing.marked_at = now
        else:
            db.add(PlanningAttendance(
                session_id=session_id,
                member_id=rec["member_id"],
                present=rec["present"],
                marked_at=now,
            ))

    _sync_planning_to_group(db, session_id, records)

    db.commit()
    _recompute_group_members_from_planning(db, session_id)


def _sync_planning_to_group(
    db: Session, planning_session_id: int, records: list[dict]
) -> None:
    """Mirror PlanningAttendance changes into SessionAttendance."""
    group_sessions = (
        db.query(GroupSession)
        .filter(GroupSession.planning_session_id == planning_session_id)
        .all()
    )
    if not group_sessions:
        return

    for gs in group_sessions:
        has_present = False
        for rec in records:
            sa = (
                db.query(SessionAttendance)
                .filter(
                    SessionAttendance.session_id == int(gs.id),
                    SessionAttendance.member_id == rec["member_id"],
                )
                .first()
            )
            new_status = "present" if rec["present"] else "absent"
            if sa:
                sa.status = new_status
            else:
                db.add(SessionAttendance(
                    session_id=int(gs.id),
                    member_id=rec["member_id"],
                    status=new_status,
                ))
            if rec["present"]:
                has_present = True

        if has_present and gs.status == "planned":
            gs.status = "completed"


def _recompute_group_members_from_planning(
    db: Session, planning_session_id: int
) -> None:
    """After syncing attendance, recompute progress using the apprenants engine."""
    from app.domains.admin.apprenants.service import _recompute_member_progress

    group_sessions = (
        db.query(GroupSession)
        .filter(GroupSession.planning_session_id == planning_session_id)
        .all()
    )
    seen_members: set[int] = set()
    for gs in group_sessions:
        members = (
            db.query(ApprenantGroupMember)
            .filter(ApprenantGroupMember.group_id == int(gs.group_id))
            .all()
        )
        for m in members:
            if int(m.id) not in seen_members:
                seen_members.add(int(m.id))
                _recompute_member_progress(db, m)
    if seen_members:
        db.commit()


def recalculate_progression_for_session(db: Session, session_id: int) -> None:
    """Progression module = séances passées (pas la présence Excel / planning)."""
    _recompute_group_members_from_planning(db, session_id)


def unlock_next_module(db: Session, member_id: int, target_ref: str) -> dict:
    progress = (
        db.query(LearnerProgress)
        .filter(
            LearnerProgress.member_id == member_id,
            LearnerProgress.target_ref == target_ref,
        )
        .first()
    )
    if not progress:
        return {"error": "not_found"}

    progress.locked = False
    progress.opened_by_admin = True
    db.commit()
    db.refresh(progress)

    return {
        "id": progress.id,
        "member_id": progress.member_id,
        "target_ref": progress.target_ref,
        "title": progress.title,
        "locked": progress.locked,
        "opened_by_admin": progress.opened_by_admin,
        "progress_percent": progress.progress_percent,
        "status": progress.status,
    }


def add_group_to_planning_session(
    db: Session,
    session_id: int,
    group_id: int,
    *,
    admin_user_id: str | None = None,
) -> dict | None:
    session = db.query(PlanningSession).filter(PlanningSession.id == session_id).first()
    if not session:
        return None
    existing = (
        db.query(PlanningSessionGroup)
        .filter(PlanningSessionGroup.session_id == session_id, PlanningSessionGroup.group_id == group_id)
        .first()
    )
    if not existing:
        db.add(PlanningSessionGroup(session_id=session_id, group_id=group_id))
        db.commit()
    db.refresh(session)

    if admin_user_id:
        _try_sync_planning_to_google(db, admin_user_id, int(session.id))

    return _serialize_session(session, db)


def remove_group_from_planning_session(
    db: Session,
    session_id: int,
    group_id: int,
    *,
    admin_user_id: str | None = None,
) -> dict | None:
    session = db.query(PlanningSession).filter(PlanningSession.id == session_id).first()
    if not session:
        return None
    link = (
        db.query(PlanningSessionGroup)
        .filter(PlanningSessionGroup.session_id == session_id, PlanningSessionGroup.group_id == group_id)
        .first()
    )
    if link:
        db.delete(link)
        db.commit()
    db.refresh(session)

    if admin_user_id:
        _try_sync_planning_to_google(db, admin_user_id, int(session.id))

    return _serialize_session(session, db)


def patch_planning_session(
    db: Session,
    session_id: int,
    body: dict,
    *,
    admin_user_id: str | None = None,
) -> dict | None:
    session = db.query(PlanningSession).filter(PlanningSession.id == session_id).first()
    if not session:
        return None

    allowed_fields = {"title", "date", "start_time", "duration_minutes", "location", "status"}
    for key, value in body.items():
        if key in allowed_fields and value is not None:
            if key == "date":
                setattr(session, key, date.fromisoformat(value))
            else:
                setattr(session, key, value)

    group_sessions = (
        db.query(GroupSession)
        .filter(GroupSession.planning_session_id == session_id)
        .all()
    )
    if group_sessions:
        date_str = session.date.isoformat()
        scheduled_at = parse_tunis_datetime_to_utc(date_str, session.start_time)
        for gs in group_sessions:
            gs.scheduled_at = scheduled_at
            gs.duration_minutes = int(session.duration_minutes or gs.duration_minutes or 0)
            gs.title = session.title
            if session.status:
                gs.status = session.status

    db.commit()
    db.refresh(session)

    if admin_user_id:
        _try_sync_planning_to_google(db, admin_user_id, int(session.id))
        db.refresh(session)

    _recompute_group_members_from_planning(db, session_id)

    return _serialize_session(session, db)


def delete_planning_session(
    db: Session,
    session_id: int,
    *,
    admin_user_id: str | None = None,
) -> bool:
    session = db.query(PlanningSession).filter(PlanningSession.id == session_id).first()
    if not session:
        return False
    if session.status != "planned":
        return False

    if admin_user_id and session.google_event_id:
        try:
            from app.domains.admin.planning.gcal_service import delete_session_from_google

            delete_session_from_google(db, admin_user_id, session)
        except Exception:
            logger.exception("Google Calendar delete failed session %s", session.id)

    db.delete(session)
    db.commit()
    return True

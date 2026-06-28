from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func

from app.core.auth_deps import StaffUser
from app.domains.admin.journal.service import log_action
from app.core.config import settings
from app.domains.admin.planning import gcal_service
from app.core.dependencies import Db
from app.domains.admin.apprenants import schemas as appr_sch
from app.domains.admin.apprenants.service import delete_session, get_group, patch_session
from app.domains.admin.planning import schemas as sch
from app.domains.admin.planning.session_service import (
    add_group_to_planning_session,
    create_planning_session,
    auto_link_planning_from_google,
    create_planning_session_from_google_event,
    delete_planning_session,
    get_planning_session_detail,
    get_planning_sessions,
    get_session_attendees,
    patch_planning_session,
    remove_group_from_planning_session,
    save_attendance,
    unlock_next_module,
)
from app.persistence.models import (
    AdminPlanningReminderRule,
    ApprenantGroup,
    ApprenantGroupMember,
    GroupSession,
    PonctuelleModule,
    ReconversionPackModule,
    SessionAttendance,
)

router = APIRouter()


@router.get("/gcal/status")
def gcal_status(admin: StaffUser, db: Db) -> dict:
    configured = bool(settings.google_client_id and settings.google_client_secret)
    if not configured:
        return {
            "connected": False,
            "configured": False,
            "calendarId": None,
            "embedUrl": None,
            "openUrl": gcal_service.build_open_url(),
            "redirectUri": settings.google_calendar_redirect_uri,
        }
    try:
        view = gcal_service.get_connection_view(
            db,
            admin.id,
            fallback_email=admin.email,
        )
    except Exception:
        if gcal_service.is_google_calendar_connected(db, admin.id):
            cal_id = (admin.email or "").strip() or "primary"
            view = {
                "connected": True,
                "calendarId": cal_id,
                "embedUrl": gcal_service.build_embed_url(cal_id),
                "openUrl": gcal_service.build_open_url(),
            }
        else:
            view = {"connected": False, "calendarId": None, "embedUrl": None}
    return {
        "configured": True,
        "connected": bool(view.get("connected")),
        "calendarId": view.get("calendarId"),
        "embedUrl": view.get("embedUrl"),
        "openUrl": view.get("openUrl") or gcal_service.build_open_url(),
        "redirectUri": settings.google_calendar_redirect_uri,
    }


@router.get("/gcal/auth-url")
def gcal_auth_url(admin: StaffUser) -> dict:
    try:
        url = gcal_service.get_google_auth_url(admin.id, return_to="admin")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"url": url, "redirectUri": settings.google_calendar_redirect_uri}


@router.delete("/gcal/disconnect")
def gcal_disconnect(admin: StaffUser, db: Db) -> dict:
    gcal_service.disconnect_google_calendar(db, admin.id)
    return {"ok": True}


@router.get("/gcal/events")
def gcal_list_events(
    admin: StaffUser,
    db: Db,
    days_back: int = Query(7, ge=0, le=30),
    days_forward: int = Query(90, ge=1, le=365),
) -> dict:
    if not gcal_service.is_google_calendar_connected(db, admin.id):
        raise HTTPException(status_code=400, detail="Google Calendar non connecté.")
    items = gcal_service.list_calendar_events(
        db,
        admin.id,
        days_back=days_back,
        days_forward=days_forward,
    )
    return {"items": items}


@router.post("/gcal/auto-link")
def gcal_auto_link(
    admin: StaffUser,
    db: Db,
    body: sch.AutoLinkGoogleEventBody,
) -> dict:
    if not gcal_service.is_google_calendar_connected(db, admin.id):
        raise HTTPException(status_code=400, detail="Google Calendar non connecté.")
    try:
        return auto_link_planning_from_google(
            db,
            admin_user_id=admin.id,
            group_id=body.group_id,
            module_target_ref=body.module_target_ref,
            module_label=body.module_label,
            since_iso=body.since,
            session_label=body.session_label,
            google_event_id=body.google_event_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/multi-sessions/from-google-event")
def import_multi_session_from_google(
    admin: StaffUser,
    db: Db,
    body: sch.ImportGoogleEventBody,
) -> dict:
    if not gcal_service.is_google_calendar_connected(db, admin.id):
        raise HTTPException(status_code=400, detail="Google Calendar non connecté.")
    try:
        return create_planning_session_from_google_event(
            db,
            admin_user_id=admin.id,
            google_event_id=body.google_event_id.strip(),
            group_id=body.group_id,
            module_target_ref=body.module_target_ref,
            module_label=body.module_label,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _ensure_default_rules(db: Db) -> list[AdminPlanningReminderRule]:
    rows = db.query(AdminPlanningReminderRule).order_by(AdminPlanningReminderRule.id.asc()).all()
    if rows:
        return rows
    defaults = [
        AdminPlanningReminderRule(
            label="Rappel principal",
            enabled=True,
            hours_before=24,
            channel_email=True,
            channel_sms=True,
        ),
        AdminPlanningReminderRule(
            label="Rappel de dernière minute",
            enabled=True,
            hours_before=2,
            channel_email=True,
            channel_sms=False,
        ),
    ]
    for row in defaults:
        db.add(row)
    db.commit()
    return db.query(AdminPlanningReminderRule).order_by(AdminPlanningReminderRule.id.asc()).all()


def _serialize_rule(row: AdminPlanningReminderRule) -> dict:
    return {
        "id": str(row.id),
        "label": row.label,
        "enabled": bool(row.enabled),
        "hoursBefore": int(row.hours_before or 24),
        "channels": {
            "email": bool(row.channel_email),
            "sms": bool(row.channel_sms),
        },
    }


def _serialize_session_item(session: GroupSession, db: Db) -> dict:
    scheduled = session.scheduled_at.astimezone(timezone.utc) if session.scheduled_at.tzinfo else session.scheduled_at
    group = get_group(db, int(session.group_id))
    end_dt = scheduled + timedelta(minutes=int(session.duration_minutes or 0))
    return {
        "id": str(session.id),
        "groupId": str(session.group_id),
        "title": session.title,
        "groupLabel": group.name,
        "targetLabel": session.target_label,
        "scheduledAt": session.scheduled_at,
        "dateISO": scheduled.strftime("%Y-%m-%d"),
        "startTime": scheduled.strftime("%H:%M"),
        "endTime": end_dt.strftime("%H:%M"),
        "durationMinutes": int(session.duration_minutes or 0),
        "status": session.status,
    }


def _digest_for_date(db: Db, target_date: date, rules: list[AdminPlanningReminderRule]) -> dict:
    active_rules = [rule for rule in rules if rule.enabled]
    day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time.max, tzinfo=timezone.utc)
    recipients = (
        db.query(SessionAttendance)
        .join(GroupSession, GroupSession.id == SessionAttendance.session_id)
        .filter(
            GroupSession.scheduled_at >= day_start,
            GroupSession.scheduled_at <= day_end,
            GroupSession.status != "cancelled",
        )
        .count()
    )
    expected_runs = recipients * max(1, len(active_rules)) if recipients else 0
    return {
        "dateISO": target_date.isoformat(),
        "expectedRuns": expected_runs,
        "completedRuns": expected_runs,
        "failedRuns": 0,
    }


@router.get("", response_model=sch.PlanningOverviewResponse)
def planning_index(
    _admin: StaffUser,
    db: Db,
    startDate: date | None = Query(None),
    endDate: date | None = Query(None),
    date: date | None = Query(None),
) -> sch.PlanningOverviewResponse:
    target_date = date or datetime.now(timezone.utc).date()
    start_date = startDate or target_date.replace(day=1)
    if endDate:
        end_date = endDate
    else:
        next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
        end_date = next_month - timedelta(days=1)
    range_start = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    range_end = datetime.combine(end_date, time.max, tzinfo=timezone.utc)
    sessions = (
        db.query(GroupSession)
        .filter(GroupSession.scheduled_at >= range_start, GroupSession.scheduled_at <= range_end)
        .order_by(GroupSession.scheduled_at.asc(), GroupSession.id.asc())
        .all()
    )
    rules = _ensure_default_rules(db)
    return sch.PlanningOverviewResponse(
        dateISO=target_date.isoformat(),
        sessions=[sch.PlanningSessionItem.model_validate(_serialize_session_item(session, db)) for session in sessions],
        rules=[sch.ReminderRuleDto.model_validate(_serialize_rule(rule)) for rule in rules],
        digest=sch.DailyNotificationDigestDto.model_validate(_digest_for_date(db, target_date, rules)),
    )


@router.put("/reminders", response_model=sch.ReminderRulesMutationResponse)
def planning_reminders_replace(
    _admin: StaffUser,
    db: Db,
    body: sch.ReminderRulesPatchBody,
) -> sch.ReminderRulesMutationResponse:
    (
        db.query(AdminPlanningReminderRule)
        .delete(synchronize_session=False)
    )
    for item in body.rules:
        db.add(
            AdminPlanningReminderRule(
                label=item.label.strip(),
                enabled=item.enabled,
                hours_before=item.hoursBefore,
                channel_email=item.channels.email,
                channel_sms=item.channels.sms,
            )
        )
    db.commit()
    rows = db.query(AdminPlanningReminderRule).order_by(AdminPlanningReminderRule.id.asc()).all()
    return sch.ReminderRulesMutationResponse(
        rules=[sch.ReminderRuleDto.model_validate(_serialize_rule(row)) for row in rows]
    )


@router.patch("/sessions/{session_id}", response_model=sch.PlanningSessionItem)
def planning_session_patch(
    admin: StaffUser,
    db: Db,
    session_id: int,
    body: appr_sch.GroupSessionPatchBody,
) -> sch.PlanningSessionItem:
    patch_session(db, session_id, body)
    session = db.query(GroupSession).filter(GroupSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable après mise à jour.")
    log_action(
        db,
        admin,
        "Séance modifiée (planning)",
        f"Session #{session_id}",
        entity_kind="session",
        entity_id=str(session_id),
    )
    db.commit()
    return sch.PlanningSessionItem.model_validate(_serialize_session_item(session, db))


@router.delete("/sessions/{session_id}", response_model=appr_sch.DeleteResponse)
def planning_session_delete(admin: StaffUser, db: Db, session_id: int) -> appr_sch.DeleteResponse:
    delete_session(db, session_id)
    log_action(
        db,
        admin,
        "Séance supprimée (planning)",
        f"Session #{session_id}",
        entity_kind="session",
        entity_id=str(session_id),
    )
    db.commit()
    return appr_sch.DeleteResponse()


# ──────────────────────────────────────────────────────────────────────────────
# Multi-group planning session endpoints
# ──────────────────────────────────────────────────────────────────────────────


@router.get("/multi-sessions/modules")
def list_available_modules(_admin: StaffUser, db: Db) -> dict:
    ponctuelle = (
        db.query(PonctuelleModule)
        .order_by(PonctuelleModule.sort_order.asc(), PonctuelleModule.id.asc())
        .all()
    )
    reconversion = (
        db.query(ReconversionPackModule)
        .order_by(ReconversionPackModule.sort_order.asc(), ReconversionPackModule.id.asc())
        .all()
    )

    seen_reconv: set[str] = set()
    reconv_list = []
    for m in reconversion:
        if m.title in seen_reconv:
            continue
        seen_reconv.add(m.title)
        reconv_list.append({
            "id": m.id,
            "title": m.title,
            "ref": f"reconversion_pack_module:{m.id}",
        })

    return {
        "ponctuelle": [
            {"id": p.id, "title": p.title, "ref": f"ponctuelle_module:{p.id}"}
            for p in ponctuelle
        ],
        "reconversion": reconv_list,
    }


@router.get("/multi-sessions/groups")
def list_active_groups(_admin: StaffUser, db: Db) -> list[dict]:
    groups = (
        db.query(ApprenantGroup)
        .filter(ApprenantGroup.status != "archived")
        .order_by(ApprenantGroup.name.asc())
        .all()
    )
    result = []
    for g in groups:
        member_count = (
            db.query(func.count(ApprenantGroupMember.id))
            .filter(ApprenantGroupMember.group_id == g.id)
            .scalar()
        )
        result.append({
            "id": g.id,
            "name": g.name,
            "format": g.format,
            "member_count": member_count,
        })
    return result


@router.post("/multi-sessions")
def create_multi_session(
    admin: StaffUser,
    db: Db,
    body: sch.PlanningSessionCreate,
) -> dict:
    if not body.group_ids:
        raise HTTPException(status_code=400, detail="Au moins un groupe requis.")
    result = create_planning_session(
        db,
        title=body.title,
        module_target_ref=body.module_target_ref,
        module_label=body.module_label,
        date_str=body.date,
        start_time=body.start_time,
        duration_minutes=body.duration_minutes,
        location=body.location,
        group_ids=body.group_ids,
        admin_user_id=admin.id,
    )
    log_action(db, admin, "Séance planifiée", f"{body.title}", entity_kind="session")
    db.commit()
    return result


@router.get("/multi-sessions")
def list_multi_sessions(
    _admin: StaffUser,
    db: Db,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
) -> list[dict]:
    return get_planning_sessions(db, date_from=date_from, date_to=date_to)


@router.get("/multi-sessions/{session_id}")
def get_multi_session_detail(
    _admin: StaffUser,
    db: Db,
    session_id: int,
) -> dict:
    detail = get_planning_session_detail(db, session_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Session introuvable.")
    return detail


@router.post("/multi-sessions/{session_id}/resync-google")
def resync_multi_session_google(
    admin: StaffUser,
    db: Db,
    session_id: int,
) -> dict:
    """Renvoie les invitations Google aux apprenants de la séance."""
    if not gcal_service.is_google_calendar_connected(db, admin.id):
        raise HTTPException(status_code=400, detail="Google Calendar non connecté.")
    event_id = gcal_service.sync_planning_session_to_google(db, admin.id, session_id)
    if not event_id:
        raise HTTPException(
            status_code=400,
            detail="Synchronisation impossible (séance introuvable ou calendrier non lié).",
        )
    detail = get_planning_session_detail(db, session_id)
    return {"ok": True, "googleEventId": event_id, "session": detail}


@router.patch("/multi-sessions/{session_id}")
def patch_multi_session(
    admin: StaffUser,
    db: Db,
    session_id: int,
    body: sch.PlanningSessionPatch,
) -> dict:
    result = patch_planning_session(
        db,
        session_id,
        body.model_dump(exclude_none=True),
        admin_user_id=admin.id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session introuvable.")
    log_action(
        db,
        admin,
        "Séance modifiée",
        f"Session #{session_id}",
        entity_kind="session",
        entity_id=str(session_id),
    )
    db.commit()
    return result


@router.delete("/multi-sessions/{session_id}")
def delete_multi_session(
    admin: StaffUser,
    db: Db,
    session_id: int,
) -> dict:
    success = delete_planning_session(db, session_id, admin_user_id=admin.id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Suppression impossible (session introuvable ou statut != planned).",
        )
    log_action(
        db,
        admin,
        "Séance supprimée",
        f"Session #{session_id}",
        entity_kind="session",
        entity_id=str(session_id),
    )
    db.commit()
    return {"ok": True}


@router.post("/multi-sessions/{session_id}/groups")
def add_group_to_session(
    admin: StaffUser,
    db: Db,
    session_id: int,
    body: sch.AddGroupBody,
) -> dict:
    import logging
    logging.info("add_group_to_session: session_id=%s group_id=%s", session_id, body.group_id)
    try:
        result = add_group_to_planning_session(
            db, session_id, body.group_id, admin_user_id=admin.id
        )
    except Exception as exc:
        logging.exception("add_group_to_session FAILED")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="Session introuvable.")
    return result


@router.delete("/multi-sessions/{session_id}/groups/{group_id}")
def remove_group_from_session(
    admin: StaffUser,
    db: Db,
    session_id: int,
    group_id: int,
) -> dict:
    result = remove_group_from_planning_session(
        db, session_id, group_id, admin_user_id=admin.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session introuvable.")
    return result


@router.get("/multi-sessions/{session_id}/attendees")
def list_session_attendees(
    _admin: StaffUser,
    db: Db,
    session_id: int,
) -> list[dict]:
    return get_session_attendees(db, session_id)


@router.post("/multi-sessions/{session_id}/attendance")
def save_session_attendance(
    _admin: StaffUser,
    db: Db,
    session_id: int,
    body: sch.AttendanceSaveBody,
) -> dict:
    save_attendance(db, session_id, [r.model_dump() for r in body.records])
    return {"ok": True}


@router.post("/multi-sessions/unlock-module")
def unlock_module_endpoint(
    _admin: StaffUser,
    db: Db,
    body: sch.UnlockModuleBody,
) -> dict:
    result = unlock_next_module(db, body.member_id, body.target_ref)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Progression introuvable pour ce membre/module.")
    return result


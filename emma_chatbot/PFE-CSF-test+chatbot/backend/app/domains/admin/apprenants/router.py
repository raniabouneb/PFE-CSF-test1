from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from sqlalchemy import func

from app.core.auth_deps import StaffUser
from app.core.dependencies import Db
from app.core.timezones import parse_tunis_datetime_to_utc
from app.domains.admin.journal.service import log_action
from app.domains.admin.apprenants import schemas as sch

logger = logging.getLogger(__name__)
from app.domains.admin.apprenants.excel_import import parse_excel_file
from app.domains.admin.apprenants.service import (
    _opt_text,
    _recompute_member_progress,
    _serialize_session,
    add_member_to_module_session,
    create_access,
    create_enrollment,
    create_group,
    create_member,
    create_member_note,
    create_module_session,
    create_session,
    delete_access,
    delete_enrollment,
    delete_module_session,
    delete_group,
    delete_member,
    delete_session,
    ensure_member_progress_rows,
    get_filters_and_kpis,
    get_group_detail,
    get_member_profile,
    get_member_attendance_history,
    list_active_enrollments,
    list_enrolled_members_for_target,
    list_enrollments,
    list_pack_modules_for_enrollment,
    list_groups,
    list_module_session_members,
    list_module_sessions,
    normalize_email,
    patch_group,
    patch_member,
    patch_member_certifications,
    patch_member_progress,
    patch_session,
    patch_session_attendance,
    remove_member_from_module_session,
)
from app.persistence.models import ApprenantGroup, ApprenantGroupMember, GroupSession, SessionAttendance, User

router = APIRouter()


@router.get("/filters", response_model=sch.ApprenantsFiltersResponse)
def apprenants_filters(_admin: StaffUser, db: Db) -> sch.ApprenantsFiltersResponse:
    return sch.ApprenantsFiltersResponse.model_validate(get_filters_and_kpis(db))


@router.get("/groups", response_model=sch.GroupListResponse)
def apprenants_groups(
    _admin: StaffUser,
    db: Db,
    format: str | None = Query(None),
    reconversionTopicSlug: str | None = Query(None),
    ponctuelleFormationSlug: str | None = Query(None),
    reconversionPackId: str | None = Query(None),
) -> sch.GroupListResponse:
    items = list_groups(
        db,
        format_filter=format,
        reconversion_topic_slug=reconversionTopicSlug,
        ponctuelle_formation_slug=ponctuelleFormationSlug,
        reconversion_pack_id=reconversionPackId,
    )
    return sch.GroupListResponse(items=[sch.GroupSummary.model_validate(item) for item in items])


@router.post("/groups", response_model=sch.GroupMutationResponse)
def apprenants_group_create(
    admin: StaffUser,
    db: Db,
    body: sch.GroupCreateBody,
) -> sch.GroupMutationResponse:
    group = create_group(db, body)
    log_action(
        db,
        admin,
        "Groupe créé",
        body.name if hasattr(body, "name") else "Nouveau groupe",
        entity_kind="group",
    )
    db.commit()
    return sch.GroupMutationResponse(group=sch.GroupSummary.model_validate(group))


@router.get("/groups/{group_id}", response_model=sch.GroupDetailResponse)
def apprenants_group_detail(_admin: StaffUser, db: Db, group_id: int) -> sch.GroupDetailResponse:
    return sch.GroupDetailResponse(data=sch.GroupDetailDto.model_validate(get_group_detail(db, group_id)))


@router.patch("/groups/{group_id}", response_model=sch.GroupMutationResponse)
def apprenants_group_patch(
    _admin: StaffUser,
    db: Db,
    group_id: int,
    body: sch.GroupPatchBody,
) -> sch.GroupMutationResponse:
    return sch.GroupMutationResponse(group=sch.GroupSummary.model_validate(patch_group(db, group_id, body)))


@router.delete("/groups/{group_id}", response_model=sch.DeleteResponse)
def apprenants_group_delete(_admin: StaffUser, db: Db, group_id: int) -> sch.DeleteResponse:
    delete_group(db, group_id)
    return sch.DeleteResponse()


@router.post("/groups/{group_id}/members", response_model=sch.GroupMemberMutationResponse)
def apprenants_group_member_create(
    admin: StaffUser,
    db: Db,
    group_id: int,
    body: sch.GroupMemberCreateBody,
) -> sch.GroupMemberMutationResponse:
    member = create_member(db, group_id, body)
    log_action(
        db,
        admin,
        "Apprenant ajouté",
        f"{body.email if hasattr(body, 'email') else ''} — Groupe #{group_id}",
        entity_kind="member",
    )
    db.commit()
    return sch.GroupMemberMutationResponse(member=sch.GroupMemberDto.model_validate(member))


@router.patch("/groups/{group_id}/members/{member_id}", response_model=sch.GroupMemberMutationResponse)
def apprenants_group_member_patch(
    _admin: StaffUser,
    db: Db,
    group_id: int,
    member_id: int,
    body: sch.GroupMemberPatchBody,
) -> sch.GroupMemberMutationResponse:
    _ = group_id
    return sch.GroupMemberMutationResponse(member=sch.GroupMemberDto.model_validate(patch_member(db, member_id, body)))


@router.delete("/groups/{group_id}/members/{member_id}", response_model=sch.DeleteResponse)
def apprenants_group_member_delete(
    admin: StaffUser, db: Db, group_id: int, member_id: int
) -> sch.DeleteResponse:
    delete_member(db, member_id)
    log_action(
        db,
        admin,
        "Apprenant supprimé",
        f"Membre #{member_id} — Groupe #{group_id}",
        entity_kind="member",
        entity_id=str(member_id),
    )
    db.commit()
    return sch.DeleteResponse()


@router.post("/groups/{group_id}/access", response_model=sch.GroupAccessMutationResponse)
def apprenants_group_access_create(
    _admin: StaffUser,
    db: Db,
    group_id: int,
    body: sch.GroupAccessCreateBody,
) -> sch.GroupAccessMutationResponse:
    return sch.GroupAccessMutationResponse(access=sch.GroupAccessDto.model_validate(create_access(db, group_id, body)))


@router.delete("/groups/{group_id}/access/{access_id}", response_model=sch.DeleteResponse)
def apprenants_group_access_delete(_admin: StaffUser, db: Db, group_id: int, access_id: int) -> sch.DeleteResponse:
    delete_access(db, group_id, access_id)
    return sch.DeleteResponse()


@router.post("/groups/{group_id}/sessions", response_model=sch.GroupSessionMutationResponse)
def apprenants_group_session_create(
    admin: StaffUser,
    db: Db,
    group_id: int,
    body: sch.GroupSessionCreateBody,
) -> sch.GroupSessionMutationResponse:
    session = create_session(db, group_id, body)
    log_action(db, admin, "Séance créée", f"Groupe #{group_id}", entity_kind="session")
    db.commit()
    return sch.GroupSessionMutationResponse(session=sch.GroupSessionDto.model_validate(session))


@router.patch("/sessions/{session_id}", response_model=sch.GroupSessionMutationResponse)
def apprenants_session_patch(
    _admin: StaffUser,
    db: Db,
    session_id: int,
    body: sch.GroupSessionPatchBody,
) -> sch.GroupSessionMutationResponse:
    return sch.GroupSessionMutationResponse(session=sch.GroupSessionDto.model_validate(patch_session(db, session_id, body)))


@router.delete("/sessions/{session_id}", response_model=sch.DeleteResponse)
def apprenants_session_delete(
    admin: StaffUser,
    db: Db,
    session_id: int,
) -> sch.DeleteResponse:
    delete_session(db, session_id)
    log_action(
        db,
        admin,
        "Séance supprimée",
        f"Session #{session_id}",
        entity_kind="session",
        entity_id=str(session_id),
    )
    db.commit()
    return sch.DeleteResponse(ok=True)


@router.patch("/sessions/{session_id}/attendance", response_model=sch.SessionAttendanceMutationResponse)
def apprenants_session_attendance_patch(
    _admin: StaffUser,
    db: Db,
    session_id: int,
    body: sch.SessionAttendancePatchBody,
) -> sch.SessionAttendanceMutationResponse:
    return sch.SessionAttendanceMutationResponse(session=sch.GroupSessionDto.model_validate(patch_session_attendance(db, session_id, body)))


@router.post("/sessions/{session_id}/attendance/import", response_model=sch.AttendanceImportPreview)
async def import_attendance_preview(
    _admin: StaffUser,
    db: Db,
    session_id: int,
    file: UploadFile = File(...),
) -> sch.AttendanceImportPreview:
    session = db.query(GroupSession).filter(GroupSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable.")
    members = db.query(ApprenantGroupMember).filter(ApprenantGroupMember.group_id == session.group_id).all()
    member_emails = {(m.email or "").strip().lower() for m in members}
    file_bytes = await file.read()
    try:
        rows = parse_excel_file(file_bytes, member_emails)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fichier Excel invalide : {e}") from e
    found = sum(1 for r in rows if r["resolution"] == "found")
    new = sum(1 for r in rows if r["resolution"] == "new")
    errors = sum(1 for r in rows if r["resolution"] == "error")
    return sch.AttendanceImportPreview(
        rows=[sch.ImportRow.model_validate(r) for r in rows],
        foundCount=found,
        newCount=new,
        errorCount=errors,
    )


@router.post("/sessions/{session_id}/attendance/import/confirm", response_model=sch.SessionAttendanceMutationResponse)
def import_attendance_confirm(
    _admin: StaffUser,
    db: Db,
    session_id: int,
    body: sch.AttendanceImportConfirmBody,
) -> sch.SessionAttendanceMutationResponse:
    session = db.query(GroupSession).filter(GroupSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable.")

    members = db.query(ApprenantGroupMember).filter(ApprenantGroupMember.group_id == session.group_id).all()
    member_by_email = {(m.email or "").strip().lower(): m for m in members}
    affected_members: list[ApprenantGroupMember] = []

    for row in body.rows:
        email_key = normalize_email(row.email)
        member = member_by_email.get(email_key)

        if member is None and row.createIfNew:
            user = db.query(User).filter(func.lower(User.email) == email_key).first()
            member = ApprenantGroupMember(
                group_id=session.group_id,
                email=email_key,
                email_normalized=email_key,
                user_id=user.id if user else None,
                first_name=_opt_text(user.first_name) if user else None,
                last_name=_opt_text(user.last_name) if user else None,
                status="active" if user else "pending",
                linked_at=datetime.now(timezone.utc) if user else None,
            )
            db.add(member)
            db.flush()
            # Crée SessionAttendance pending pour toutes les séances SAUF la séance courante
            # (la séance courante sera gérée par l'upsert juste après)
            for gs in db.query(GroupSession).filter(
                GroupSession.group_id == session.group_id,
                GroupSession.id != session_id,
            ).all():
                db.add(
                    SessionAttendance(
                        session_id=int(gs.id),
                        member_id=int(member.id),
                        status="pending",
                    )
                )
            member_by_email[email_key] = member
            ensure_member_progress_rows(db, member)

        if member is None:
            continue

        attendance = (
            db.query(SessionAttendance)
            .filter(
                SessionAttendance.session_id == session_id,
                SessionAttendance.member_id == int(member.id),
            )
            .first()
        )
        if attendance:
            attendance.status = row.statut
        else:
            db.add(
                SessionAttendance(
                    session_id=session_id,
                    member_id=int(member.id),
                    status=row.statut,
                )
            )

        if member not in affected_members:
            affected_members.append(member)

    db.flush()
    if (
        db.query(SessionAttendance)
        .filter(
            SessionAttendance.session_id == session_id,
            SessionAttendance.status == "present",
        )
        .first()
        and session.status == "planned"
    ):
        session.status = "completed"

    for member in affected_members:
        _recompute_member_progress(db, member)

    db.commit()
    db.refresh(session)
    return sch.SessionAttendanceMutationResponse(
        session=sch.GroupSessionDto.model_validate(_serialize_session(session, db))
    )


@router.post("/groups/{group_id}/attendance/import", response_model=sch.GlobalAttendanceImportPreview)
async def global_import_attendance_preview(
    _admin: StaffUser,
    db: Db,
    group_id: int,
    file: UploadFile = File(...),
) -> sch.GlobalAttendanceImportPreview:
    group = db.query(ApprenantGroup).filter(ApprenantGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Session introuvable.")

    members = db.query(ApprenantGroupMember).filter(ApprenantGroupMember.group_id == group_id).all()
    member_emails = {(m.email or "").strip().lower() for m in members}

    file_bytes = await file.read()
    try:
        rows = parse_excel_file(file_bytes, member_emails)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fichier Excel invalide : {e}") from e

    sessions = db.query(GroupSession).filter(GroupSession.group_id == group_id).all()

    session_index: dict[tuple[str, str], GroupSession] = {}
    for s in sessions:
        if s.scheduled_at:
            dt = s.scheduled_at.astimezone(timezone.utc) if s.scheduled_at.tzinfo else s.scheduled_at
            d_key = dt.strftime("%Y-%m-%d")
            h_key = dt.strftime("%H:%M")
            session_index[(d_key, h_key)] = s

    from collections import defaultdict

    groups_map: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in rows:
        d_raw = row.get("date") or ""
        d_norm = d_raw

        if d_raw and "-" in d_raw:
            parts = d_raw.split("-")
            if len(parts) == 3 and len(parts[0]) == 4:
                d_norm = d_raw
            elif len(parts) == 3 and len(parts[2]) == 4:
                d_norm = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
        elif d_raw and "/" in d_raw:
            parts = d_raw.split("/")
            if len(parts) == 3:
                if len(parts[2]) == 4:
                    d_norm = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                elif len(parts[0]) == 4:
                    d_norm = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"

        h_raw = row.get("heure") or ""
        if h_raw and h_raw.count(":") == 2:
            h = h_raw[:5]
        else:
            h = h_raw

        groups_map[(d_norm, h)].append(row)

    result_groups: list[dict] = []
    total_errors = 0
    missing_sessions = 0
    for (d_key, h_key), group_rows in groups_map.items():
        matched = session_index.get((d_key, h_key))
        if matched is None:
            if not h_key:
                day_sessions = [s for (dk, hk), s in session_index.items() if dk == d_key]
                if len(day_sessions) == 1:
                    matched = day_sessions[0]
            if matched is None and h_key:
                h_short = h_key[:5]
                matched = session_index.get((d_key, h_short))
            if matched is None:
                day_sessions = [s for (dk, hk), s in session_index.items() if dk == d_key]
                if len(day_sessions) == 1:
                    matched = day_sessions[0]
        resolution = "found" if matched else "missing"
        if resolution == "missing":
            missing_sessions += 1
        found_c = sum(1 for r in group_rows if r["resolution"] == "found")
        new_c = sum(1 for r in group_rows if r["resolution"] == "new")
        err_c = sum(1 for r in group_rows if r["resolution"] == "error")
        total_errors += err_c
        result_groups.append(
            {
                "dateKey": d_key,
                "heureKey": h_key,
                "sessionId": str(matched.id) if matched else None,
                "sessionTitle": matched.title if matched else None,
                "sessionResolution": resolution,
                "rows": group_rows,
                "foundCount": found_c,
                "newCount": new_c,
                "errorCount": err_c,
            }
        )

    return sch.GlobalAttendanceImportPreview(
        groups=[sch.SessionImportGroup.model_validate(g) for g in result_groups],
        totalRows=len(rows),
        totalErrors=total_errors,
        missingSessions=missing_sessions,
    )


@router.post("/groups/{group_id}/attendance/import/confirm", response_model=sch.GlobalImportSummary)
def global_import_attendance_confirm(
    _admin: StaffUser,
    db: Db,
    group_id: int,
    body: sch.GlobalAttendanceImportConfirmBody,
) -> sch.GlobalImportSummary:
    group = db.query(ApprenantGroup).filter(ApprenantGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Session introuvable.")

    members = db.query(ApprenantGroupMember).filter(ApprenantGroupMember.group_id == group_id).all()
    member_by_email = {(m.email or "").strip().lower(): m for m in members}
    affected_members: list[ApprenantGroupMember] = []

    sessions_created = 0
    sessions_updated = 0
    attendances_set = 0
    members_created = 0

    for grp in body.groups:
        session_id_int: int | None = None
        if grp.sessionId:
            session_id_int = int(grp.sessionId)
        elif grp.createSession:
            try:
                scheduled_at = parse_tunis_datetime_to_utc(grp.dateKey, grp.heureKey)
            except ValueError:
                continue
            new_session = GroupSession(
                group_id=group_id,
                title=grp.sessionTitle or f"Séance {grp.dateKey}",
                scheduled_at=scheduled_at,
                duration_minutes=120,
                status="planned",
            )
            db.add(new_session)
            db.flush()
            session_id_int = int(new_session.id)
            sessions_created += 1
            for m in members:
                db.add(
                    SessionAttendance(
                        session_id=session_id_int,
                        member_id=int(m.id),
                        status="pending",
                    )
                )
            db.flush()
        else:
            continue

        sessions_updated += 1

        for row in grp.rows:
            email_key = normalize_email(row.email)
            member = member_by_email.get(email_key)

            if member is None and row.createIfNew:
                user = db.query(User).filter(func.lower(User.email) == email_key).first()
                member = ApprenantGroupMember(
                    group_id=group_id,
                    email=email_key,
                    email_normalized=email_key,
                    user_id=user.id if user else None,
                    first_name=_opt_text(user.first_name) if user else None,
                    last_name=_opt_text(user.last_name) if user else None,
                    status="active" if user else "pending",
                    linked_at=datetime.now(timezone.utc) if user else None,
                )
                db.add(member)
                db.flush()
                for gs in db.query(GroupSession).filter(
                    GroupSession.group_id == group_id,
                    GroupSession.id != session_id_int,
                ).all():
                    db.add(
                        SessionAttendance(
                            session_id=int(gs.id),
                            member_id=int(member.id),
                            status="pending",
                        )
                    )
                ensure_member_progress_rows(db, member)
                member_by_email[email_key] = member
                members.append(member)
                members_created += 1

            if member is None:
                continue

            attendance = (
                db.query(SessionAttendance)
                .filter(
                    SessionAttendance.session_id == session_id_int,
                    SessionAttendance.member_id == int(member.id),
                )
                .first()
            )
            if attendance:
                attendance.status = row.statut
            else:
                db.add(
                    SessionAttendance(
                        session_id=session_id_int,
                        member_id=int(member.id),
                        status=row.statut,
                    )
                )
            attendances_set += 1

            if member not in affected_members:
                affected_members.append(member)

    db.flush()
    for member in affected_members:
        _recompute_member_progress(db, member)
    db.commit()

    return sch.GlobalImportSummary(
        sessionsCreated=sessions_created,
        sessionsUpdated=sessions_updated - sessions_created,
        attendancesSet=attendances_set,
        membersCreated=members_created,
    )


@router.patch("/members/{member_id}/progress", response_model=sch.MemberProgressMutationResponse)
def apprenants_member_progress_patch(
    _admin: StaffUser,
    db: Db,
    member_id: int,
    body: sch.MemberProgressPatchBody,
) -> sch.MemberProgressMutationResponse:
    items = patch_member_progress(db, member_id, body)
    return sch.MemberProgressMutationResponse(items=[sch.MemberProgressDto.model_validate(item) for item in items])


@router.patch("/members/{member_id}/certifications", response_model=sch.MemberCertificationMutationResponse)
def apprenants_member_certifications_patch(
    _admin: StaffUser,
    db: Db,
    member_id: int,
    body: sch.MemberCertificationPatchBody,
) -> sch.MemberCertificationMutationResponse:
    items = patch_member_certifications(db, member_id, body)
    return sch.MemberCertificationMutationResponse(
        items=[sch.MemberCertificationDto.model_validate(item) for item in items]
    )


@router.post("/members/{member_id}/notes", response_model=sch.MemberNoteMutationResponse)
def apprenants_member_note_create(
    admin: StaffUser,
    db: Db,
    member_id: int,
    body: sch.MemberNoteCreateBody,
) -> sch.MemberNoteMutationResponse:
    return sch.MemberNoteMutationResponse(note=sch.MemberNoteDto.model_validate(create_member_note(db, member_id, body, admin)))


@router.get("/members/{member_id}/attendance-history", response_model=sch.MemberAttendanceHistoryResponse)
def apprenants_member_attendance_history(
    _admin: StaffUser,
    db: Db,
    member_id: int,
) -> sch.MemberAttendanceHistoryResponse:
    data = get_member_attendance_history(db, member_id)
    return sch.MemberAttendanceHistoryResponse(
        items=[sch.MemberAttendanceHistoryItem.model_validate(i) for i in data["items"]],
        attendanceRate=data["attendanceRate"],
    )


@router.get("/members/{member_id}", response_model=sch.MemberProfileResponse)
def apprenants_member_profile(
    _admin: StaffUser,
    db: Db,
    member_id: int,
) -> sch.MemberProfileResponse:
    return sch.MemberProfileResponse(data=sch.MemberProfileDto.model_validate(get_member_profile(db, member_id)))


@router.get("/module-sessions", response_model=sch.ModuleSessionListResponse)
def list_module_sessions_route(_admin: StaffUser, db: Db) -> sch.ModuleSessionListResponse:
    items = list_module_sessions(db)
    return sch.ModuleSessionListResponse(items=[sch.ModuleSessionSummary.model_validate(i) for i in items])


@router.post("/module-sessions", response_model=sch.ModuleSessionMutationResponse)
def create_module_session_route(
    admin: StaffUser,
    db: Db,
    body: sch.ModuleSessionCreateBody,
) -> sch.ModuleSessionMutationResponse:
    session = create_module_session(db, body)
    log_action(
        db,
        admin,
        "Session-module créée",
        body.sessionLabel or "Nouvelle session-module",
        entity_kind="session",
    )
    db.commit()
    return sch.ModuleSessionMutationResponse(session=sch.ModuleSessionSummary.model_validate(session))


@router.get("/module-sessions/{group_id}/members", response_model=sch.ModuleSessionMembersResponse)
def list_module_session_members_route(
    _admin: StaffUser,
    db: Db,
    group_id: int,
) -> sch.ModuleSessionMembersResponse:
    items = list_module_session_members(db, group_id)
    return sch.ModuleSessionMembersResponse(items=[sch.ModuleSessionMemberDto.model_validate(i) for i in items])


@router.post("/module-sessions/{group_id}/members", response_model=sch.ModuleSessionMutationResponse)
def add_member_to_module_session_route(
    admin: StaffUser,
    db: Db,
    group_id: int,
    body: sch.AddMemberToSessionBody,
) -> sch.ModuleSessionMutationResponse:
    session = add_member_to_module_session(db, group_id, body)
    try:
        from app.domains.admin.planning.gcal_service import sync_google_calendar_for_group

        sync_google_calendar_for_group(db, admin.id, group_id)
    except Exception:
        logger.exception("Google Calendar sync after add member failed group %s", group_id)
    label = session.get("sessionLabel") if isinstance(session, dict) else None
    log_action(
        db,
        admin,
        "Apprenant ajouté à la session",
        f"{body.email} — {label or f'Session-module #{group_id}'}",
        entity_kind="member",
        entity_id=str(group_id),
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
    return sch.ModuleSessionMutationResponse(session=sch.ModuleSessionSummary.model_validate(session))


@router.delete("/module-sessions/{group_id}/members/{member_id}", response_model=sch.DeleteResponse)
def remove_member_from_module_session_route(
    admin: StaffUser,
    db: Db,
    group_id: int,
    member_id: int,
) -> sch.DeleteResponse:
    remove_member_from_module_session(db, group_id, member_id)
    try:
        from app.domains.admin.planning.gcal_service import sync_google_calendar_for_group

        sync_google_calendar_for_group(db, admin.id, group_id)
    except Exception:
        logger.exception("Google Calendar sync after remove member failed group %s", group_id)
    log_action(
        db,
        admin,
        "Apprenant retiré de la session",
        f"Membre #{member_id} — Session-module #{group_id}",
        entity_kind="member",
        entity_id=str(member_id),
    )
    db.commit()
    return sch.DeleteResponse()


@router.delete("/module-sessions/{group_id}", response_model=sch.DeleteResponse)
def delete_module_session_route(
    admin: StaffUser,
    db: Db,
    group_id: int,
) -> sch.DeleteResponse:
    delete_module_session(db, group_id)
    log_action(
        db,
        admin,
        "Session-module supprimée",
        f"Session-module #{group_id}",
        entity_kind="session",
        entity_id=str(group_id),
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
    return sch.DeleteResponse()


@router.get("/active-enrollments", response_model=sch.ActiveEnrollmentsResponse)
def list_active_enrollments_route(
    _admin: StaffUser,
    db: Db,
    access_kind: str | None = Query(None),
    target_ref: str | None = Query(None),
) -> sch.ActiveEnrollmentsResponse:
    items = list_active_enrollments(db, access_kind, target_ref)
    return sch.ActiveEnrollmentsResponse(items=[sch.ActiveEnrollmentDto.model_validate(i) for i in items])


@router.get("/enrollments")
def list_enrollments_route(
    _admin: StaffUser,
    db: Db,
    enrollment_kind: str | None = Query(None),
    target_ref: str | None = Query(None),
) -> dict:
    items = list_enrollments(db, enrollment_kind=enrollment_kind, target_ref=target_ref)
    return {"items": items}


@router.post("/enrollments")
def create_enrollment_route(admin: StaffUser, db: Db, body: sch.EnrollmentCreateBody) -> dict:
    return create_enrollment(
        db,
        str(body.email),
        body.enrollmentKind,
        body.targetRef,
        body.targetLabel,
        admin.id,
    )


@router.get("/enrollments/members-for-target")
def list_enrolled_members_for_target_route(
    _admin: StaffUser,
    db: Db,
    enrollment_kind: str = Query(...),
    target_ref: str = Query(...),
) -> dict:
    items = list_enrolled_members_for_target(db, enrollment_kind, target_ref)
    return {"items": items}


@router.get("/enrollments/pack-modules")
def list_pack_modules_route(
    _admin: StaffUser,
    db: Db,
    pack_id: str = Query(..., min_length=1),
) -> dict:
    items = list_pack_modules_for_enrollment(db, pack_id)
    return {"items": items}


@router.delete("/enrollments/{enrollment_id}")
def delete_enrollment_route(enrollment_id: int, _admin: StaffUser, db: Db) -> dict:
    return delete_enrollment(db, enrollment_id)


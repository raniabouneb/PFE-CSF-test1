"""Google Calendar — OAuth2 admin + sync des séances (CSF → Google)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote, urlencode

import httpx
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.persistence.models import (
    AdminPlanningReminderRule,
    ApprenantGroup,
    ApprenantGroupMember,
    GoogleCalendarToken,
    PlanningSession,
    PlanningSessionGroup,
    User,
)

logger = logging.getLogger(__name__)

GCAL_SEND_UPDATES = "all"
_ATTENDEE_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

GCAL_SCOPES = ["https://www.googleapis.com/auth/calendar"]
OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"


def _calendar_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def build_csf_link_marker(group_id: int, module_target_ref: str) -> str:
    return f"CSF-LINK:group={group_id}|module={module_target_ref}"


def _sign_state(user_id: str, return_to: str = "admin") -> str:
    payload = base64.urlsafe_b64encode(
        json.dumps({"uid": user_id, "rt": return_to}).encode()
    ).decode().rstrip("=")
    sig = hmac.new(
        settings.auth_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()[:24]
    return f"{payload}.{sig}"


def _verify_state(state: str) -> tuple[str, str]:
    if "." not in state:
        raise ValueError("state invalide")
    payload, sig = state.rsplit(".", 1)
    expected = hmac.new(
        settings.auth_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()[:24]
    if not hmac.compare_digest(sig, expected):
        raise ValueError("signature state invalide")
    pad = "=" * (-len(payload) % 4)
    data = json.loads(base64.urlsafe_b64decode(payload + pad))
    uid = data.get("uid")
    if not uid or not isinstance(uid, str):
        raise ValueError("uid manquant dans state")
    rt = data.get("rt")
    return uid, rt if isinstance(rt, str) and rt else "admin"


def get_google_auth_url(user_id: str, *, return_to: str = "admin") -> str:
    if not _calendar_configured():
        raise RuntimeError("Google OAuth non configuré (GOOGLE_CLIENT_ID / SECRET).")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_calendar_redirect_uri,
        "response_type": "code",
        "scope": " ".join(GCAL_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": _sign_state(user_id, return_to),
    }
    return f"{OAUTH_AUTH_URL}?{urlencode(params)}"


def exchange_code_and_store(db: Session, code: str, state: str) -> tuple[str, str]:
    user_id, return_to = _verify_state(state)
    body = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_calendar_redirect_uri,
        "grant_type": "authorization_code",
    }
    with httpx.Client(timeout=30.0) as client:
        r = client.post(
            OAUTH_TOKEN_URL,
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if r.status_code != 200:
            logger.error("Google token exchange failed: %s", r.text)
            raise RuntimeError("Échange du code Google échoué.")
        data = r.json()

    access = data.get("access_token")
    refresh = data.get("refresh_token")
    if not access or not refresh:
        raise RuntimeError("Tokens Google incomplets (révoquez l'accès et reconnectez).")

    expires_in = data.get("expires_in")
    expiry = None
    if expires_in:
        expiry = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

    row = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if row:
        row.access_token = access
        row.refresh_token = refresh
        row.token_expiry = expiry
    else:
        row = GoogleCalendarToken(
            user_id=user_id,
            access_token=access,
            refresh_token=refresh,
            token_expiry=expiry,
            calendar_id="primary",
        )
        db.add(row)
    db.flush()
    _resolve_primary_calendar_id(db, user_id)
    db.commit()
    return user_id, return_to


def disconnect_google_calendar(db: Session, user_id: str) -> None:
    db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).delete(
        synchronize_session=False
    )
    db.commit()


def is_google_calendar_connected(db: Session, user_id: str) -> bool:
    return (
        db.query(GoogleCalendarToken)
        .filter(GoogleCalendarToken.user_id == user_id)
        .first()
        is not None
    )


def build_embed_url(calendar_id: str, *, mode: str = "MONTH") -> str:
    """URL iframe officielle Google Calendar (toutes les vues : mois, semaine, jour, agenda)."""
    src = quote(calendar_id, safe="")
    tz = quote(settings.google_calendar_timezone, safe="")
    view = mode if mode in ("MONTH", "WEEK", "DAY", "AGENDA") else "MONTH"
    return (
        "https://calendar.google.com/calendar/embed"
        f"?src={src}&ctz={tz}&hl=fr&mode={view}"
        "&showTitle=1&showNav=1&showDate=1&showPrint=1&showTabs=1"
        "&showCalendars=1&showTz=1&wkst=2"
    )


def build_open_url() -> str:
    return "https://calendar.google.com/calendar/r"


def _resolve_primary_calendar_id(db: Session, user_id: str) -> str | None:
    service, row = _get_calendar_service(db, user_id)
    if not service or not row:
        return None
    try:
        cal = service.calendarList().get(calendarId="primary").execute()
        cal_id = (cal.get("id") or "primary").strip()
        if cal_id and row.calendar_id != cal_id:
            row.calendar_id = cal_id
            db.commit()
        return row.calendar_id or cal_id
    except Exception:
        logger.exception("Impossible de résoudre le calendrier primary pour %s", user_id)
        return row.calendar_id or "primary"


def _user_email(db: Session, user_id: str) -> str | None:
    row = db.query(User).filter(User.id == user_id).first()
    if not row:
        return None
    email = (row.email or "").strip()
    return email if "@" in email else None


def _effective_calendar_id(
    db: Session,
    user_id: str,
    *,
    fallback_email: str | None = None,
) -> str:
    """ID calendrier pour l'iframe — sans bloquer l'UI si l'API Google est lente."""
    row = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if not row:
        email = (fallback_email or "").strip() or _user_email(db, user_id)
        return email or "primary"

    stored = (row.calendar_id or "").strip()
    if stored and stored != "primary" and "@" in stored:
        return stored

    try:
        resolved = _resolve_primary_calendar_id(db, user_id)
        if resolved and resolved != "primary" and "@" in resolved:
            return resolved
    except Exception:
        logger.exception("Résolution calendrier Google ignorée pour %s", user_id)

    email = (fallback_email or "").strip() or _user_email(db, user_id)
    if email:
        return email
    return stored or "primary"


def get_connection_view(
    db: Session,
    user_id: str,
    *,
    fallback_email: str | None = None,
) -> dict[str, Any]:
    """Infos pour l'UI : statut + iframe Google Calendar."""
    if not is_google_calendar_connected(db, user_id):
        return {
            "connected": False,
            "calendarId": None,
            "embedUrl": None,
            "openUrl": build_open_url(),
        }
    cal_id = _effective_calendar_id(db, user_id, fallback_email=fallback_email)
    return {
        "connected": True,
        "calendarId": cal_id,
        "embedUrl": build_embed_url(cal_id),
        "openUrl": build_open_url(),
    }


def _credentials_from_row(row: GoogleCalendarToken) -> Credentials:
    return Credentials(
        token=row.access_token,
        refresh_token=row.refresh_token,
        token_uri=OAUTH_TOKEN_URL,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=GCAL_SCOPES,
        expiry=row.token_expiry.replace(tzinfo=None) if row.token_expiry else None,
    )


def _persist_credentials(db: Session, row: GoogleCalendarToken, creds: Credentials) -> None:
    row.access_token = creds.token or row.access_token
    if creds.refresh_token:
        row.refresh_token = creds.refresh_token
    if creds.expiry:
        row.token_expiry = creds.expiry.replace(tzinfo=timezone.utc)
    db.commit()


def _get_calendar_service(db: Session, user_id: str):
    row = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if not row:
        return None, None
    creds = _credentials_from_row(row)
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleAuthRequest())
        _persist_credentials(db, row, creds)
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    return service, row


def _session_datetimes(session: PlanningSession) -> tuple[str, str]:
    time_part = session.start_time or "09:00"
    if time_part.count(":") == 1:
        time_part += ":00"
    start_dt = datetime.fromisoformat(f"{session.date.isoformat()}T{time_part}")
    end_dt = start_dt + timedelta(minutes=int(session.duration_minutes or 60))
    tz = settings.google_calendar_timezone
    fmt = "%Y-%m-%dT%H:%M:%S"
    return (
        start_dt.strftime(fmt),
        end_dt.strftime(fmt),
    )


def _reminder_overrides(db: Session) -> list[dict[str, Any]]:
    rules = (
        db.query(AdminPlanningReminderRule)
        .filter(AdminPlanningReminderRule.enabled == True)  # noqa: E712
        .order_by(AdminPlanningReminderRule.id.asc())
        .all()
    )
    if not rules:
        return [
            {"method": "email", "minutes": 24 * 60},
            {"method": "popup", "minutes": 2 * 60},
        ]
    overrides: list[dict[str, Any]] = []
    for rule in rules:
        minutes = int(rule.hours_before or 24) * 60
        if rule.channel_email:
            overrides.append({"method": "email", "minutes": minutes})
        if rule.channel_sms:
            overrides.append({"method": "popup", "minutes": minutes})
    return overrides or [{"method": "popup", "minutes": 30}]


def _is_valid_attendee_email(raw: str) -> bool:
    email = raw.strip().lower()
    if not email or len(email) > 254:
        return False
    if email.startswith("mailto:"):
        email = email[7:].strip()
    return bool(_ATTENDEE_EMAIL_RE.match(email))


def _normalize_attendee_email(raw: str) -> str | None:
    email = raw.strip().lower()
    if email.startswith("mailto:"):
        email = email[7:].strip()
    return email if _is_valid_attendee_email(email) else None


def _group_names_for_planning_session(db: Session, session_id: int) -> list[str]:
    rows = (
        db.query(ApprenantGroup.name)
        .join(PlanningSessionGroup, PlanningSessionGroup.group_id == ApprenantGroup.id)
        .filter(PlanningSessionGroup.session_id == session_id)
        .order_by(ApprenantGroup.name.asc())
        .all()
    )
    names: list[str] = []
    seen: set[str] = set()
    for (name,) in rows:
        label = (name or "").strip()
        if label and label not in seen:
            seen.add(label)
            names.append(label)
    return names


def _google_event_summary(session: PlanningSession, group_names: list[str]) -> str:
    module = (session.module_label or "").strip() or "Module"
    if group_names:
        if len(group_names) == 1:
            session_label = group_names[0]
        elif len(group_names) <= 3:
            session_label = " / ".join(group_names)
        else:
            session_label = f"{group_names[0]} (+{len(group_names) - 1} sessions)"
        return f"{module} — {session_label}"
    fallback = (session.title or "").strip() or "Séance CSF"
    return f"{module} — {fallback}"


def _google_event_description(session: PlanningSession, group_names: list[str]) -> str:
    lines: list[str] = []
    if session.module_label:
        lines.append(f"Module : {session.module_label}")
    if group_names:
        lines.append(f"Session-module : {', '.join(group_names)}")
    elif session.title:
        lines.append(f"Séance : {session.title}")
    if session.module_target_ref:
        lines.append(f"Référence : {session.module_target_ref}")
    lines.append("")
    lines.append("Séance planifiée via CSF Formation.")
    lines.append("Centre de formation — présences et progression gérées dans l'espace admin CSF.")
    return "\n".join(lines)


def _attendee_emails_for_session(db: Session, session_id: int) -> list[str]:
    group_ids = [
        gl.group_id
        for gl in db.query(PlanningSessionGroup)
        .filter(PlanningSessionGroup.session_id == session_id)
        .all()
    ]
    if not group_ids:
        return []
    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id.in_(group_ids))
        .all()
    )
    user_ids = [m.user_id for m in members if m.user_id]
    users_by_id: dict[str, str] = {}
    if user_ids:
        for u in db.query(User).filter(User.id.in_(user_ids)).all():
            if u.email:
                users_by_id[str(u.id)] = u.email

    seen: set[str] = set()
    emails: list[str] = []
    skipped = 0
    for m in members:
        raw_candidates = [m.email or ""]
        if m.user_id and str(m.user_id) in users_by_id:
            raw_candidates.insert(0, users_by_id[str(m.user_id)])
        normalized = None
        for raw in raw_candidates:
            normalized = _normalize_attendee_email(raw)
            if normalized:
                break
        if not normalized:
            if (m.email or "").strip():
                skipped += 1
            continue
        if normalized in seen:
            continue
        seen.add(normalized)
        emails.append(normalized)
    if skipped:
        logger.info(
            "Google Calendar session %s: %s e-mail(s) apprenant ignoré(s) (format invalide).",
            session_id,
            skipped,
        )
    return emails


def _event_body(db: Session, session: PlanningSession) -> dict[str, Any]:
    start_s, end_s = _session_datetimes(session)
    tz = settings.google_calendar_timezone
    group_names = _group_names_for_planning_session(db, int(session.id))
    attendees = [{"email": e} for e in _attendee_emails_for_session(db, int(session.id))]
    body: dict[str, Any] = {
        "summary": _google_event_summary(session, group_names),
        "description": _google_event_description(session, group_names),
        "start": {"dateTime": start_s, "timeZone": tz},
        "end": {"dateTime": end_s, "timeZone": tz},
        "reminders": {
            "useDefault": False,
            "overrides": _reminder_overrides(db),
        },
    }
    location = (session.location or "").strip()
    if location:
        body["location"] = location
    if attendees:
        body["attendees"] = attendees
    if session.status == "cancelled":
        body["status"] = "cancelled"
    return body


def _persist_google_event_id(db: Session, session: PlanningSession, event_id: str | None) -> None:
    if not event_id:
        return
    if session.google_event_id != event_id:
        session.google_event_id = event_id
        db.commit()


def sync_session_to_google(
    db: Session,
    user_id: str,
    session: PlanningSession,
    *,
    send_updates: str = GCAL_SEND_UPDATES,
) -> str | None:
    """Crée ou met à jour l'événement Google. Retourne event_id ou None si non connecté."""
    if not _calendar_configured():
        return None
    service, row = _get_calendar_service(db, user_id)
    if not service or not row:
        return None

    calendar_id = row.calendar_id or "primary"
    event_body = _event_body(db, session)

    try:
        if session.google_event_id:
            result = (
                service.events()
                .update(
                    calendarId=calendar_id,
                    eventId=session.google_event_id,
                    body=event_body,
                    sendUpdates=send_updates,
                )
                .execute()
            )
        else:
            result = (
                service.events()
                .insert(
                    calendarId=calendar_id,
                    body=event_body,
                    sendUpdates=send_updates,
                )
                .execute()
            )
        event_id = result.get("id")
        _persist_google_event_id(db, session, event_id)
        return event_id
    except HttpError as exc:
        status = getattr(exc.resp, "status", None)
        if status == 404 and session.google_event_id:
            logger.warning(
                "Google Calendar event %s introuvable (session %s), recréation.",
                session.google_event_id,
                session.id,
            )
            session.google_event_id = None
            db.commit()
            return sync_session_to_google(db, user_id, session, send_updates=send_updates)
        logger.exception(
            "Google Calendar sync failed for planning session %s (HTTP %s)",
            session.id,
            status,
        )
        return session.google_event_id
    except Exception:
        logger.exception("Google Calendar sync unexpected error session %s", session.id)
        return session.google_event_id


def sync_planning_session_to_google(
    db: Session,
    admin_user_id: str,
    planning_session_id: int,
    *,
    send_updates: str = GCAL_SEND_UPDATES,
) -> str | None:
    """Point d'entrée : charge la séance planning et synchronise Google (sans lever d'exception)."""
    session = (
        db.query(PlanningSession)
        .filter(PlanningSession.id == planning_session_id)
        .first()
    )
    if not session:
        logger.warning("sync_planning_session_to_google: session %s introuvable", planning_session_id)
        return None
    try:
        return sync_session_to_google(db, admin_user_id, session, send_updates=send_updates)
    except Exception:
        logger.exception(
            "sync_planning_session_to_google failed for session %s",
            planning_session_id,
        )
        return session.google_event_id


def sync_google_calendar_for_group(
    db: Session,
    admin_user_id: str | None,
    group_id: int,
) -> None:
    """Re-synchronise les événements Google des séances planning liées à un groupe (changement membres)."""
    if not admin_user_id:
        return
    if not _calendar_configured() or not is_google_calendar_connected(db, admin_user_id):
        return
    links = (
        db.query(PlanningSessionGroup.session_id)
        .filter(PlanningSessionGroup.group_id == group_id)
        .distinct()
        .all()
    )
    for (session_id,) in links:
        sync_planning_session_to_google(db, admin_user_id, int(session_id))


def build_compose_url(
    *,
    title: str,
    start: datetime,
    end: datetime,
    details: str | None = None,
    location: str | None = None,
    attendee_emails: list[str] | None = None,
) -> str:
    """Ouvre Google Calendar en mode création d'événement (hors iframe)."""
    fmt = lambda dt: dt.strftime("%Y%m%dT%H%M%S")
    params: dict[str, str] = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{fmt(start)}/{fmt(end)}",
        "ctz": settings.google_calendar_timezone,
    }
    if details:
        params["details"] = details
    if location:
        params["location"] = location
    if attendee_emails:
        valid = []
        for raw in attendee_emails:
            normalized = _normalize_attendee_email(raw)
            if normalized:
                valid.append(normalized)
        if valid:
            params["add"] = ",".join(valid)
    return f"https://calendar.google.com/calendar/render?{urlencode(params)}"


def _parse_google_event_times(event: dict[str, Any]) -> tuple[str, str | None, int]:
    """Retourne (date YYYY-MM-DD, start_time HH:MM, duration_minutes)."""
    start = event.get("start") or {}
    end = event.get("end") or {}
    tz = settings.google_calendar_timezone

    def _parse_dt(block: dict[str, Any]) -> datetime:
        if block.get("dateTime"):
            raw = block["dateTime"]
            if raw.endswith("Z"):
                return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(
                    timezone.utc
                )
            return datetime.fromisoformat(raw)
        if block.get("date"):
            return datetime.fromisoformat(f"{block['date']}T09:00:00")
        return datetime.now(timezone.utc)

    start_dt = _parse_dt(start)
    end_dt = _parse_dt(end)
    if end_dt <= start_dt:
        end_dt = start_dt + timedelta(minutes=60)
    duration = max(15, int((end_dt - start_dt).total_seconds() // 60))
    local_start = start_dt
    if start_dt.tzinfo:
        try:
            from zoneinfo import ZoneInfo

            local_start = start_dt.astimezone(ZoneInfo(tz))
        except Exception:
            local_start = start_dt.replace(tzinfo=None)
    date_str = local_start.strftime("%Y-%m-%d")
    time_str = local_start.strftime("%H:%M")
    return date_str, time_str, duration


def get_calendar_event(db: Session, user_id: str, event_id: str) -> dict[str, Any] | None:
    service, row = _get_calendar_service(db, user_id)
    if not service or not row:
        return None
    calendar_id = row.calendar_id or "primary"
    try:
        return (
            service.events()
            .get(calendarId=calendar_id, eventId=event_id)
            .execute()
        )
    except HttpError as exc:
        if getattr(exc.resp, "status", None) == 404:
            return None
        raise


def list_calendar_events(
    db: Session,
    user_id: str,
    *,
    days_back: int = 7,
    days_forward: int = 90,
    max_results: int = 40,
    updated_since: datetime | None = None,
) -> list[dict[str, Any]]:
    service, row = _get_calendar_service(db, user_id)
    if not service or not row:
        return []
    calendar_id = row.calendar_id or "primary"
    now = datetime.now(timezone.utc)
    time_min = (now - timedelta(days=days_back)).isoformat()
    time_max = (now + timedelta(days=days_forward)).isoformat()
    list_kwargs: dict[str, Any] = {
        "calendarId": calendar_id,
        "timeMin": time_min,
        "timeMax": time_max,
        "singleEvents": True,
        "maxResults": max_results,
    }
    if updated_since:
        list_kwargs["updatedMin"] = updated_since.astimezone(timezone.utc).isoformat()
        list_kwargs["orderBy"] = "updated"
    else:
        list_kwargs["orderBy"] = "startTime"
    try:
        result = service.events().list(**list_kwargs).execute()
    except Exception:
        logger.exception("list_calendar_events failed for user %s", user_id)
        return []

    linked_ids = {
        row[0]
        for row in db.query(PlanningSession.google_event_id)
        .filter(PlanningSession.google_event_id.isnot(None))
        .all()
        if row[0]
    }

    items: list[dict[str, Any]] = []
    for ev in result.get("items") or []:
        eid = ev.get("id")
        if not eid or ev.get("status") == "cancelled":
            continue
        date_str, time_str, duration = _parse_google_event_times(ev)
        items.append({
            "id": eid,
            "summary": (ev.get("summary") or "").strip() or "(Sans titre)",
            "date": date_str,
            "startTime": time_str,
            "durationMinutes": duration,
            "location": (ev.get("location") or "").strip() or None,
            "htmlLink": ev.get("htmlLink"),
            "description": (ev.get("description") or "").strip(),
            "created": ev.get("created"),
            "alreadyLinked": eid in linked_ids,
        })
    return items


def _event_created_dt(event: dict[str, Any]) -> datetime | None:
    raw = event.get("created")
    if not raw or not isinstance(raw, str):
        return None
    try:
        if raw.endswith("Z"):
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def pick_event_for_auto_link(
    events: list[dict[str, Any]],
    *,
    group_id: int,
    module_target_ref: str,
    module_label: str | None = None,
    session_label: str | None = None,
    since: datetime | None = None,
) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    """Choisit un événement Google non lié. Retourne (choix, candidats pour sélection manuelle)."""
    marker = build_csf_link_marker(group_id, module_target_ref)
    unlinked = [e for e in events if not e.get("alreadyLinked")]
    if not unlinked:
        return None, []

    marked = [e for e in unlinked if marker in (e.get("description") or "")]
    if marked:
        return sorted(marked, key=lambda e: e.get("created") or "", reverse=True)[0], []

    recent = unlinked
    if since:
        recent = [
            e
            for e in unlinked
            if (dt := _event_created_dt(e)) is not None and dt >= since
        ] or unlinked

    if len(recent) == 1:
        return recent[0], []

    hints = [h.strip().lower() for h in (module_label, session_label) if h and h.strip()]
    if hints:
        title_matches = []
        for e in recent:
            summary = (e.get("summary") or "").lower()
            if any(h in summary for h in hints):
                title_matches.append(e)
        if len(title_matches) == 1:
            return title_matches[0], []
        if len(title_matches) > 1:
            return (
                sorted(title_matches, key=lambda x: x.get("created") or "", reverse=True)[0],
                [],
            )

    candidates = sorted(recent, key=lambda e: e.get("created") or "", reverse=True)[:10]
    if len(recent) == 1:
        return recent[0], []
    return None, candidates


def delete_session_from_google(
    db: Session,
    user_id: str,
    session: PlanningSession,
    *,
    send_updates: str = GCAL_SEND_UPDATES,
) -> None:
    if not session.google_event_id:
        return
    if not _calendar_configured():
        return
    service, row = _get_calendar_service(db, user_id)
    if not service or not row:
        return
    calendar_id = row.calendar_id or "primary"
    event_id = session.google_event_id
    try:
        service.events().delete(
            calendarId=calendar_id,
            eventId=event_id,
            sendUpdates=send_updates,
        ).execute()
    except HttpError as exc:
        if exc.resp.status != 404:
            logger.exception("Google Calendar delete failed session %s", session.id)
    except Exception:
        logger.exception("Google Calendar delete unexpected error session %s", session.id)
    else:
        session.google_event_id = None
        db.commit()


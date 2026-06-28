"""Notifications CSF (in-app + e-mail) lors de la planification d'une séance."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.csf_session_email import build_session_scheduled_html, send_session_scheduled_email
from app.persistence.models import (
    ApprenantGroup,
    ApprenantGroupMember,
    PlanningSession,
    PlanningSessionGroup,
    User,
    LearnerNotification,
)

log = logging.getLogger(__name__)


def _normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


def _resolve_user_for_member(db: Session, member: ApprenantGroupMember) -> User | None:
    if member.user_id:
        return db.query(User).filter(User.id == member.user_id).first()
    email = _normalize_email(member.email)
    if not email:
        return None
    user = db.query(User).filter(User.email.ilike(email)).first()
    if user and not member.user_id:
        member.user_id = user.id
    return user


def _member_display_name(member: ApprenantGroupMember, user: User | None) -> str:
    parts = [member.first_name or "", member.last_name or ""]
    name = " ".join(p for p in parts if p).strip()
    if name:
        return name
    if user and (user.first_name or user.last_name):
        return " ".join(p for p in [user.first_name, user.last_name] if p).strip()
    return member.email or "Apprenant"


def _format_date_fr(d) -> str:
    if hasattr(d, "strftime"):
        return d.strftime("%A %d %B %Y").capitalize()
    return str(d)


def _format_time_range(start_time: str | None, duration_minutes: int) -> str:
    if not start_time:
        return "Horaire à confirmer"
    st = start_time[:5] if len(start_time) >= 5 else start_time
    if not duration_minutes or duration_minutes <= 0:
        return st
    try:
        h, m = map(int, st.split(":"))
        total = h * 60 + m + int(duration_minutes)
        end = f"{total // 60 % 24:02d}:{total % 60:02d}"
        return f"{st} – {end}"
    except ValueError:
        return st


def dispatch_planning_session_notifications(db: Session, planning_session_id: int) -> None:
    """Crée une notification in-app + e-mail CSF pour chaque apprenant concerné."""
    session = db.query(PlanningSession).filter(PlanningSession.id == planning_session_id).first()
    if not session:
        return

    group_rows = (
        db.query(PlanningSessionGroup, ApprenantGroup)
        .join(ApprenantGroup, ApprenantGroup.id == PlanningSessionGroup.group_id)
        .filter(PlanningSessionGroup.session_id == planning_session_id)
        .all()
    )
    group_ids = [int(g.id) for _, g in group_rows]
    group_names = [g.name for _, g in group_rows if g.name]
    group_label = ", ".join(group_names[:3])
    if len(group_names) > 3:
        group_label += f" (+{len(group_names) - 3})"

    if not group_ids:
        return

    members = (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.group_id.in_(group_ids))
        .all()
    )
    date_label = _format_date_fr(session.date)
    time_label = _format_time_range(session.start_time, int(session.duration_minutes or 0))
    title = (session.title or "").strip() or "Séance CSF"
    module_label = (session.module_label or "").strip() or None
    location = (session.location or "").strip() or None
    link_ref = f"planning:{planning_session_id}"

    notified_users: set[str] = set()
    existing = (
        db.query(LearnerNotification.user_id)
        .filter(
            LearnerNotification.link_ref == link_ref,
            LearnerNotification.kind == "session_scheduled",
        )
        .all()
    )
    already_notified: set[str] = {str(r[0]) for r in existing}

    for member in members:
        user = _resolve_user_for_member(db, member)
        email = (user.email if user and user.email else member.email or "").strip()
        if not user:
            if email:
                send_session_scheduled_email(
                    email,
                    f"[CSF] Nouvelle séance — {title}",
                    build_session_scheduled_html(
                        learner_name=_member_display_name(member, user),
                        session_title=title,
                        module_label=module_label,
                        date_label=date_label,
                        time_label=time_label,
                        location=location,
                        group_label=group_label or None,
                    ),
                )
            continue

        uid = str(user.id)
        if uid in notified_users or uid in already_notified:
            continue
        notified_users.add(uid)

        body = f"{date_label} · {time_label}"
        if location:
            body += f" · {location}"

        db.add(
            LearnerNotification(
                user_id=uid,
                kind="session_scheduled",
                title=f"Nouvelle séance — {title}",
                body=body,
                link_ref=link_ref,
            )
        )

        if email:
            send_session_scheduled_email(
                email,
                f"[CSF] Nouvelle séance — {title}",
                build_session_scheduled_html(
                    learner_name=_member_display_name(member, user),
                    session_title=title,
                    module_label=module_label,
                    date_label=date_label,
                    time_label=time_label,
                    location=location,
                    group_label=group_label or None,
                ),
            )

    try:
        db.commit()
    except Exception:
        db.rollback()
        log.exception("Échec enregistrement notifications CSF pour planning %s", planning_session_id)

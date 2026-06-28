"""Real-time admin dashboard statistics from the database."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import extract, func, text
from sqlalchemy.orm import Session

from app.persistence.models.tables import (
    AdminAuditLog,
    ApprenantGroup,
    ApprenantGroupMember,
    GroupSession,
    LearnerCertificationResult,
    LearnerProgress,
    PageVisit,
    User,
    ValidationDocument,
)


def _month_range(offset: int = 0):
    now = datetime.now(timezone.utc)
    y = now.year
    m = now.month + offset
    while m <= 0:
        m += 12
        y -= 1
    while m > 12:
        m -= 12
        y += 1
    start = datetime(y, m, 1, tzinfo=timezone.utc)
    nm = m + 1
    ny = y
    if nm > 12:
        nm = 1
        ny += 1
    end = datetime(ny, nm, 1, tzinfo=timezone.utc)
    return start, end


_FR_MONTHS = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]


def compute_kpis(db: Session) -> list[dict]:
    now = datetime.now(timezone.utc)
    cur_start, cur_end = _month_range(0)
    prev_start, prev_end = _month_range(-1)

    total_members = db.query(func.count(func.distinct(ApprenantGroupMember.email_normalized))).scalar() or 0
    members_this_month = (
        db.query(func.count(func.distinct(ApprenantGroupMember.email_normalized)))
        .filter(ApprenantGroupMember.created_at >= cur_start, ApprenantGroupMember.created_at < cur_end)
        .scalar()
    ) or 0
    members_prev_month = (
        db.query(func.count(func.distinct(ApprenantGroupMember.email_normalized)))
        .filter(ApprenantGroupMember.created_at >= prev_start, ApprenantGroupMember.created_at < prev_end)
        .scalar()
    ) or 0
    members_trend = ""
    if members_prev_month > 0:
        pct = round(((members_this_month - members_prev_month) / members_prev_month) * 100)
        sign = "+" if pct >= 0 else ""
        members_trend = f"{sign}{pct} % vs mois précédent"
    elif members_this_month > 0:
        members_trend = f"+{members_this_month} ce mois"

    certs_total = (
        db.query(func.count(LearnerCertificationResult.id))
        .filter(LearnerCertificationResult.status == "passed")
        .scalar()
    ) or 0
    certs_this_month = (
        db.query(func.count(LearnerCertificationResult.id))
        .filter(
            LearnerCertificationResult.status == "passed",
            LearnerCertificationResult.awarded_at >= cur_start,
            LearnerCertificationResult.awarded_at < cur_end,
        )
        .scalar()
    ) or 0
    certs_trend = f"+{certs_this_month}" if certs_this_month > 0 else "—"

    total_users = db.query(func.count(User.id)).scalar() or 0
    users_this_month = (
        db.query(func.count(User.id))
        .filter(
            User.role == "apprenant",
        )
        .scalar()
    ) or 0
    new_users_this_month = total_users  # approximate

    total_groups = db.query(func.count(ApprenantGroup.id)).scalar() or 0

    return [
        {
            "id": "inscrits",
            "label": "Apprenants inscrits",
            "sublabel": "Total",
            "value": str(total_members),
            "trend": members_trend,
        },
        {
            "id": "certifications",
            "label": "Certifications délivrées",
            "sublabel": "Total certifiés",
            "value": str(certs_total),
            "trend": certs_trend,
        },
        {
            "id": "groupes",
            "label": "Groupes de formation",
            "sublabel": "Actifs sur la plateforme",
            "value": str(total_groups),
            "trend": "",
        },
        {
            "id": "nouveauxComptes",
            "label": "Comptes utilisateurs",
            "sublabel": "Total plateforme",
            "value": str(total_users),
            "trend": f"{users_this_month} apprenants",
        },
    ]


def compute_top_enrolled(db: Session) -> list[dict]:
    """Top formations by number of enrolled members."""
    rows = (
        db.query(
            ApprenantGroup.name,
            func.count(ApprenantGroupMember.id).label("cnt"),
        )
        .join(ApprenantGroupMember, ApprenantGroupMember.group_id == ApprenantGroup.id)
        .group_by(ApprenantGroup.id, ApprenantGroup.name)
        .order_by(func.count(ApprenantGroupMember.id).desc())
        .limit(8)
        .all()
    )
    if not rows:
        return []
    max_count = max(r.cnt for r in rows) or 1
    return [
        {
            "title": r.name or "Formation",
            "enrollments": r.cnt,
            "slug": (r.name or "").lower().replace(" ", "-")[:30],
            "score": round((r.cnt / max_count) * 100, 1),
        }
        for r in rows
    ]


def compute_top_visited(db: Session) -> list[dict]:
    """Top pages by unique visitor sessions (from page_visit table)."""
    rows = (
        db.query(
            PageVisit.page_title,
            PageVisit.page_path,
            func.count(func.distinct(PageVisit.session_id)).label("cnt"),
        )
        .filter(PageVisit.page_title.isnot(None))
        .group_by(PageVisit.page_title, PageVisit.page_path)
        .order_by(func.count(func.distinct(PageVisit.session_id)).desc())
        .limit(8)
        .all()
    )
    if not rows:
        return []
    max_count = max(r.cnt for r in rows) or 1
    return [
        {
            "title": r.page_title or r.page_path or "Page",
            "visits": r.cnt,
            "slug": (r.page_path or "").strip("/").replace("/", "-")[:30],
            "score": round((r.cnt / max_count) * 100, 1),
        }
        for r in rows
    ]


def compute_inscription_evolution(db: Session) -> dict:
    """Monthly inscription counts for the last 6 months, split by format."""
    now = datetime.now(timezone.utc)
    labels: list[str] = []
    reconv_values: list[int] = []
    ponct_values: list[int] = []

    for offset in range(-5, 1):
        start, end = _month_range(offset)
        labels.append(_FR_MONTHS[start.month][:4])

        reconv = (
            db.query(func.count(ApprenantGroupMember.id))
            .join(ApprenantGroup, ApprenantGroup.id == ApprenantGroupMember.group_id)
            .filter(
                ApprenantGroup.format == "reconversion",
                ApprenantGroupMember.created_at >= start,
                ApprenantGroupMember.created_at < end,
            )
            .scalar()
        ) or 0
        ponct = (
            db.query(func.count(ApprenantGroupMember.id))
            .join(ApprenantGroup, ApprenantGroup.id == ApprenantGroupMember.group_id)
            .filter(
                ApprenantGroup.format == "ponctuelle",
                ApprenantGroupMember.created_at >= start,
                ApprenantGroupMember.created_at < end,
            )
            .scalar()
        ) or 0
        reconv_values.append(reconv)
        ponct_values.append(ponct)

    return {
        "labels": labels,
        "series": [
            {"id": "reconv", "name": "Reconversion", "color": "#2ea3b8", "values": reconv_values},
            {"id": "ponct", "name": "Ponctuelle", "color": "#173c60", "dashed": True, "values": ponct_values},
        ],
    }


def _activities_from_audit_log(db: Session) -> list[dict]:
    rows = (
        db.query(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .limit(20)
        .all()
    )
    if not rows:
        return []
    return [
        {
            "id": str(entry.id),
            "at": _relative_time(entry.created_at),
            "actor": entry.actor_role,
            "actorDisplay": entry.actor_name,
            "action": entry.action,
            "detail": entry.detail,
        }
        for entry in rows
    ]


def _activities_fallback(db: Session) -> list[dict]:
    """Reconstruction à la volée si admin_audit_log est vide."""
    activities: list[dict] = []

    validated_docs = (
        db.query(ValidationDocument)
        .filter(ValidationDocument.status.in_(["validated", "rejected"]))
        .order_by(ValidationDocument.reviewed_at.desc())
        .limit(5)
        .all()
    )
    for doc in validated_docs:
        dt = doc.reviewed_at or doc.updated_at or doc.created_at
        time_str = _relative_time(dt) if dt else ""
        if doc.status == "validated":
            action = f"Validation du certificat « {doc.scope_label} »"
        else:
            action = f"Rejet du document « {doc.scope_label} »"
        activities.append({
            "id": f"valdoc-{doc.id}",
            "at": time_str,
            "actor": "admin",
            "actorDisplay": "Administrateur",
            "action": action,
            "detail": f"Membre #{doc.member_id}",
        })

    recent_sessions = (
        db.query(GroupSession)
        .order_by(GroupSession.created_at.desc())
        .limit(5)
        .all()
    )
    for s in recent_sessions:
        dt = s.created_at
        time_str = _relative_time(dt) if dt else ""
        group = db.query(ApprenantGroup).filter(ApprenantGroup.id == s.group_id).first()
        group_name = group.name if group else f"Groupe #{s.group_id}"
        activities.append({
            "id": f"session-{s.id}",
            "at": time_str,
            "actor": "admin",
            "actorDisplay": "Administrateur",
            "action": f"Séance planifiée",
            "detail": f"{group_name} — {s.title or 'sans titre'}",
        })

    recent_members = (
        db.query(ApprenantGroupMember)
        .order_by(ApprenantGroupMember.created_at.desc())
        .limit(5)
        .all()
    )
    for m in recent_members:
        dt = m.created_at
        time_str = _relative_time(dt) if dt else ""
        group = db.query(ApprenantGroup).filter(ApprenantGroup.id == m.group_id).first()
        group_name = group.name if group else f"Groupe #{m.group_id}"
        name = f"{m.first_name or ''} {m.last_name or ''}".strip() or m.email
        activities.append({
            "id": f"member-{m.id}",
            "at": time_str,
            "actor": "system",
            "actorDisplay": "Système",
            "action": f"Inscription de {name}",
            "detail": group_name,
        })

    activities.sort(key=lambda a: a["at"], reverse=True)
    return activities[:20]


def compute_recent_activities(db: Session) -> list[dict]:
    """Activités récentes : journal admin_audit_log, sinon fallback métier."""
    try:
        from_audit = _activities_from_audit_log(db)
        if from_audit:
            return from_audit
    except Exception:
        pass
    try:
        return _activities_fallback(db)
    except Exception:
        return []


def _relative_time(dt: datetime) -> str:
    if dt is None:
        return ""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    if diff.days == 0:
        hours = diff.seconds // 3600
        if hours == 0:
            mins = diff.seconds // 60
            return f"Il y a {mins} min" if mins > 0 else "À l'instant"
        return f"Aujourd'hui · {dt.strftime('%H:%M')}"
    if diff.days == 1:
        return f"Hier · {dt.strftime('%H:%M')}"
    if diff.days < 7:
        return f"Il y a {diff.days} j · {dt.strftime('%H:%M')}"
    return dt.strftime("%d/%m/%Y · %H:%M")

"""Build a CV automatically from real CSF data (formations, certifications, progress)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.persistence.models.tables import (
    ApprenantGroup,
    ApprenantGroupAccess,
    ApprenantGroupMember,
    LearnerCertificationResult,
    LearnerProgress,
    User,
)


def _member_rows(db: Session, user: User) -> list[ApprenantGroupMember]:
    return (
        db.query(ApprenantGroupMember)
        .filter(ApprenantGroupMember.user_id == user.id)
        .all()
    )


def build_auto_cv(db: Session, user: User) -> dict:
    members = _member_rows(db, user)

    formations: list[dict] = []
    projects: list[dict] = []
    certifications: list[dict] = []

    for member in members:
        group = db.query(ApprenantGroup).filter(
            ApprenantGroup.id == int(member.group_id)
        ).first()
        if not group:
            continue

        group_name = group.name or "Formation CSF"
        group_format = (group.format or "ponctuelle").lower()

        progress_rows = (
            db.query(LearnerProgress)
            .filter(LearnerProgress.member_id == int(member.id))
            .order_by(LearnerProgress.id.asc())
            .all()
        )

        total_modules = len(progress_rows)
        completed = sum(
            1 for p in progress_rows
            if p.status == "completed" or p.completed_by_admin
        )
        in_progress = sum(
            1 for p in progress_rows
            if p.status == "in_progress"
        )

        if completed == total_modules and total_modules > 0:
            status = "Terminé"
        elif in_progress > 0 or completed > 0:
            status = "En cours"
        else:
            status = "Inscrit"

        formations.append({
            "id": f"auto-group-{group.id}",
            "title": group_name,
            "period": group_format.capitalize(),
            "status": f"{status} — {completed}/{total_modules} modules",
            "notes": None,
        })

        for p in progress_rows:
            if "projet" in (p.title or "").lower():
                pct = int(p.progress_percent or 0)
                projects.append({
                    "id": f"auto-project-{p.id}",
                    "title": p.title,
                    "description": f"Progression : {pct}%"
                    if pct < 100
                    else "Projet terminé",
                    "context": group_name,
                })

        cert_rows = (
            db.query(LearnerCertificationResult)
            .filter(LearnerCertificationResult.member_id == int(member.id))
            .order_by(LearnerCertificationResult.id.asc())
            .all()
        )
        for c in cert_rows:
            date_str = None
            dt = c.awarded_at or c.updated_at or c.created_at
            if dt:
                date_str = dt.strftime("%B %Y")
            certifications.append({
                "id": f"auto-cert-{c.id}",
                "title": c.title,
                "date": date_str,
                "issuer": c.issuer or "CSF",
            })

    return {
        "formations": formations,
        "projects": projects,
        "certifications": certifications,
    }

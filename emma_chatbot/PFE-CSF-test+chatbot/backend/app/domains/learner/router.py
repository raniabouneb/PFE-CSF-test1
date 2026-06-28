from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

from app.core.auth_deps import get_user_from_bearer
from app.core.config import settings
from app.core.dependencies import Db
from app.domains.admin.apprenants.service import (
    learner_certifications_data,
    learner_course_payloads,
    learner_dashboard_data,
    learner_members_for_user,
    learner_module_detail,
)
from app.domains.learner.auto_cv import build_auto_cv
from app.domains.learner.certificate_view import build_certificate_html, build_certificate_html_from_cert
from app.persistence.models.tables import (
    ApprenantGroupMember,
    LearnerCertificationResult,
    ValidationDocument,
)

router = APIRouter()


def _learner_user(db: Db, authorization: str | None):
    return get_user_from_bearer(authorization, db)


@router.get("/dashboard")
def learner_dashboard(
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _learner_user(db, authorization)
    return learner_dashboard_data(db, user)


@router.get("/formations")
def learner_formations(
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _learner_user(db, authorization)
    return {
        "greetingName": user.first_name or user.name or user.email.split("@")[0],
        "courses": learner_course_payloads(db, user),
    }


@router.get("/formations/{module_id}")
def learner_formation_detail(
    module_id: str,
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _learner_user(db, authorization)
    return learner_module_detail(db, user, module_id)


@router.get("/certifications")
def learner_certifications(
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _learner_user(db, authorization)
    return learner_certifications_data(db, user)


@router.get("/profile-summary")
def learner_profile_summary(
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _learner_user(db, authorization)
    members = learner_members_for_user(db, user)
    return {
        "name": user.name or user.email,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "groups": len(members),
        "learnerCv": user.learner_cv,
    }


@router.get("/auto-cv")
def learner_auto_cv(
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _learner_user(db, authorization)
    return build_auto_cv(db, user)


def _cert_for_learner(db: Db, user, cert_id: int) -> tuple[LearnerCertificationResult, ValidationDocument | None]:
    members = learner_members_for_user(db, user)
    member_ids = [int(m.id) for m in members]
    if not member_ids:
        raise HTTPException(status_code=404, detail="Certification introuvable.")
    cert = (
        db.query(LearnerCertificationResult)
        .filter(
            LearnerCertificationResult.id == cert_id,
            LearnerCertificationResult.member_id.in_(member_ids),
        )
        .first()
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certification introuvable.")
    if cert.status != "passed":
        raise HTTPException(status_code=403, detail="Cette certification n'est pas encore validée.")
    doc = (
        db.query(ValidationDocument)
        .filter(
            ValidationDocument.member_id == cert.member_id,
            ValidationDocument.scope_ref == cert.scope_ref,
            ValidationDocument.status == "validated",
        )
        .order_by(ValidationDocument.reviewed_at.desc())
        .first()
    )
    return cert, doc


@router.get("/certifications/{cert_id}/pdf")
def learner_cert_pdf(
    cert_id: int,
    db: Db,
    authorization: str | None = Header(None),
):
    user = _learner_user(db, authorization)
    cert, doc = _cert_for_learner(db, user, cert_id)
    if not doc or not doc.pdf_path:
        raise HTTPException(status_code=404, detail="PDF non disponible.")
    base = Path(settings.validation_docs_dir).parent
    full_path = base / doc.pdf_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Fichier PDF introuvable sur le serveur.")
    return FileResponse(
        str(full_path),
        media_type="application/pdf",
        filename=f"certificat_{cert.title.replace(' ', '_')}.pdf",
    )


@router.get("/certifications/{cert_id}/view")
def learner_cert_view(
    cert_id: int,
    db: Db,
    authorization: str | None = Header(None),
):
    user = _learner_user(db, authorization)
    cert, doc = _cert_for_learner(db, user, cert_id)
    member = db.query(ApprenantGroupMember).get(cert.member_id)
    learner_name = (
        f"{member.first_name or ''} {member.last_name or ''}".strip()
        if member
        else user.name or user.email
    )

    if doc:
        html = build_certificate_html(learner_name, doc)
    else:
        html = build_certificate_html_from_cert(learner_name, cert)
    return HTMLResponse(content=html)

"""Admin — Centre de Validation endpoints."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import extract, func

from typing import Annotated

from fastapi import Depends

from app.core.auth_deps import StaffUser, require_staff_write
from app.core.dependencies import Db
from app.core.email import send_validation_email
from app.domains.admin.journal.service import log_action
from app.domains.admin.validation import schemas as sch
from app.domains.validation.pdf_generator import (
    generate_certificate_pdf,
    generate_recommendation_pdf,
)
from app.domains.validation.service import (
    _resolve_module_label,
    compute_module_presence,
)
from app.persistence.models.tables import (
    ApprenantGroup,
    ApprenantGroupMember,
    LearnerCertificationResult,
    LearnerNotification,
    ModuleTestScore,
    User,
    ValidationDocument,
)

log = logging.getLogger(__name__)

router = APIRouter()

ValidationWriteUser = Annotated[User, Depends(require_staff_write("validation"))]


def _doc_to_queue_item(doc: ValidationDocument, member: ApprenantGroupMember, group: ApprenantGroup) -> sch.ValidationQueueItem:
    return sch.ValidationQueueItem(
        id=doc.id,
        memberId=member.id,
        memberName=f"{member.first_name or ''} {member.last_name or ''}".strip() or member.email,
        memberEmail=member.email,
        groupId=group.id,
        groupName=group.name,
        kind=doc.kind,
        scopeRef=doc.scope_ref,
        scopeLabel=doc.scope_label,
        presencePercent=doc.presence_percent,
        absenceCount=doc.absence_count,
        absenceSessions=[
            sch.AbsenceSessionItem(**s) if isinstance(s, dict) else s
            for s in (doc.absence_sessions or [])
        ],
        testScorePercent=doc.test_score_percent,
        systemResult=doc.system_result,
        systemReason=doc.system_reason,
        status=doc.status,
        submittedAt=doc.submitted_at,
    )


def _doc_to_detail(doc: ValidationDocument, member: ApprenantGroupMember, group: ApprenantGroup) -> sch.ValidationDocDetail:
    base = _doc_to_queue_item(doc, member, group)
    return sch.ValidationDocDetail(
        **base.model_dump(),
        rejectionReason=doc.rejection_reason,
        reviewedByUserId=doc.reviewed_by_user_id,
        reviewedAt=doc.reviewed_at,
        pdfPath=doc.pdf_path,
        createdAt=doc.created_at,
        updatedAt=doc.updated_at,
    )


def _load_doc(db: Db, doc_id: int) -> tuple[ValidationDocument, ApprenantGroupMember, ApprenantGroup]:
    doc = db.query(ValidationDocument).get(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document introuvable")
    member = db.query(ApprenantGroupMember).get(doc.member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    group = db.query(ApprenantGroup).get(member.group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Groupe introuvable")
    return doc, member, group


# ── Queue ────────────────────────────────────────────────────────────

@router.get("/queue", response_model=sch.ValidationQueueResponse)
def validation_queue(_staff: StaffUser, db: Db) -> sch.ValidationQueueResponse:
    docs = (
        db.query(ValidationDocument)
        .filter(ValidationDocument.status == "pending_admin")
        .order_by(ValidationDocument.submitted_at.asc())
        .all()
    )
    items: list[sch.ValidationQueueItem] = []
    for doc in docs:
        member = db.query(ApprenantGroupMember).get(doc.member_id)
        if member is None:
            continue
        group = db.query(ApprenantGroup).get(member.group_id)
        if group is None:
            continue
        items.append(_doc_to_queue_item(doc, member, group))

    return sch.ValidationQueueResponse(items=items)


@router.get("/queue/{doc_id}", response_model=sch.ValidationDocDetailResponse)
def validation_doc_detail(doc_id: int, _staff: StaffUser, db: Db) -> sch.ValidationDocDetailResponse:
    doc, member, group = _load_doc(db, doc_id)
    return sch.ValidationDocDetailResponse(data=_doc_to_detail(doc, member, group))


# ── Validate ─────────────────────────────────────────────────────────

def _member_display_name(member: ApprenantGroupMember) -> str:
    return f"{member.first_name or ''} {member.last_name or ''}".strip() or member.email


@router.post("/queue/{doc_id}/validate", response_model=sch.ValidationActionResponse)
def validation_validate(doc_id: int, admin: ValidationWriteUser, db: Db) -> sch.ValidationActionResponse:
    doc, member, group = _load_doc(db, doc_id)
    if doc.status != "pending_admin":
        raise HTTPException(status_code=400, detail=f"Document déjà traité (status={doc.status})")

    now = datetime.now(timezone.utc)

    doc.status = "validated"
    doc.reviewed_by_user_id = admin.id
    doc.reviewed_at = now

    name = _member_display_name(member)

    try:
        if doc.kind == "certificate":
            doc.pdf_path = generate_certificate_pdf(name, doc)
        else:
            doc.pdf_path = generate_recommendation_pdf(name, doc)
    except Exception:
        log.exception("Échec génération PDF pour doc %s", doc.id)
        doc.pdf_path = None

    cert = (
        db.query(LearnerCertificationResult)
        .filter_by(member_id=doc.member_id, scope_ref=doc.scope_ref)
        .first()
    )
    if cert:
        cert.status = "passed"
        cert.awarded_at = now
    else:
        cert = LearnerCertificationResult(
            member_id=doc.member_id,
            title=doc.scope_label,
            scope_ref=doc.scope_ref,
            score_percent=doc.test_score_percent,
            status="passed",
            awarded_at=now,
        )
        db.add(cert)

    if member.user_id:
        notif = LearnerNotification(
            user_id=member.user_id,
            kind="doc_validated",
            title=f"Document validé — {doc.scope_label}",
            body=f"Votre {'certificat' if doc.kind == 'certificate' else 'lettre de recommandation'} a été validé par un administrateur.",
            link_ref=doc.scope_ref,
        )
        db.add(notif)

    db.commit()

    log_action(
        db,
        admin,
        f"Validation du certificat « {doc.scope_label} »",
        f"Membre #{doc.member_id}",
        entity_kind="validation",
        entity_id=str(doc_id),
    )
    db.commit()

    send_validation_email(member.email, name, doc.kind, "validated")

    return sch.ValidationActionResponse(status="validated", pdfPath=doc.pdf_path)


# ── Reject ───────────────────────────────────────────────────────────

@router.post("/queue/{doc_id}/reject", response_model=sch.ValidationActionResponse)
def validation_reject(doc_id: int, body: sch.RejectBody, admin: ValidationWriteUser, db: Db) -> sch.ValidationActionResponse:
    doc, member, group = _load_doc(db, doc_id)
    if doc.status != "pending_admin":
        raise HTTPException(status_code=400, detail=f"Document déjà traité (status={doc.status})")

    now = datetime.now(timezone.utc)

    doc.status = "rejected"
    doc.rejection_reason = body.rejection_reason
    doc.reviewed_by_user_id = admin.id
    doc.reviewed_at = now

    cert = (
        db.query(LearnerCertificationResult)
        .filter_by(member_id=doc.member_id, scope_ref=doc.scope_ref)
        .first()
    )
    if cert:
        cert.status = "failed"
    else:
        cert = LearnerCertificationResult(
            member_id=doc.member_id,
            title=doc.scope_label,
            scope_ref=doc.scope_ref,
            score_percent=doc.test_score_percent,
            status="failed",
        )
        db.add(cert)

    if member.user_id:
        notif = LearnerNotification(
            user_id=member.user_id,
            kind="doc_rejected",
            title=f"Document rejeté — {doc.scope_label}",
            body=f"Motif : {body.rejection_reason}",
            link_ref=doc.scope_ref,
        )
        db.add(notif)

    db.commit()

    log_action(
        db,
        admin,
        f"Rejet du document « {doc.scope_label} »",
        f"Membre #{doc.member_id}",
        entity_kind="validation",
        entity_id=str(doc_id),
    )
    db.commit()

    name = _member_display_name(member)
    send_validation_email(member.email, name, doc.kind, "rejected", body.rejection_reason)

    return sch.ValidationActionResponse(status="rejected")


# ── Recalculate ──────────────────────────────────────────────────────

@router.post("/queue/{doc_id}/recalculate", response_model=sch.ValidationDocDetailResponse)
def validation_recalculate(doc_id: int, _staff: ValidationWriteUser, db: Db) -> sch.ValidationDocDetailResponse:
    """Re-compute presence/score for an existing pending document."""
    doc, member, group = _load_doc(db, doc_id)
    if doc.status != "pending_admin":
        raise HTTPException(status_code=400, detail="Seuls les documents en attente peuvent être recalculés.")

    PRESENCE_THRESHOLD = 80

    resolved_label = _resolve_module_label(db, doc.scope_ref)
    if resolved_label != doc.scope_ref:
        doc.scope_label = resolved_label

    presence = compute_module_presence(db, int(member.id), doc.scope_ref)
    doc.presence_percent = presence["presence_percent"]
    doc.absence_count = presence["absence_count"]
    doc.absence_sessions = presence["absence_sessions"]

    test_score = (
        db.query(ModuleTestScore)
        .filter_by(member_id=member.id, module_ref=doc.scope_ref)
        .first()
    )
    if test_score:
        doc.test_score_percent = test_score.score_percent

    cert_ok = doc.presence_percent >= PRESENCE_THRESHOLD
    doc.system_result = "success" if cert_ok else "failure"
    doc.system_reason = (
        f"Présence {doc.presence_percent}% (seuil {PRESENCE_THRESHOLD}%). "
        f"{doc.absence_count} absence(s) sur {presence['total_sessions']} séance(s)."
    )

    db.commit()
    db.refresh(doc)
    return sch.ValidationDocDetailResponse(data=_doc_to_detail(doc, member, group))


# ── Stats ────────────────────────────────────────────────────────────

@router.get("/stats", response_model=sch.ValidationStatsResponse)
def validation_stats(_staff: StaffUser, db: Db) -> sch.ValidationStatsResponse:
    now = datetime.now(timezone.utc)

    pending_count = (
        db.query(func.count(ValidationDocument.id))
        .filter(ValidationDocument.status == "pending_admin")
        .scalar()
    ) or 0

    validated_this_month = (
        db.query(func.count(ValidationDocument.id))
        .filter(
            ValidationDocument.status == "validated",
            extract("year", ValidationDocument.reviewed_at) == now.year,
            extract("month", ValidationDocument.reviewed_at) == now.month,
        )
        .scalar()
    ) or 0

    rejected_this_month = (
        db.query(func.count(ValidationDocument.id))
        .filter(
            ValidationDocument.status == "rejected",
            extract("year", ValidationDocument.reviewed_at) == now.year,
            extract("month", ValidationDocument.reviewed_at) == now.month,
        )
        .scalar()
    ) or 0

    return sch.ValidationStatsResponse(
        pending_count=pending_count,
        validated_this_month=validated_this_month,
        rejected_this_month=rejected_this_month,
    )

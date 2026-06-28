"""
Centre de Validation — diagnostic automatique.

Calcule la présence par module, génère les ValidationDocument
(certificat / lettre de recommandation) et notifie l'apprenant.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.persistence.models.tables import (
    ApprenantGroupMember,
    GroupSession,
    LearnerNotification,
    LearnerProgress,
    ModuleTestScore,
    PonctuelleModule,
    ReconversionPackModule,
    SessionAttendance,
    ValidationDocument,
)

PRESENCE_THRESHOLD = 80
SCORE_THRESHOLD = 70


def _resolve_module_label(db: Session, module_ref: str) -> str:
    """Resolve a target_ref like 'ponctuelle_module:68' to its human-readable title."""
    parts = module_ref.split(":", 1)
    if len(parts) != 2:
        return module_ref
    source, pk_str = parts
    try:
        pk = int(pk_str)
    except ValueError:
        return module_ref
    if source == "ponctuelle_module":
        mod = db.query(PonctuelleModule).filter(PonctuelleModule.id == pk).first()
        return mod.title if mod else module_ref
    if source == "reconversion_pack_module":
        mod = db.query(ReconversionPackModule).filter(ReconversionPackModule.id == pk).first()
        return mod.title if mod else module_ref
    return module_ref


def compute_module_presence(
    db: Session,
    member_id: int,
    module_ref: str,
) -> dict[str, Any]:
    """Return presence stats for *member_id* on sessions matching *module_ref*."""

    member = db.query(ApprenantGroupMember).get(member_id)
    group_id = int(member.group_id) if member else 0

    rows = (
        db.query(GroupSession, SessionAttendance)
        .outerjoin(
            SessionAttendance,
            and_(
                SessionAttendance.session_id == GroupSession.id,
                SessionAttendance.member_id == member_id,
            ),
        )
        .filter(
            GroupSession.group_id == group_id,
            or_(
                GroupSession.target_ref == module_ref,
                GroupSession.target_ref.is_(None),
                GroupSession.target_ref == "",
            ),
        )
        .all()
    )

    if not rows:
        return {
            "presence_percent": 0,
            "absence_count": 0,
            "absence_sessions": [],
            "total_sessions": 0,
        }

    total = len(rows)
    absent_sessions: list[dict[str, Any]] = []

    for session, attendance in rows:
        is_present = attendance is not None and attendance.status == "present"
        if not is_present:
            absent_sessions.append(
                {
                    "session_id": session.id,
                    "title": session.title,
                    "scheduled_at": session.scheduled_at.isoformat()
                    if session.scheduled_at
                    else None,
                }
            )

    present_count = total - len(absent_sessions)
    presence_percent = round(present_count / total * 100)

    return {
        "presence_percent": presence_percent,
        "absence_count": len(absent_sessions),
        "absence_sessions": absent_sessions,
        "total_sessions": total,
    }


def _create_validation_document(
    db: Session,
    *,
    member: ApprenantGroupMember,
    kind: str,
    scope_ref: str,
    scope_label: str,
    presence_percent: int,
    absence_count: int,
    absence_sessions: list[dict],
    test_score_percent: int | None,
    system_result: str,
    system_reason: str,
) -> ValidationDocument:
    """Create a ValidationDocument + matching LearnerNotification."""

    doc = ValidationDocument(
        member_id=member.id,
        kind=kind,
        scope_ref=scope_ref,
        scope_label=scope_label,
        presence_percent=presence_percent,
        absence_count=absence_count,
        absence_sessions=absence_sessions,
        test_score_percent=test_score_percent,
        system_result=system_result,
        system_reason=system_reason,
    )
    db.add(doc)
    db.flush()

    if member.user_id:
        notif_kind = "cert_available" if kind == "certificate" else "doc_validated"
        notif = LearnerNotification(
            user_id=member.user_id,
            kind=notif_kind,
            title=f"{'Certificat' if kind == 'certificate' else 'Lettre de recommandation'} — {scope_label}",
            body=f"Résultat automatique : {system_result}. {system_reason}",
            link_ref=scope_ref,
        )
        db.add(notif)

    return doc


def trigger_validation_documents_for_module(
    db: Session,
    member_id: int,
    module_ref: str,
) -> list[ValidationDocument]:
    """Idempotent: generate certificate + recommendation for a module."""

    member = db.query(ApprenantGroupMember).get(member_id)
    if member is None:
        return []

    presence = compute_module_presence(db, member_id, module_ref)
    presence_percent: int = presence["presence_percent"]

    test_score: ModuleTestScore | None = (
        db.query(ModuleTestScore)
        .filter_by(member_id=member_id, module_ref=module_ref)
        .first()
    )
    score_percent: int | None = test_score.score_percent if test_score else None

    scope_label = _resolve_module_label(db, module_ref)
    created: list[ValidationDocument] = []

    # --- Certificate ---
    existing_cert = (
        db.query(ValidationDocument)
        .filter_by(member_id=member_id, kind="certificate", scope_ref=module_ref)
        .first()
    )
    if existing_cert is None:
        cert_ok = presence_percent >= PRESENCE_THRESHOLD
        cert_reason = (
            f"Présence {presence_percent}% (seuil {PRESENCE_THRESHOLD}%). "
            f"{presence['absence_count']} absence(s) sur {presence['total_sessions']} séance(s)."
        )
        doc = _create_validation_document(
            db,
            member=member,
            kind="certificate",
            scope_ref=module_ref,
            scope_label=scope_label,
            presence_percent=presence_percent,
            absence_count=presence["absence_count"],
            absence_sessions=presence["absence_sessions"],
            test_score_percent=score_percent,
            system_result="success" if cert_ok else "failure",
            system_reason=cert_reason,
        )
        created.append(doc)

    # --- Recommendation letter (only if LMS score exists) ---
    if score_percent is not None:
        existing_rec = (
            db.query(ValidationDocument)
            .filter_by(member_id=member_id, kind="recommendation", scope_ref=module_ref)
            .first()
        )
        if existing_rec is None:
            rec_ok = presence_percent >= PRESENCE_THRESHOLD and score_percent >= SCORE_THRESHOLD
            rec_reason = (
                f"Présence {presence_percent}% (seuil {PRESENCE_THRESHOLD}%), "
                f"score LMS {score_percent}% (seuil {SCORE_THRESHOLD}%)."
            )
            doc = _create_validation_document(
                db,
                member=member,
                kind="recommendation",
                scope_ref=module_ref,
                scope_label=scope_label,
                presence_percent=presence_percent,
                absence_count=presence["absence_count"],
                absence_sessions=presence["absence_sessions"],
                test_score_percent=score_percent,
                system_result="success" if rec_ok else "failure",
                system_reason=rec_reason,
            )
            created.append(doc)

    if created:
        db.commit()

    return created


def check_and_trigger_pack_recommendation(
    db: Session,
    member_id: int,
    pack_id: int,
) -> ValidationDocument | None:
    """Create a pack-level recommendation once every module is completed."""

    member = db.query(ApprenantGroupMember).get(member_id)
    if member is None:
        return None

    scope_ref = f"reconversion_pack:{pack_id}"

    existing = (
        db.query(ValidationDocument)
        .filter_by(member_id=member_id, kind="recommendation", scope_ref=scope_ref)
        .first()
    )
    if existing is not None:
        return None

    pack_modules = (
        db.query(ReconversionPackModule)
        .filter_by(pack_id=pack_id)
        .all()
    )
    if not pack_modules:
        return None

    total_presence = 0
    total_score = 0
    score_count = 0
    all_completed = True

    for pm in pack_modules:
        mod_ref = f"reconversion_pack_module:{pm.id}"

        progress = (
            db.query(LearnerProgress)
            .filter_by(member_id=member_id, target_ref=mod_ref)
            .first()
        )
        if progress is None or progress.progress_percent < 100:
            all_completed = False
            break

        pres = compute_module_presence(db, member_id, mod_ref)
        total_presence += pres["presence_percent"]

        test_score = (
            db.query(ModuleTestScore)
            .filter_by(member_id=member_id, module_ref=mod_ref)
            .first()
        )
        if test_score:
            total_score += test_score.score_percent
            score_count += 1

    if not all_completed:
        return None

    avg_presence = round(total_presence / len(pack_modules))
    avg_score: int | None = round(total_score / score_count) if score_count else None

    rec_ok = avg_presence >= PRESENCE_THRESHOLD and (
        avg_score is not None and avg_score >= SCORE_THRESHOLD
    )
    rec_reason = (
        f"Pack complet ({len(pack_modules)} modules). "
        f"Présence moyenne {avg_presence}%, "
        f"score moyen {avg_score if avg_score is not None else 'N/A'}%."
    )

    scope_label = f"Pack reconversion #{pack_id}"

    doc = _create_validation_document(
        db,
        member=member,
        kind="recommendation",
        scope_ref=scope_ref,
        scope_label=scope_label,
        presence_percent=avg_presence,
        absence_count=0,
        absence_sessions=[],
        test_score_percent=avg_score,
        system_result="success" if rec_ok else "failure",
        system_reason=rec_reason,
    )
    db.commit()
    return doc

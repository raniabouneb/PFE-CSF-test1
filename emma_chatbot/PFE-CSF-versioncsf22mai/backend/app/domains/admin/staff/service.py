"""Gestion des invitations staff (assistantes, admins) et droits d'accès."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.auth_deps import token_role_from_user
from app.domains.admin.staff.permissions import (
    normalize_permissions,
    permissions_for_response,
    resolve_staff_permissions,
)
from app.persistence.models import StaffInvite, User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _user_name(db: Session, user_id: str | None) -> str | None:
    if not user_id:
        return None
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        return None
    return (u.name or u.email or "").strip() or None


def _find_user_by_email(db: Session, normalized: str) -> User | None:
    user = db.query(User).filter(User.email == normalized).first()
    if user:
        return user
    for u in db.query(User).all():
        if normalize_email(u.email or "") == normalized:
            return u
    return None


def _admin_count(db: Session) -> int:
    n = 0
    for u in db.query(User).all():
        if token_role_from_user(u) == "admin":
            n += 1
    return n


def _serialize_invite(db: Session, row: StaffInvite) -> dict:
    role = row.role or "assistant"
    perms = normalize_permissions(row.permissions, role=role)
    return {
        "id": int(row.id),
        "email": row.email,
        "email_normalized": row.email_normalized,
        "role": role,
        "status": row.status,
        "user_id": row.user_id,
        "invited_by": row.invited_by,
        "permissions": permissions_for_response(perms),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "userName": _user_name(db, row.user_id),
    }


def get_team(db: Session) -> list[dict]:
    rows = (
        db.query(StaffInvite)
        .order_by(StaffInvite.created_at.desc(), StaffInvite.id.desc())
        .all()
    )
    out = [_serialize_invite(db, row) for row in rows]
    covered_user_ids = {row.user_id for row in rows if row.user_id}
    covered_emails = {row.email_normalized for row in rows}

    for u in db.query(User).all():
        if token_role_from_user(u) != "admin":
            continue
        norm = normalize_email(u.email or "")
        if u.id in covered_user_ids or norm in covered_emails:
            continue
        item = {
            "id": f"admin-{u.id}",
            "email": u.email,
            "email_normalized": norm,
            "role": "admin",
            "status": "active",
            "user_id": u.id,
            "invited_by": None,
            "permissions": permissions_for_response(resolve_staff_permissions(db, u)),
            "created_at": None,
            "updated_at": None,
            "userName": (u.name or u.email or "").strip() or None,
        }
        out.append(item)
    return out


def add_staff_invite(
    db: Session,
    email: str,
    invited_by_user_id: str,
    *,
    role: str = "assistant",
    permissions: dict[str, Any] | None = None,
) -> dict:
    normalized = normalize_email(email)
    if not normalized or "@" not in normalized:
        raise HTTPException(status_code=400, detail="Adresse e-mail invalide.")

    staff_role = role.strip().lower()
    if staff_role not in ("assistant", "admin"):
        raise HTTPException(status_code=400, detail="Rôle invalide (assistant ou admin).")

    existing = (
        db.query(StaffInvite)
        .filter(StaffInvite.email_normalized == normalized)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Cet email a déjà été invité.")

    user = _find_user_by_email(db, normalized)

    if user and user.id == invited_by_user_id and staff_role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas modifier votre propre accès depuis cette page.",
        )
    if user and token_role_from_user(user) == "admin" and staff_role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Retirez d'abord les droits administrateur avant de passer en assistante.",
        )

    perms = normalize_permissions(permissions, role=staff_role)
    now = datetime.now(timezone.utc)

    if user:
        user.role = staff_role
        invite = StaffInvite(
            email=normalized,
            email_normalized=normalized,
            role=staff_role,
            status="active",
            user_id=user.id,
            invited_by=invited_by_user_id,
            permissions=perms,
            created_at=now,
            updated_at=now,
        )
    else:
        invite = StaffInvite(
            email=normalized,
            email_normalized=normalized,
            role=staff_role,
            status="pending",
            user_id=None,
            invited_by=invited_by_user_id,
            permissions=perms,
            created_at=now,
            updated_at=now,
        )

    db.add(invite)
    db.commit()
    db.refresh(invite)
    return _serialize_invite(db, invite)


def update_staff_permissions(
    db: Session,
    invite_id: int,
    permissions: dict[str, Any],
    *,
    current_admin_id: str,
) -> dict:
    invite = db.query(StaffInvite).filter(StaffInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Membre introuvable.")
    role = invite.role or "assistant"
    invite.permissions = normalize_permissions(permissions, role=role)
    invite.updated_at = datetime.now(timezone.utc)
    if invite.user_id:
        u = db.query(User).filter(User.id == invite.user_id).first()
        if u and invite.status == "active":
            u.role = role
    db.commit()
    db.refresh(invite)
    return _serialize_invite(db, invite)


def revoke_staff_invite(db: Session, invite_id: int, current_admin_id: str) -> dict:
    invite = db.query(StaffInvite).filter(StaffInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation introuvable.")

    if invite.user_id == current_admin_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas retirer votre propre accès.")

    if invite.role == "admin" and invite.user_id and _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Impossible de retirer le dernier administrateur.")

    if invite.user_id:
        user = db.query(User).filter(User.id == invite.user_id).first()
        if user:
            user.role = "apprenant"

    db.delete(invite)
    db.commit()
    return {"ok": True}


def revoke_admin_user(db: Session, user_id: str, current_admin_id: str) -> dict:
    if user_id == current_admin_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas retirer votre propre accès.")

    if _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Impossible de retirer le dernier administrateur.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or token_role_from_user(user) != "admin":
        raise HTTPException(status_code=404, detail="Administrateur introuvable.")

    user.role = "apprenant"
    norm = normalize_email(user.email or "")
    for invite in db.query(StaffInvite).filter(StaffInvite.user_id == user_id).all():
        db.delete(invite)
    pending = (
        db.query(StaffInvite)
        .filter(StaffInvite.email_normalized == norm)
        .all()
    )
    for invite in pending:
        db.delete(invite)

    db.commit()
    return {"ok": True}


def apply_pending_staff_invites(db: Session, user: User) -> int:
    normalized = normalize_email(user.email or "")
    if not normalized:
        return 0

    pending = (
        db.query(StaffInvite)
        .filter(
            StaffInvite.email_normalized == normalized,
            StaffInvite.status == "pending",
        )
        .all()
    )
    if not pending:
        return 0

    now = datetime.now(timezone.utc)
    for invite in pending:
        user.role = invite.role or "assistant"
        invite.status = "active"
        invite.user_id = user.id
        invite.updated_at = now

    db.commit()
    return len(pending)

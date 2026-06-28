"""Droits lecture / écriture par section du tableau de bord admin."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from sqlalchemy.orm import Session

from app.core.auth_deps import token_role_from_user
from app.persistence.models import StaffInvite, User

STAFF_SECTIONS = (
    "dashboard",
    "apprenants",
    "catalogue",
    "planning",
    "validation",
    "journal",
)

SectionPerm = dict[str, bool]
PermissionsMap = dict[str, SectionPerm]

_DEFAULT_ASSISTANT: PermissionsMap = {
    "dashboard": {"read": True, "write": False},
    "apprenants": {"read": True, "write": True},
    "catalogue": {"read": True, "write": False},
    "planning": {"read": True, "write": True},
    "validation": {"read": True, "write": False},
    "journal": {"read": True, "write": False},
}

_FULL_ACCESS: PermissionsMap = {s: {"read": True, "write": True} for s in STAFF_SECTIONS}


def _normalize_section_perm(raw: Any) -> SectionPerm:
    if not isinstance(raw, dict):
        return {"read": False, "write": False}
    return {
        "read": bool(raw.get("read")),
        "write": bool(raw.get("write")),
    }


def normalize_permissions(raw: dict[str, Any] | None, *, role: str) -> PermissionsMap:
    base = deepcopy(_FULL_ACCESS if role == "admin" else _DEFAULT_ASSISTANT)
    if not raw:
        return base
    for section in STAFF_SECTIONS:
        if section in raw and isinstance(raw[section], dict):
            base[section] = _normalize_section_perm(raw[section])
    return base


def permissions_for_response(perms: PermissionsMap) -> dict[str, dict[str, bool]]:
    return {k: {"read": v["read"], "write": v["write"]} for k, v in perms.items()}


def _invite_for_user(db: Session, user: User) -> StaffInvite | None:
    if user.id:
        row = (
            db.query(StaffInvite)
            .filter(StaffInvite.user_id == user.id)
            .order_by(StaffInvite.id.desc())
            .first()
        )
        if row:
            return row
    from app.domains.admin.staff.service import normalize_email

    norm = normalize_email(user.email or "")
    if not norm:
        return None
    return (
        db.query(StaffInvite)
        .filter(StaffInvite.email_normalized == norm)
        .order_by(StaffInvite.id.desc())
        .first()
    )


def resolve_staff_permissions(db: Session, user: User) -> PermissionsMap:
    role = token_role_from_user(user)
    if role == "admin":
        invite = _invite_for_user(db, user)
        if invite and invite.permissions:
            return normalize_permissions(invite.permissions, role="admin")
        return deepcopy(_FULL_ACCESS)
    if role == "assistant":
        invite = _invite_for_user(db, user)
        raw = invite.permissions if invite else None
        return normalize_permissions(raw, role="assistant")
    return {s: {"read": False, "write": False} for s in STAFF_SECTIONS}


def can_read_section(db: Session, user: User, section: str) -> bool:
    if token_role_from_user(user) not in ("admin", "assistant"):
        return False
    perms = resolve_staff_permissions(db, user)
    return perms.get(section, {}).get("read", False)


def can_write_section(db: Session, user: User, section: str) -> bool:
    if token_role_from_user(user) not in ("admin", "assistant"):
        return False
    perms = resolve_staff_permissions(db, user)
    return perms.get(section, {}).get("write", False)

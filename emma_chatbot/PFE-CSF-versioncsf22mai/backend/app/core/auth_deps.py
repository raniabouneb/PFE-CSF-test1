"""Authentification JWT (Bearer) et garde « admin » pour les routes `/api/v1/admin/*`."""

from __future__ import annotations

from typing import Annotated

import jwt as pyjwt
from fastapi import Depends, Header, HTTPException
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db
from app.persistence.models import User

_VALID_ROLES = frozenset({"apprenant", "visiteur", "admin", "assistant"})
_ROLE_ALIASES: dict[str, str] = {
    "administrator": "admin",
    "administrateur": "admin",
    "superadmin": "admin",
    "super_admin": "admin",
    "root": "admin",
}


def normalize_role(role: str | None) -> str:
    if not role:
        return "apprenant"
    r = str(role).strip().lower().strip("'\"")
    r = _ROLE_ALIASES.get(r, r)
    return r if r in _VALID_ROLES else "apprenant"


def token_role_from_user(u: User) -> str:
    raw = getattr(u, "role", None)
    return normalize_role(raw)


def get_user_from_bearer(authorization: str | None, db: Session) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = pyjwt.decode(token, settings.auth_secret, algorithms=["HS256"])
    except InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Session invalide") from e
    uid = payload.get("sub")
    if not uid or not isinstance(uid, str):
        raise HTTPException(status_code=401, detail="Session invalide")
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return u


def require_admin(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    u = get_user_from_bearer(authorization, db)
    if token_role_from_user(u) != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return u


AdminUser = Annotated[User, Depends(require_admin)]


def require_staff(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    u = get_user_from_bearer(authorization, db)
    if token_role_from_user(u) not in ("admin", "assistant"):
        raise HTTPException(status_code=403, detail="Accès réservé au staff.")
    return u


StaffUser = Annotated[User, Depends(require_staff)]


def require_staff_write(section: str):
    """Staff avec droit d'écriture sur une section (admins complets inclus)."""

    def _dep(
        db: Annotated[Session, Depends(get_db)],
        authorization: Annotated[str | None, Header()] = None,
    ) -> User:
        from app.domains.admin.staff.permissions import can_write_section

        u = get_user_from_bearer(authorization, db)
        if token_role_from_user(u) not in ("admin", "assistant"):
            raise HTTPException(status_code=403, detail="Accès réservé au staff.")
        if not can_write_section(db, u, section):
            raise HTTPException(status_code=403, detail="Modification non autorisée.")
        return u

    return _dep


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Any authenticated user (no role check)."""
    return get_user_from_bearer(authorization, db)


CurrentUser = Annotated[User, Depends(get_current_user)]

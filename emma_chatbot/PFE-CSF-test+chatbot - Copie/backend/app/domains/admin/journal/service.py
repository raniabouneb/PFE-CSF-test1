"""Journal d'audit admin (écriture dans admin_audit_log)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.auth_deps import token_role_from_user
from app.persistence.models.tables import AdminAuditLog


def log_action(
    db: Session,
    actor,
    action: str,
    detail: str | None = None,
    entity_kind: str | None = None,
    entity_id: str | None = None,
) -> None:
    """Enregistre une action dans admin_audit_log. Ne lève jamais d'exception."""
    try:
        if actor is None:
            role = "system"
            name = "Système"
            actor_id = None
        else:
            role = token_role_from_user(actor)
            if role not in ("admin", "assistant"):
                role = "admin"
            first = getattr(actor, "first_name", None) or ""
            last = getattr(actor, "last_name", None) or ""
            name = f"{first} {last}".strip() or getattr(actor, "email", "Inconnu")
            actor_id = str(actor.id)
        entry = AdminAuditLog(
            actor_id=actor_id,
            actor_role=role,
            actor_name=name,
            action=action,
            detail=detail,
            entity_kind=entity_kind,
            entity_id=str(entity_id) if entity_id is not None else None,
        )
        db.add(entry)
        db.flush()
    except Exception:
        # Évite PendingRollbackError si un appelant fait commit() après un échec d'INSERT.
        try:
            db.rollback()
        except Exception:
            pass

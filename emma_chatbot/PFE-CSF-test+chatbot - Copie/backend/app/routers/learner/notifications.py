"""API notifications apprenant (cloche dashboard)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.auth_deps import CurrentUser
from app.core.dependencies import Db
from app.persistence.models import LearnerNotification

router = APIRouter()


class NotificationItemOut(BaseModel):
    id: int
    kind: str
    title: str
    body: str | None
    linkRef: str | None
    isRead: bool
    createdAt: str | None


class NotificationsListResponse(BaseModel):
    items: list[NotificationItemOut]


@router.get("/notifications", response_model=NotificationsListResponse)
def list_notifications(user: CurrentUser, db: Db) -> NotificationsListResponse:
    now = datetime.now(timezone.utc)
    rows = (
        db.query(LearnerNotification)
        .filter(LearnerNotification.user_id == user.id)
        .order_by(LearnerNotification.created_at.desc(), LearnerNotification.id.desc())
        .limit(50)
        .all()
    )
    items: list[NotificationItemOut] = []
    for row in rows:
        if row.expires_at and row.expires_at < now:
            continue
        items.append(
            NotificationItemOut(
                id=int(row.id),
                kind=row.kind,
                title=row.title,
                body=row.body,
                linkRef=row.link_ref,
                isRead=bool(row.is_read),
                createdAt=row.created_at.isoformat() if row.created_at else None,
            )
        )
    return NotificationsListResponse(items=items)


@router.post("/notifications/{notification_id}/read")
def mark_read(notification_id: int, user: CurrentUser, db: Db) -> dict:
    row = (
        db.query(LearnerNotification)
        .filter(
            LearnerNotification.id == notification_id,
            LearnerNotification.user_id == user.id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification introuvable.")
    row.is_read = True
    db.commit()
    return {"ok": True}

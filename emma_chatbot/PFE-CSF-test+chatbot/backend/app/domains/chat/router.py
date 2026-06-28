from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import jwt as pyjwt
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import Db
from app.persistence.models import AIConversation, AIConversationFile, AIMessage, User

router = APIRouter()

_GUEST_TTL_HOURS = 24


def _ai_base() -> str:
    import os

    base = (
        os.getenv("CSF_AI_SERVICE_URL")
        or os.getenv("CSF_AI_URL")
        or "http://127.0.0.1:8001"
    ).strip()
    return base.rstrip("/")


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _expires_at() -> datetime:
    return _now_utc() + timedelta(hours=_GUEST_TTL_HOURS)


def _user_from_bearer_optional(db: Session, authorization: str | None) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = pyjwt.decode(token, settings.auth_secret, algorithms=["HS256"])
    except InvalidTokenError:
        return None
    uid = payload.get("sub")
    if not uid or not isinstance(uid, str):
        return None
    return db.query(User).filter(User.id == uid).first()


def _assert_owner(conv: AIConversation, user: User | None, guest_session_id: str | None) -> None:
    if user is not None and conv.user_id == user.id:
        return
    if user is None and guest_session_id and conv.guest_session_id == guest_session_id:
        return
    raise HTTPException(status_code=403, detail="Conversation non autorisée.")


def _conv_payload(c: AIConversation) -> dict:
    return {
        "id": c.id,
        "external_session_id": c.external_session_id,
        "title": c.title,
        "status": c.status,
        "is_temporary": bool(c.is_temporary),
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


class InitSessionBody(BaseModel):
    guest_session_id: str | None = None
    external_session_id: str | None = None


class SendChatBody(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str = Field(..., min_length=1)
    guest_session_id: str | None = None
    conversation_id: str | None = None
    cv_profile: dict | None = None


class MigrateGuestBody(BaseModel):
    guest_session_id: str = Field(..., min_length=1)


class CleanupGuestBody(BaseModel):
    guest_session_id: str = Field(..., min_length=1)


@router.post("/session/init")
def chat_session_init(
    body: InitSessionBody,
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _user_from_bearer_optional(db, authorization)
    ext = (body.external_session_id or "").strip() or str(uuid.uuid4())
    guest = (body.guest_session_id or "").strip() or str(uuid.uuid4())

    q = db.query(AIConversation).filter(AIConversation.external_session_id == ext)
    if user is not None:
        q = q.filter(AIConversation.user_id == user.id)
    else:
        q = q.filter(AIConversation.user_id.is_(None), AIConversation.guest_session_id == guest)
    conv = q.first()
    if conv is None:
        conv = AIConversation(
            id=str(uuid.uuid4()),
            user_id=user.id if user is not None else None,
            guest_session_id=None if user is not None else guest,
            external_session_id=ext,
            title=None,
            status="active",
            is_temporary=user is None,
            expires_at=None if user is not None else _expires_at(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return {"conversation": _conv_payload(conv), "guest_session_id": guest if user is None else None}


@router.get("/conversations")
def list_conversations(
    db: Db,
    authorization: str | None = Header(None),
    x_guest_session_id: str | None = Header(None),
) -> list[dict]:
    user = _user_from_bearer_optional(db, authorization)
    q = db.query(AIConversation)
    if user is not None:
        q = q.filter(AIConversation.user_id == user.id)
    else:
        guest = (x_guest_session_id or "").strip()
        if not guest:
            return []
        q = q.filter(AIConversation.user_id.is_(None), AIConversation.guest_session_id == guest)
    rows = q.order_by(AIConversation.updated_at.desc()).all()
    return [_conv_payload(r) for r in rows]


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: str,
    db: Db,
    authorization: str | None = Header(None),
    x_guest_session_id: str | None = Header(None),
) -> list[dict]:
    user = _user_from_bearer_optional(db, authorization)
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")
    _assert_owner(conv, user, (x_guest_session_id or "").strip() or None)
    rows = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conv.id)
        .order_by(AIMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "message_type": m.message_type,
            "metadata": m.meta or {},
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in rows
    ]


@router.post("/migrate-guest")
def migrate_guest(
    body: MigrateGuestBody,
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _user_from_bearer_optional(db, authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Connexion requise.")
    guest = body.guest_session_id.strip()
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.user_id.is_(None), AIConversation.guest_session_id == guest)
        .all()
    )
    if not convs:
        return {"migrated_conversations": 0, "migrated_files": 0}

    conv_ids = [c.id for c in convs]
    (
        db.query(AIConversation)
        .filter(AIConversation.id.in_(conv_ids))
        .update(
            {
                AIConversation.user_id: user.id,
                AIConversation.is_temporary: False,
                AIConversation.expires_at: None,
                AIConversation.guest_session_id: None,
            },
            synchronize_session=False,
        )
    )
    files_count = (
        db.query(AIConversationFile)
        .filter(AIConversationFile.guest_session_id == guest, AIConversation.user_id.is_(None))
        .update(
            {
                AIConversationFile.user_id: user.id,
                AIConversationFile.guest_session_id: None,
                AIConversationFile.expires_at: None,
            },
            synchronize_session=False,
        )
    )
    db.commit()
    return {"migrated_conversations": len(convs), "migrated_files": int(files_count or 0)}


@router.post("/guest/cleanup")
def cleanup_guest(
    body: CleanupGuestBody,
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    # Cleanup réservé au mode invité (si connecté, on ne supprime rien).
    user = _user_from_bearer_optional(db, authorization)
    if user is not None:
        return {"deleted_conversations": 0}
    guest = body.guest_session_id.strip()
    conv_ids = [
        c.id
        for c in (
            db.query(AIConversation.id)
            .filter(AIConversation.user_id.is_(None), AIConversation.guest_session_id == guest)
            .all()
        )
    ]
    if not conv_ids:
        return {"deleted_conversations": 0}
    deleted = (
        db.query(AIConversation)
        .filter(AIConversation.id.in_(conv_ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"deleted_conversations": int(deleted or 0)}


@router.post("/send")
def send_chat(
    body: SendChatBody,
    db: Db,
    authorization: str | None = Header(None),
) -> dict:
    user = _user_from_bearer_optional(db, authorization)
    guest = (body.guest_session_id or "").strip() or str(uuid.uuid4())
    ext = body.session_id.strip()

    if body.conversation_id:
        conv = db.query(AIConversation).filter(AIConversation.id == body.conversation_id).first()
        if conv is None:
            raise HTTPException(status_code=404, detail="Conversation introuvable.")
        _assert_owner(conv, user, guest if user is None else None)
    else:
        q = db.query(AIConversation).filter(AIConversation.external_session_id == ext)
        if user is not None:
            q = q.filter(AIConversation.user_id == user.id)
        else:
            q = q.filter(AIConversation.user_id.is_(None), AIConversation.guest_session_id == guest)
        conv = q.first()
        if conv is None:
            conv = AIConversation(
                id=str(uuid.uuid4()),
                user_id=user.id if user is not None else None,
                guest_session_id=None if user is not None else guest,
                external_session_id=ext,
                title=(body.message.strip()[:120] or None),
                status="active",
                is_temporary=user is None,
                expires_at=None if user is not None else _expires_at(),
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

    user_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        role="user",
        content=body.message.strip(),
        message_type="text",
        meta={},
    )
    db.add(user_msg)
    db.commit()

    upstream_payload: dict[str, object] = {"message": body.message.strip(), "session_id": ext}
    if body.cv_profile and isinstance(body.cv_profile, dict):
        upstream_payload["cv_profile"] = body.cv_profile

    try:
        r = httpx.post(f"{_ai_base()}/chat", json=upstream_payload, timeout=90.0)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Service IA indisponible: {e}") from e
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text[:300])

    try:
        j = r.json()
    except Exception:
        j = {"response": r.text}
    reply = str(j.get("response") or "").strip() or "(Réponse vide)"

    ai_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        role="assistant",
        content=reply,
        message_type="text",
        meta={"upstream_status": r.status_code},
    )
    conv.updated_at = _now_utc()
    if user is None:
        conv.expires_at = _expires_at()
    db.add(ai_msg)
    db.commit()

    return {
        "status": "success",
        "conversation_id": conv.id,
        "session_id": ext,
        "guest_session_id": guest if user is None else None,
        "response": reply,
    }


@router.post("/send-with-cv")
async def send_chat_with_cv(
    db: Db,
    authorization: str | None = Header(None),
    session_id: str = Form(...),
    message: str = Form(""),
    guest_session_id: str = Form(""),
    cv: UploadFile = File(...),
) -> dict:
    user = _user_from_bearer_optional(db, authorization)
    guest = (guest_session_id or "").strip() or str(uuid.uuid4())
    ext = session_id.strip()
    text = (message or "").strip()

    q = db.query(AIConversation).filter(AIConversation.external_session_id == ext)
    if user is not None:
        q = q.filter(AIConversation.user_id == user.id)
    else:
        q = q.filter(AIConversation.user_id.is_(None), AIConversation.guest_session_id == guest)
    conv = q.first()
    if conv is None:
        conv = AIConversation(
            id=str(uuid.uuid4()),
            user_id=user.id if user is not None else None,
            guest_session_id=None if user is not None else guest,
            external_session_id=ext,
            title=(text[:120] or f"CV: {cv.filename or 'upload'}"),
            status="active",
            is_temporary=user is None,
            expires_at=None if user is not None else _expires_at(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    if text:
        db.add(
            AIMessage(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                role="user",
                content=text,
                message_type="text",
            meta={},
            )
        )
    db.add(
        AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            role="user",
            content=f"CV upload: {cv.filename or 'cv.pdf'}",
            message_type="cv_summary",
            meta={"filename": cv.filename},
        )
    )
    db.add(
        AIConversationFile(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            user_id=user.id if user is not None else None,
            guest_session_id=None if user is not None else guest,
            file_kind="cv",
            storage_key=f"inline:{cv.filename or 'cv.pdf'}",
            original_name=cv.filename,
            mime_type=cv.content_type,
            size_bytes=None,
            parsed_payload=None,
            expires_at=None if user is not None else _expires_at(),
        )
    )
    db.commit()

    form = {"session_id": ext, "message": text}
    files = {"cv": (cv.filename or "cv.pdf", await cv.read(), cv.content_type or "application/pdf")}
    try:
        r = httpx.post(f"{_ai_base()}/chat/with-cv", data=form, files=files, timeout=120.0)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Service IA indisponible: {e}") from e
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text[:300])

    try:
        j = r.json()
    except Exception:
        j = {"response": r.text}
    reply = str(j.get("response") or "").strip() or "(Réponse vide)"
    cv_profile = j.get("cv_profile")

    db.add(
        AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            role="assistant",
            content=reply,
            message_type="text",
            meta={"cv_profile": cv_profile} if isinstance(cv_profile, dict) else {},
        )
    )
    conv.updated_at = _now_utc()
    if user is None:
        conv.expires_at = _expires_at()
    db.commit()

    return {
        "status": "success",
        "conversation_id": conv.id,
        "session_id": ext,
        "guest_session_id": guest if user is None else None,
        "response": reply,
        "cv_profile": cv_profile if isinstance(cv_profile, dict) else None,
    }

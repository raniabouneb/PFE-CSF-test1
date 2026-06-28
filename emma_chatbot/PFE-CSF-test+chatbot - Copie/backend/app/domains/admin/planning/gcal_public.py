"""Route OAuth Google Calendar accessible sans Bearer (redirect Google)."""

from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.dependencies import Db
from app.domains.admin.planning import gcal_service

router = APIRouter()


@router.get("/gcal/callback")
def gcal_oauth_callback(
    db: Db,
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
) -> RedirectResponse:
    base = settings.google_calendar_frontend_redirect.rstrip("/")
    if error:
        return RedirectResponse(url=f"{base}?gcal=error&reason={error}")
    if not code or not state:
        return RedirectResponse(url=f"{base}?gcal=error&reason=missing_params")
    try:
        _user_id, return_to = gcal_service.exchange_code_and_store(db, code, state)
    except Exception:
        return RedirectResponse(url=f"{base}?gcal=error&reason=exchange_failed")
    if return_to == "learner":
        base = settings.google_calendar_learner_frontend_redirect.rstrip("/")
    return RedirectResponse(url=f"{base}?gcal=connected")

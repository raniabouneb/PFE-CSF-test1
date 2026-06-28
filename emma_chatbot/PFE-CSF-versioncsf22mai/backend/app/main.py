import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from pydantic import BaseModel

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.domains.admin.planning.gcal_public import router as gcal_public_router
from app.core.dependencies import Db
from app.domains.auth.router import router as auth_router
from app.persistence.models.tables import PageVisit
from app.routers.learner.formations import router as learner_formations_router
from app.routers.learner.notifications import router as learner_notifications_router

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_UPLOADS_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads"))
_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="CSF API", version="1.0.0")


class _CsfBackendProbeHeaders(BaseHTTPMiddleware):
    """En-têtes sur toutes les réponses : si tu ne les vois pas (F12 → Réseau), ce n’est pas ce backend."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-CSF-Backend-Revision"] = "2"
        response.headers["X-CSF-Backend-Root"] = str(_BACKEND_ROOT)
        return response


app.add_middleware(_CsfBackendProbeHeaders)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3008",
        "http://127.0.0.1:3008",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
# OAuth Google Calendar : pas d'auth Bearer (redirect depuis accounts.google.com)
app.include_router(gcal_public_router, prefix="/api/v1/admin/planning")
app.include_router(api_v1_router, prefix="/api/v1")
app.include_router(
    learner_formations_router,
    prefix="/api/learner/formations",
    tags=["learner-formations"],
)
app.include_router(
    learner_notifications_router,
    prefix="/api/learner",
    tags=["learner-notifications"],
)


app.mount("/uploads", StaticFiles(directory=str(_UPLOADS_DIR)), name="uploads")


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "csf-api",
        "certificationsApiRevision": 2,
        "backendRoot": str(_BACKEND_ROOT),
        "googleOAuthConfigured": bool(
            settings.google_client_id and settings.google_client_secret
        ),
    }


class TrackVisitBody(BaseModel):
    page_path: str
    page_title: str | None = None
    session_id: str


@app.post("/api/public/track-visit", status_code=204)
def track_visit(body: TrackVisitBody, db: Db):
    db.add(PageVisit(
        page_path=body.page_path[:500],
        page_title=(body.page_title or "")[:200] or None,
        session_id=body.session_id[:64],
    ))
    db.commit()
    return None

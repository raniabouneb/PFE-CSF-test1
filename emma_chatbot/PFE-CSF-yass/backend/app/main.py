from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.api.v1.router import api_v1_router
from app.domains.auth.router import router as auth_router

# Dossier `backend/` réellement chargé par Python (affiché dans /health pour lever toute ambiguïté).
_BACKEND_ROOT = Path(__file__).resolve().parent.parent

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
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health")
def health():
    """
    `certificationsApiRevision` et `backendRoot` doivent être présents.
    Si tu ne les vois pas : le navigateur ou un autre processus ne pointe pas vers ce code (recharger sans cache, Ctrl+F5).
    """
    return {
        "ok": True,
        "service": "csf-api",
        "certificationsApiRevision": 2,
        "backendRoot": str(_BACKEND_ROOT),
    }

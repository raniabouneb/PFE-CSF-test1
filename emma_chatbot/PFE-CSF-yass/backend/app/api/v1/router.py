"""Agrégation des routes `/api/v1/*`."""

from fastapi import APIRouter

from app.domains.certifications.router import router as certifications_router
from app.domains.formation.router import router as formation_router
from app.domains.home.router import router as home_router
from app.domains.ponctuelle.router import router as ponctuelle_router
from app.domains.reconversion.router import router as reconversion_router

api_v1_router = APIRouter()
api_v1_router.include_router(certifications_router, prefix="/certifications", tags=["certifications"])
api_v1_router.include_router(home_router, prefix="/home", tags=["home"])
api_v1_router.include_router(
    formation_router,
    prefix="/formation",
    tags=["formation"],
)
api_v1_router.include_router(
    reconversion_router,
    prefix="/reconversion",
    tags=["reconversion"],
)
api_v1_router.include_router(
    ponctuelle_router,
    prefix="/ponctuelle",
    tags=["ponctuelle"],
)

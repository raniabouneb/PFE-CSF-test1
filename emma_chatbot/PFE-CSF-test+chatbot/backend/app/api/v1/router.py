"""Agrégation des routes `/api/v1/*`."""

from fastapi import APIRouter

from app.domains.admin.router import router as admin_router
from app.domains.certifications.router import router as certifications_router
from app.domains.chat.router import router as chat_router
from app.domains.formation.router import router as formation_router
from app.domains.home.router import router as home_router
from app.domains.learner.router import router as learner_router
from app.domains.module_supports.router import router as module_supports_router
from app.domains.ponctuelle.router import router as ponctuelle_router
from app.domains.reconversion.router import router as reconversion_router

api_v1_router = APIRouter()
api_v1_router.include_router(admin_router, prefix="/admin", tags=["admin"])
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
api_v1_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_v1_router.include_router(learner_router, prefix="/learner", tags=["learner"])
api_v1_router.include_router(
    module_supports_router,
    prefix="/module-supports",
    tags=["module-supports"],
)

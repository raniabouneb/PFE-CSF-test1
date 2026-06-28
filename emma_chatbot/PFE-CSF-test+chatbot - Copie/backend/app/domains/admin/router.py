from fastapi import APIRouter

from app.core.auth_deps import AdminUser
from app.domains.admin.apprenants.router import router as apprenants_router
from app.domains.admin.catalogue.router import router as catalogue_router
from app.domains.admin.dashboard.router import router as dashboard_router
from app.domains.admin.journal.router import router as journal_router
from app.domains.admin.planning.router import router as planning_router
from app.domains.admin.staff.router import router as staff_router
from app.domains.admin.validation.router import router as validation_router
from app.routers.admin.sessions import router as sessions_router

router = APIRouter()

# Route de base utile pour vérifier le câblage backend admin.
@router.get("/health")
def admin_health(_admin: AdminUser) -> dict:
    return {"ok": True, "service": "csf-admin-api"}


router.include_router(dashboard_router, prefix="/dashboard", tags=["admin-dashboard"])
router.include_router(apprenants_router, prefix="/apprenants", tags=["admin-apprenants"])
router.include_router(catalogue_router, prefix="/catalogue", tags=["admin-catalogue"])
router.include_router(journal_router, prefix="/journal", tags=["admin-journal"])
router.include_router(planning_router, prefix="/planning", tags=["admin-planning"])
router.include_router(validation_router, prefix="/validation", tags=["admin-validation"])
router.include_router(sessions_router, prefix="/sessions", tags=["admin-sessions"])
router.include_router(staff_router)


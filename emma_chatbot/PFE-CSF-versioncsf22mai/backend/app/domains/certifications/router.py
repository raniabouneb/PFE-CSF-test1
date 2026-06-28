import logging

from fastapi import APIRouter

from app.core.dependencies import Db
from app.domains.certifications import (
    get_certifications_debug_snapshot,
    get_certifications_page,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/debug")
def certifications_debug(db: Db) -> dict:
    """
    Vérifie que le backend joignable par BACKEND_URL est à jour (revision 2) et montre un extrait
    des lignes certification_card (même source que la page).
    """
    try:
        return get_certifications_debug_snapshot(db)
    except Exception:
        logger.exception("GET /certifications/debug")
        return {"revision": 0, "error": "database", "readOnlyOnGet": False}


@router.get("/page")
def certifications_page(db: Db) -> dict:
    try:
        return get_certifications_page(db)
    except Exception:
        logger.exception("GET /certifications/page")
        return {
            "hero": None,
            "sections": [],
            "meta": {
                "syncFromModulesOk": False,
                "revision": 0,
                "readOnlyOnGet": False,
            },
        }

import logging

from fastapi import APIRouter, Query

from app.core.dependencies import Db
from app.domains.catalog.formation_search import formation_search_suggestions
from app.domains.catalog.formation_topic_cards import get_formation_topic_cards_payload

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/search")
def formation_search(
    db: Db,
    q: str = Query("", max_length=140, description="Texte recherché (titre formation / module)"),
) -> dict:
    """Suggestions pour la barre de recherche site (reconversion, ponctuelle, modules, certifications)."""
    try:
        return formation_search_suggestions(db, q)
    except Exception:
        logger.exception("GET /formation/search")
        return {"suggestions": []}


@router.get("/topic-cards")
def formation_topic_cards(db: Db) -> dict | None:
    """Grilles reconversion / ponctuelle sur `/formation` (null si vide ou erreur BD)."""
    try:
        return get_formation_topic_cards_payload(db)
    except Exception:
        logger.exception("GET /formation/topic-cards")
        return None

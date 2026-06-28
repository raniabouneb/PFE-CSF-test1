from fastapi import APIRouter, HTTPException

from app.core.dependencies import Db
from app.domains.catalog.hors_pack import list_hors_pack_modules
from app.domains.reconversion.topic import (
    find_reconversion_topic_by_slug,
    load_reconversion_topic_from_db,
)

router = APIRouter()


@router.get("/topics/{slug}/page-data")
def reconversion_topic_page_data(slug: str, db: Db) -> dict:
    """Données complètes page reconversion pour ce slug (sans fallback statique)."""
    data = load_reconversion_topic_from_db(db, slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Parcours inconnu")
    return data


@router.get("/topics/{slug}/hors-pack-modules")
def reconversion_hors_pack_modules_only(slug: str, db: Db) -> list[dict]:
    """Modules hors pack seuls (utile si le reste de la page est en fallback statique)."""
    topic = find_reconversion_topic_by_slug(db, slug)
    if topic is None:
        return []
    return list_hors_pack_modules(db, topic.slug)

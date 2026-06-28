from fastapi import APIRouter, HTTPException

from app.core.dependencies import Db
from app.domains.catalog.ponctuelle_formations import (
    get_ponctuelle_formation_by_slug,
    list_ponctuelle_formations,
)

router = APIRouter()


@router.get("/formations")
def ponctuelle_formations_list(db: Db) -> list[dict]:
    return list_ponctuelle_formations(db)


@router.get("/formations/{slug}")
def ponctuelle_formation_detail(slug: str, db: Db) -> dict:
    data = get_ponctuelle_formation_by_slug(db, slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Formation inconnue")
    return data

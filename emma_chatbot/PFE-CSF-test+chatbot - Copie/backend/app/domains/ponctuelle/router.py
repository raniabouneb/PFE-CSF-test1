from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import Db
from app.domains.catalog.ponctuelle_formations import (
    get_all_ponctuelle_modules_catalog,
    get_ponctuelle_formation_by_slug,
    list_ponctuelle_formations,
    search_ponctuelle_modules,
)

router = APIRouter()


@router.get("/modules/search")
def ponctuelle_modules_search(
    db: Db,
    q: str = Query("", max_length=140, description="Filtre sur le titre du module"),
) -> dict:
    return {"modules": search_ponctuelle_modules(db, q)}


@router.get("/modules/catalog")
def ponctuelle_modules_catalog(db: Db) -> dict:
    return get_all_ponctuelle_modules_catalog(db)


@router.get("/formations")
def ponctuelle_formations_list(db: Db) -> list[dict]:
    return list_ponctuelle_formations(db)


@router.get("/formations/{slug}")
def ponctuelle_formation_detail(slug: str, db: Db) -> dict:
    data = get_ponctuelle_formation_by_slug(db, slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Formation inconnue")
    return data

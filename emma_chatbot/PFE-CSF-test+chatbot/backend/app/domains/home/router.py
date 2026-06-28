from fastapi import APIRouter

from app.core.dependencies import Db
from app.domains.home.partners import get_home_partners_payload

router = APIRouter()


@router.get("/partners-data")
def home_partners_data(db: Db) -> dict:
    """Collaborations + logos partenaires (accueil)."""
    return get_home_partners_payload(db)

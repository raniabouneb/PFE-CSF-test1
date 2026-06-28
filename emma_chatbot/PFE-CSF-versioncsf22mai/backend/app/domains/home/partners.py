"""Données sections partenaires & collaborations (page d’accueil)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.persistence.models import Collaboration, HomePageHero, PartnerLogo


def get_home_partners_payload(db: Session) -> dict[str, Any]:
    collaborations = (
        db.query(Collaboration).order_by(Collaboration.id.asc()).all()
    )
    partners = (
        db.query(PartnerLogo)
        .order_by(PartnerLogo.sort_order.asc(), PartnerLogo.id.asc())
        .all()
    )

    try:
        hero_row = db.query(HomePageHero).filter(HomePageHero.id == 1).first()
    except SQLAlchemyError:
        hero_row = None
    hero_bg = (hero_row.background_image.strip() if hero_row else "") or None

    return {
        "heroBackgroundImage": hero_bg,
        "collaborations": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "image": c.background_image,
            }
            for c in collaborations
        ],
        "partners": [
            {"id": p.id, "name": p.name, "logo": p.logo_path} for p in partners
        ],
    }

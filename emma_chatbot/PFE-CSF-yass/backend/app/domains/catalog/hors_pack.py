"""Modules « hors pack » : `ponctuelle_module` pour un slug = parcours reconversion."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.persistence.models import PonctuelleFormation, PonctuelleModule


def list_hors_pack_modules(db: Session, reconversion_slug: str) -> list[dict]:
    rows = (
        db.query(PonctuelleModule)
        .join(
            PonctuelleFormation,
            PonctuelleModule.formation_id == PonctuelleFormation.id,
        )
        .filter(PonctuelleFormation.slug == reconversion_slug)
        .order_by(PonctuelleModule.sort_order.asc(), PonctuelleModule.id.asc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "title": m.title,
            "kind": "course",
            "imageUrl": m.image_url,
            "description": m.description,
            "duration": m.duration,
            "practice": m.practice,
            "project": m.project,
            "evaluation": m.evaluation,
            "hoverDetail": m.hover_detail,
            "certified": m.is_certified,
        }
        for m in rows
    ]

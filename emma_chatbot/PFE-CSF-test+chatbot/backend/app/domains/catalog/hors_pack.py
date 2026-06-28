"""Modules « hors pack » : `ponctuelle_module` pour un slug = parcours reconversion."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.domains.catalog.module_support_public import batch_supports_map, supports_payload_for_module
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
    ids = [int(m.id) for m in rows]
    sup_map = batch_supports_map(db, "ponctuelle_module", ids)
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
            "supports": supports_payload_for_module(sup_map.get(int(m.id), [])),
        }
        for m in rows
    ]

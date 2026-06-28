"""Backfill certification_card ← modules (INSERT seulement, jamais appelé par les routes HTTP).

Les routes GET ne doivent pas appeler ce module : un chargement de page ne doit pas recréer une carte
supprimée. Usage : `python -m scripts.run_sync_and_summary` depuis le dossier backend.
"""

from __future__ import annotations

import logging
import os

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _sync_allowed() -> bool:
    """Backfill désactivé par défaut : évite de recréer une carte supprimée si le trigger SQL n’a pas tourné."""
    return os.getenv("CSF_ALLOW_CERTIFICATION_SYNC", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


# Pas de DELETE ici : aucune suppression automatique au chargement d’une route API (évite les surprises
# en base). Nettoyage des cartes « exclues » : trigger côté module / suppression manuelle.
# Pas de ON CONFLICT UPDATE : les modifications manuelles dans certification_card sont conservées.
_SYNC_SQL = """
INSERT INTO certification_card (
  sort_order,
  category,
  title,
  subtitle,
  description,
  skills,
  icon_key,
  is_certified,
  module_id,
  image_url
)
SELECT
  m.sort_order,
  COALESCE(
    NULLIF(TRIM(BOTH FROM COALESCE(
      NULLIF(TRIM(BOTH FROM tc_topic.ponctuelle_slug::text), ''),
      tc_topic.titre
    )), ''),
    'Autres'
  ),
  m.title,
  NULL,
  m.description,
  NULL,
  NULL,
  m.is_certified,
  m.id,
  m.image_url
FROM ponctuelle_module m
JOIN ponctuelle_formation pf ON pf.id = m.formation_id
LEFT JOIN formation_topic_card tc_topic
  ON tc_topic.id = pf.topic_card_id
WHERE COALESCE(m.exclude_from_certifications_page, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM certification_card c WHERE c.module_id = m.id
  )
ON CONFLICT (module_id) DO NOTHING;
"""


def sync_certification_cards_from_modules(db: Session) -> bool:
    """
    Insère seulement les cartes manquantes (nouveaux modules / anciennes données sans carte).
    Ne met pas à jour les lignes déjà présentes.

    Désactivé sauf si la variable d’environnement CSF_ALLOW_CERTIFICATION_SYNC=1 (le script
    run_sync_and_summary la définit). Sinon une suppression manuelle + module non « exclu »
    pourrait être annulée au prochain backfill.
    """
    if not _sync_allowed():
        logger.info(
            "sync_certification_cards_from_modules ignoré "
            "(définir CSF_ALLOW_CERTIFICATION_SYNC=1 pour un backfill ponctuel)"
        )
        return True
    try:
        db.execute(text(_SYNC_SQL))
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error("sync_certification_cards_from_modules failed: %s", e, exc_info=True)
        return False

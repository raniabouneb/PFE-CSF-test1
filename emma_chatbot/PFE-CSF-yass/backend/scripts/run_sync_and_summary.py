"""
Déclenche le sync certification_card ← ponctuelle_module et affiche un résumé.
Usage (depuis le dossier backend, avec .env renseigné) :

  python -m scripts.run_sync_and_summary
"""

from __future__ import annotations

import os
import sys

# Permet « python -m scripts.run_sync_and_summary » depuis backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.persistence.session import SessionLocal
from app.domains.certifications.card_sync import sync_certification_cards_from_modules


def main() -> None:
    os.environ.setdefault("CSF_ALLOW_CERTIFICATION_SYNC", "1")
    db = SessionLocal()
    try:
        try:
            ok = sync_certification_cards_from_modules(db)
            print("sync_certification_cards_from_modules:", "OK" if ok else "ÉCHEC (voir logs)")
            n = db.execute(text("SELECT COUNT(*) FROM certification_card")).scalar()
            print("certification_card.count:", n)
            rows = db.execute(
                text(
                    """
                    SELECT pf.id, pf.slug, pf.topic_card_id, COUNT(m.id) AS mods
                    FROM ponctuelle_formation pf
                    LEFT JOIN ponctuelle_module m ON m.formation_id = pf.id
                    GROUP BY pf.id, pf.slug, pf.topic_card_id
                    ORDER BY pf.id
                    """
                )
            ).fetchall()
            print("ponctuelle_formation (id, slug, topic_card_id, modules):")
            for r in rows:
                print(" ", r)
        except OperationalError as e:
            print("Connexion PostgreSQL impossible :", e)
            print(
                "Remplace DATABASE_URL dans backend/.env par la chaine Supabase (Settings / Database)."
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()

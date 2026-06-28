"""Applique les colonnes manquantes sur public.users (auth / profil)."""
from __future__ import annotations

import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from sqlalchemy import create_engine, text

from app.core.config import settings

STATEMENTS = [
    "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name VARCHAR(120)",
    "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name VARCHAR(120)",
    "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(32)",
    "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS learner_cv JSONB",
    "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'apprenant'",
]


def main() -> None:
    engine = create_engine(settings.database_url)
    with engine.begin() as conn:
        for stmt in STATEMENTS:
            conn.execute(text(stmt))
    print("OK: colonnes users synchronisées.")


if __name__ == "__main__":
    main()

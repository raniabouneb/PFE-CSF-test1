"""One-shot: exécute sql/migrate_certification_card_v2.sql (usage: DATABASE_URL=... python -m scripts.run_migrate_certification_card_v2)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

_scripts_dir = Path(__file__).resolve().parent
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))
from db_url import postgres_url_for_psycopg2

backend_root = _scripts_dir.parent
sql_path = backend_root / "sql" / "migrate_certification_card_v2.sql"


def main() -> None:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print("DATABASE_URL manquant.", file=sys.stderr)
        sys.exit(1)
    url = postgres_url_for_psycopg2(url)
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        url = "postgresql+psycopg2://" + url.removeprefix("postgresql://")

    raw = sql_path.read_text(encoding="utf-8")
    lines = [ln for ln in raw.splitlines() if not ln.strip().startswith("--")]
    cleaned = "\n".join(lines)
    parts = [p.strip() for p in cleaned.split(";") if p.strip()]
    stmts = [p + ";" for p in parts]
    filtered = [
        s
        for s in stmts
        if not s.strip().upper().startswith("BEGIN")
        and not s.strip().upper().startswith("COMMIT")
    ]

    engine = create_engine(url, pool_pre_ping=True)
    with engine.begin() as conn:
        for i, stmt in enumerate(filtered, 1):
            conn.execute(text(stmt))
            print(f"OK {i}/{len(filtered)}")
    print("Migration terminée.")


if __name__ == "__main__":
    main()

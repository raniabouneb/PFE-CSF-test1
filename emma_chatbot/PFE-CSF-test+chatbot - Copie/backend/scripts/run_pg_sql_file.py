"""Exécute un fichier .sql PostgreSQL (y compris blocs $$ … $$). Charge DATABASE_URL depuis l’environnement ou backend/.env."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

_scripts_dir = Path(__file__).resolve().parent
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))
from db_url import postgres_url_for_psycopg2

backend_root = _scripts_dir.parent


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if val and val[0] in "\"'":
            q = val[0]
            if len(val) >= 2 and val[-1] == q:
                val = val[1:-1]
        if key not in os.environ:
            os.environ[key] = val


def _strip_full_line_comments(raw: str) -> str:
    out: list[str] = []
    for ln in raw.splitlines():
        s = ln.strip()
        if s.startswith("--"):
            continue
        out.append(ln)
    return "\n".join(out)


def _split_statements(sql: str) -> list[str]:
    """Découpe sur `;` hors des blocs dollar-quoted ($$…$$)."""
    parts: list[str] = []
    buf: list[str] = []
    i, n = 0, len(sql)
    in_dollar = False
    while i < n:
        if not in_dollar and i + 1 < n and sql[i : i + 2] == "$$":
            in_dollar = True
            buf.append("$$")
            i += 2
            continue
        if in_dollar and i + 1 < n and sql[i : i + 2] == "$$":
            in_dollar = False
            buf.append("$$")
            i += 2
            continue
        if not in_dollar and sql[i] == ";":
            stmt = "".join(buf).strip()
            if stmt:
                parts.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(sql[i])
        i += 1
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return parts


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/run_pg_sql_file.py <path/to.sql>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    sql_path = (backend_root / rel).resolve() if not os.path.isabs(rel) else Path(rel)

    _load_dotenv(backend_root / ".env")
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print("DATABASE_URL manquant (backend/.env ou variable d’environnement).", file=sys.stderr)
        sys.exit(1)
    url = postgres_url_for_psycopg2(url)
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        url = "postgresql+psycopg2://" + url.removeprefix("postgresql://")

    raw = sql_path.read_text(encoding="utf-8")
    cleaned = _strip_full_line_comments(raw)
    stmts = _split_statements(cleaned)
    if not stmts:
        print("Aucune instruction SQL.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(url, pool_pre_ping=True)
    with engine.begin() as conn:
        for i, stmt in enumerate(stmts, 1):
            conn.execute(text(stmt))
            print(f"OK {i}/{len(stmts)}")
    print("Terminé.")


if __name__ == "__main__":
    main()

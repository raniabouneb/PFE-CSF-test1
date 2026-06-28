#!/usr/bin/env python3
"""
Réinitialise les données apprenant puis charge le scénario démo dashboard.

Usage:
  cd backend
  python scripts/run_dashboard_demo.py
  python scripts/run_dashboard_demo.py --email demo@csf-formation.fr
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
SQL_DEMO = BACKEND_ROOT / "sql" / "demo"


def load_env() -> None:
    try:
        from dotenv import load_dotenv

        load_dotenv(BACKEND_ROOT / ".env", override=True)
    except ImportError:
        pass


def patch_demo_email(sql: str, email: str) -> str:
    return re.sub(
        r"(v_demo_email\s+TEXT\s*:=\s*')[^']*(')",
        rf"\1{email}\2",
        sql,
        count=1,
    )


def main() -> int:
    load_env()
    parser = argparse.ArgumentParser(description="Reset + seed dashboard client demo")
    parser.add_argument(
        "--email",
        default="benyoussefdaziz1@gmail.com",
        help="Email du compte apprenant de démo",
    )
    parser.add_argument("--reset-only", action="store_true")
    parser.add_argument("--seed-only", action="store_true")
    args = parser.parse_args()

    import os
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        print("DATABASE_URL manquant dans backend/.env", file=sys.stderr)
        return 1

    def clean_database_url(dsn: str) -> str:
        """Supabase ajoute schema= / uselibpqcompat= que psycopg2 refuse."""
        parsed = urlparse(dsn)
        if not parsed.query:
            return dsn
        qs = parse_qs(parsed.query, keep_blank_values=True)
        for key in ("schema", "uselibpqcompat"):
            qs.pop(key, None)
        new_query = urlencode({k: v[0] for k, v in qs.items()})
        return urlunparse(parsed._replace(query=new_query))

    url = clean_database_url(url)

    try:
        import psycopg2
    except ImportError:
        print("Installez psycopg2-binary : pip install psycopg2-binary", file=sys.stderr)
        return 1

    reset_sql = (SQL_DEMO / "01_reset_learner_platform.sql").read_text(encoding="utf-8")
    seed_sql = patch_demo_email(
        (SQL_DEMO / "02_seed_dashboard_client_demo.sql").read_text(encoding="utf-8"),
        args.email.replace("'", "''"),
    )

    conn = psycopg2.connect(url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            if not args.seed_only:
                print("→ Réinitialisation plateforme apprenant…")
                cur.execute(reset_sql)
                print("  OK")
            if not args.reset_only:
                print(f"→ Scénario démo pour {args.email}…")
                cur.execute(seed_sql)
                print("  OK")
    finally:
        conn.close()

    print("\nConnexion : http://localhost:3000/authentification/connexion")
    print("Dashboard  : http://localhost:3000/dashboard")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

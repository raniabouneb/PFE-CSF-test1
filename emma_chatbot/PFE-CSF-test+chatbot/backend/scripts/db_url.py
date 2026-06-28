"""Normalise DATABASE_URL (Prisma) pour psycopg2 / SQLAlchemy."""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

_PRISMA_ONLY_PG_QUERY_KEYS = frozenset(
    {
        "schema",
        "uselibpqcompat",
        "connection_limit",
        "pool_timeout",
        "socket_timeout",
        "statement_cache_size",
        "pgbouncer",
    }
)


def postgres_url_for_psycopg2(url: str) -> str:
    parsed = urlparse(url.strip())
    if not parsed.query:
        return url.strip()
    pairs = [
        (k, v)
        for k, v in parse_qsl(parsed.query, keep_blank_values=True)
        if k.lower() not in _PRISMA_ONLY_PG_QUERY_KEYS
    ]
    new_query = urlencode(pairs) if pairs else ""
    return urlunparse(parsed._replace(query=new_query))

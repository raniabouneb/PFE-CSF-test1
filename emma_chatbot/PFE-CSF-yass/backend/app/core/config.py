from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# `app/core/config.py` → backend = parents[2]
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BACKEND_ROOT / ".env"


# Prisma adds query flags that its own client understands; libpq/psycopg2 reject them.
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


def _postgres_url_for_psycopg2(url: str) -> str:
    """Strip Prisma-only query params so the URL is valid for libpq/psycopg2."""
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


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        return _postgres_url_for_psycopg2(v) if isinstance(v, str) else v

    auth_secret: str
    google_client_id: str = ""
    google_client_secret: str = ""
    # Même URI que Next (Google Console) — ex. http://localhost:3000/api/auth/google/callback
    google_redirect_uri: str = "http://localhost:3000/api/auth/google/callback"


settings = Settings()

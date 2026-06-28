import re
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# `app/core/config.py` → backend = parents[2]
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BACKEND_ROOT / ".env"
_FRONTEND_ENV_PATH = _BACKEND_ROOT.parent / "frontend" / ".env"

_SMTP_FRONTEND_KEYS = frozenset(
    {
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_PASSWORD",
        "SMTP_FROM",
        "SMTP_FROM_EMAIL",
        "SMTP_FROM_NAME",
    }
)


def _read_frontend_smtp_env() -> dict[str, str]:
    """SMTP du frontend/.env — même convention que les routes Next (send-email, etc.)."""
    if not _FRONTEND_ENV_PATH.is_file():
        return {}
    out: dict[str, str] = {}
    for line in _FRONTEND_ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if key not in _SMTP_FRONTEND_KEYS:
            continue
        val = val.strip().strip('"').strip("'")
        if val:
            out[key] = val
    return out


def _parse_smtp_from(raw: str) -> tuple[str, str]:
    """Ex. ``CSF <user@gmail.com>`` → (nom, email)."""
    raw = raw.strip()
    m = re.match(r"^(.+?)\s*<([^>]+)>\s*$", raw)
    if m:
        return m.group(1).strip().strip('"'), m.group(2).strip()
    return "CSF Formation", raw


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
    # Connexion utilisateur (proxy Next) — ex. http://localhost:3008/api/auth/google/callback
    google_redirect_uri: str = "http://localhost:3000/api/auth/google/callback"
    # OAuth Google Calendar (admin planning)
    google_calendar_redirect_uri: str = (
        "http://localhost:3000/api/gcal/callback"
    )
    google_calendar_frontend_redirect: str = "http://localhost:3000/admin/planning"
    google_calendar_learner_frontend_redirect: str = "http://localhost:3000/dashboard"
    google_calendar_timezone: str = "Africa/Tunis"

    # Admin — stockage local des PDF (chemins relatifs persistés en `module_support.file_path`)
    admin_uploads_dir: str = str(_BACKEND_ROOT / "uploads" / "module-supports")
    admin_max_upload_mb: int = 25
    # URL publique du backend pour les liens `supports` dans les JSON (ex. https://api.example.com)
    backend_public_url: str = "http://127.0.0.1:8010"

    # SMTP — validation + séances CSF (no-op when smtp_host is empty).
    # Accepte les mêmes noms que frontend/.env : SMTP_PASS, SMTP_FROM, etc.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = Field(
        default="",
        validation_alias=AliasChoices("SMTP_PASSWORD", "SMTP_PASS"),
    )
    smtp_from_email: str = ""
    smtp_from_name: str = "CSF Formation"

    @model_validator(mode="before")
    @classmethod
    def _merge_frontend_smtp(cls, data: Any) -> Any:
        fe = _read_frontend_smtp_env()
        if not fe:
            return data

        merged: dict[str, Any] = dict(data) if isinstance(data, dict) else {}

        def _has(*keys: str) -> bool:
            return any(merged.get(k) for k in keys)

        def _set(field: str, value: str | int) -> None:
            merged[field] = value

        if not _has("smtp_host", "SMTP_HOST") and fe.get("SMTP_HOST"):
            _set("smtp_host", fe["SMTP_HOST"])
        if not _has("smtp_user", "SMTP_USER") and fe.get("SMTP_USER"):
            _set("smtp_user", fe["SMTP_USER"])
        if not _has("smtp_password", "SMTP_PASSWORD", "SMTP_PASS"):
            pwd = fe.get("SMTP_PASS") or fe.get("SMTP_PASSWORD")
            if pwd:
                # AliasChoices n'accepte que SMTP_PASS / SMTP_PASSWORD en entrée
                _set("SMTP_PASS", pwd)
        if not _has("smtp_from_email", "SMTP_FROM_EMAIL"):
            if fe.get("SMTP_FROM_EMAIL"):
                _set("smtp_from_email", fe["SMTP_FROM_EMAIL"])
            elif fe.get("SMTP_FROM"):
                name, email = _parse_smtp_from(fe["SMTP_FROM"])
                _set("smtp_from_email", email)
                if not _has("smtp_from_name", "SMTP_FROM_NAME"):
                    _set("smtp_from_name", fe.get("SMTP_FROM_NAME") or name)
        if fe.get("SMTP_PORT") and not _has("smtp_port", "SMTP_PORT"):
            try:
                _set("smtp_port", int(fe["SMTP_PORT"]))
            except ValueError:
                pass

        return merged

    # Validation documents (PDF output)
    validation_docs_dir: str = str(_BACKEND_ROOT / "uploads" / "validation-docs")

    # URL publique du frontend (logo e-mails, liens dashboard)
    frontend_public_url: str = "http://localhost:3000"


settings = Settings()

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

_ENGINE_KWARGS: dict = {
    "pool_pre_ping": True,
}

# Supabase pooler session-mode can easily hit its low session cap in local dev
# when hot-reload spawns multiple processes. NullPool avoids keeping idle
# connections checked out between requests.
if "pooler.supabase.com" in settings.database_url:
    _ENGINE_KWARGS["poolclass"] = NullPool

engine = create_engine(settings.database_url, **_ENGINE_KWARGS)


@event.listens_for(engine, "connect")
def _set_pg_search_path(dbapi_connection, _connection_record) -> None:
    """Évite les erreurs « function does not exist » si le search_path client omet `public` (ex. Supabase)."""
    cur = dbapi_connection.cursor()
    try:
        cur.execute("SET search_path TO public")
    finally:
        cur.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

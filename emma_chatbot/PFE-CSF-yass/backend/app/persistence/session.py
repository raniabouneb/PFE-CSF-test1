from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


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

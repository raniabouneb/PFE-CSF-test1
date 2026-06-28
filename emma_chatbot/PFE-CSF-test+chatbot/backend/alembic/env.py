from logging.config import fileConfig

import sqlalchemy as sa
from sqlalchemy import engine_from_config, pool

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Inject DATABASE_URL from app settings so we don't duplicate it in .ini
# ---------------------------------------------------------------------------
from app.core.config import settings  # noqa: E402

config.set_main_option("sqlalchemy.url", settings.database_url)

# ---------------------------------------------------------------------------
# Import ALL models so FK references (e.g. → users) resolve correctly.
# The include_name filter below ensures only the 10 new tables are tracked.
# ---------------------------------------------------------------------------
from app.persistence.models import tables as _legacy_models  # noqa: E402, F401
from app.models import lms as _lms_models  # noqa: E402, F401
from app.persistence.session import Base  # noqa: E402

target_metadata = Base.metadata

# Only track the 10 new LMS tables — leave legacy tables to raw SQL migrations.
_LMS_TABLES: frozenset[str] = frozenset({
    "modules",
    "pack_reconversion",
    "pack_modules",
    "groupes",
    "enrollments",
    "sessions",
    "session_groups",
    "attendance",
    "progression",
    "pack_progression",
})


def _include_name(name, type_, parent_names):
    if type_ == "table":
        return name in _LMS_TABLES
    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_name=_include_name,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        connection.execute(sa.text("SET search_path TO public"))
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_name=_include_name,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

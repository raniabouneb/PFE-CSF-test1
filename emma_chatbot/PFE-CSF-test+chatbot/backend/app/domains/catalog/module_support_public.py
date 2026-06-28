"""URLs publiques des fichiers `module_support` (PDF)."""

from sqlalchemy.exc import ProgrammingError

from app.core.config import settings


def module_support_file_public_url(support_id: int) -> str:
    base = settings.backend_public_url.strip().rstrip("/")
    return f"{base}/api/v1/module-supports/{support_id}/file"


def supports_payload_for_module(
    db_rows: list,  # list[ModuleSupport] — évite import circulaire dans les signatures
) -> list[dict]:
    out: list[dict] = []
    for r in db_rows:
        out.append(
            {
                "id": str(r.id),
                "fileName": r.file_name,
                "url": module_support_file_public_url(int(r.id)),
            }
        )
    return out


def batch_supports_map(
    db, module_source: str, module_ids: list[int]
) -> dict[int, list]:
    """module_id -> liste de lignes ORM ModuleSupport (tri par id)."""
    if not module_ids:
        return {}
    from app.persistence.models import ModuleSupport

    try:
        rows = (
            db.query(ModuleSupport)
            .filter(ModuleSupport.module_source == module_source, ModuleSupport.module_id.in_(module_ids))
            .order_by(ModuleSupport.id.asc())
            .all()
        )
    except ProgrammingError as e:
        # Migration non encore appliquée (ex: table module_support absente) -> fallback sans crash.
        orig = getattr(e, "orig", None)
        pgcode = getattr(orig, "pgcode", None)
        if pgcode == "42P01":
            db.rollback()
            return {}
        raise
    m: dict[int, list] = {}
    for r in rows:
        m.setdefault(int(r.module_id), []).append(r)
    return m

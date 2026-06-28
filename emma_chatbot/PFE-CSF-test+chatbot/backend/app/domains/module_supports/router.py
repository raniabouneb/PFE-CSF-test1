"""Téléchargement public des PDF rattachés aux modules (sans auth)."""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.dependencies import Db
from app.persistence.models import ModuleSupport

router = APIRouter()


@router.get("/{support_id}/file")
def download_module_support_file(support_id: int, db: Db) -> FileResponse:
    row = db.query(ModuleSupport).filter(ModuleSupport.id == support_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Fichier introuvable.")

    root = Path(settings.admin_uploads_dir).resolve()
    try:
        full = (root / row.file_path).resolve()
    except OSError as e:
        raise HTTPException(status_code=404, detail="Fichier introuvable.") from e

    root_s = str(root)
    full_s = str(full)
    if not full_s.startswith(root_s):
        raise HTTPException(status_code=404, detail="Fichier introuvable.")
    if not full.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable.")

    return FileResponse(
        path=str(full),
        media_type=row.mime_type or "application/pdf",
        filename=row.file_name or f"support-{support_id}.pdf",
    )

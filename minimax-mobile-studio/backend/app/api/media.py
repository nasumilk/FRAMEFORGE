from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import Media


router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{media_id}")
def get_media(media_id: str, download: bool = False, db: Session = Depends(get_db)) -> FileResponse:
    media = db.get(Media, media_id)
    if not media:
        raise AppError("MEDIA_NOT_FOUND", "Media was not found.", 404)
    path = Path(media.path).resolve()
    root = settings.comfyui_output_dir.resolve()
    try:
        path.relative_to(root)
    except ValueError as exc:
        raise AppError("MEDIA_NOT_FOUND", "Media path is outside the allowed output directory.", 404) from exc
    if not path.is_file():
        raise AppError("MEDIA_NOT_FOUND", "Media file no longer exists.", 404)
    disposition = "attachment" if download else "inline"
    return FileResponse(path, media_type=media.mime_type, filename=media.filename, content_disposition_type=disposition)

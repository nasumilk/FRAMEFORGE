from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import Upload
from app.schemas.generation import UploadResponse


router = APIRouter(prefix="/uploads", tags=["uploads"])

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}


async def _save_upload(file: UploadFile, media_type: str, db: Session) -> Upload:
    original_name = Path(file.filename or "upload").name
    suffix = Path(original_name).suffix.lower()
    content_type = (file.content_type or "").lower()
    extensions = IMAGE_EXTENSIONS if media_type == "image" else VIDEO_EXTENSIONS
    mime_valid = content_type.startswith(f"{media_type}/")
    if suffix not in extensions or not mime_valid:
        raise AppError(
            "UPLOAD_INVALID",
            f"Unsupported {media_type} file. Allowed extensions: {', '.join(sorted(extensions))}.",
            422,
        )

    directory = settings.upload_dir / media_type
    directory.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{suffix}"
    destination = (directory / stored_name).resolve()
    try:
        destination.relative_to(settings.upload_dir.resolve())
    except ValueError as exc:
        raise AppError("UPLOAD_INVALID", "Invalid upload destination.", 422) from exc

    max_bytes = settings.max_upload_mb * 1024 * 1024
    size = 0
    try:
        with destination.open("xb") as handle:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:
                    raise AppError("UPLOAD_TOO_LARGE", f"Upload exceeds {settings.max_upload_mb} MB.", 413)
                handle.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    upload = Upload(
        type=media_type,
        original_filename=original_name,
        stored_filename=stored_name,
        path=str(destination),
        mime_type=content_type,
        size=size,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


@router.post("/image", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)) -> UploadResponse:
    return UploadResponse.model_validate(await _save_upload(file, "image", db))


@router.post("/video", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(file: UploadFile = File(...), db: Session = Depends(get_db)) -> UploadResponse:
    return UploadResponse.model_validate(await _save_upload(file, "video", db))

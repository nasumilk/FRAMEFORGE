from __future__ import annotations

import io
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from starlette.datastructures import Headers, UploadFile

from app.api import uploads
from app.core.errors import AppError
from app.db.session import Base


@pytest.fixture
def db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.mark.asyncio
async def test_image_upload_is_stored_with_generated_name(tmp_path, monkeypatch, db: Session) -> None:
    monkeypatch.setattr(uploads, "settings", SimpleNamespace(upload_dir=tmp_path, max_upload_mb=1))
    file = UploadFile(
        io.BytesIO(b"\x89PNG\r\n\x1a\nfixture"),
        filename="portrait.png",
        headers=Headers({"content-type": "image/png"}),
    )

    result = await uploads._save_upload(file, "image", db)

    assert result.original_filename == "portrait.png"
    assert result.stored_filename != result.original_filename
    assert result.path.startswith(str(tmp_path))
    assert result.size == 15


@pytest.mark.asyncio
async def test_upload_rejects_extension_mismatch(tmp_path, monkeypatch, db: Session) -> None:
    monkeypatch.setattr(uploads, "settings", SimpleNamespace(upload_dir=tmp_path, max_upload_mb=1))
    file = UploadFile(
        io.BytesIO(b"not an image"),
        filename="portrait.txt",
        headers=Headers({"content-type": "image/png"}),
    )

    with pytest.raises(AppError) as error:
        await uploads._save_upload(file, "image", db)

    assert error.value.code == "UPLOAD_INVALID"

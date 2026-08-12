from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _path_env(name: str, default: Path) -> Path:
    raw = os.getenv(name)
    path = Path(raw) if raw else default
    return path if path.is_absolute() else PROJECT_ROOT / path


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    backend_host: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    comfyui_http_url: str = os.getenv("COMFYUI_HTTP_URL", "http://127.0.0.1:8188").rstrip("/")
    comfyui_ws_url: str = os.getenv("COMFYUI_WS_URL", "ws://127.0.0.1:8188/ws")
    database_path: Path = _path_env("DATABASE_PATH", PROJECT_ROOT / "data/database/app.db")
    upload_dir: Path = _path_env("UPLOAD_DIR", PROJECT_ROOT / "data/uploads")
    output_dir: Path = _path_env("OUTPUT_DIR", PROJECT_ROOT / "data/outputs")
    thumbnail_dir: Path = _path_env("THUMBNAIL_DIR", PROJECT_ROOT / "data/thumbnails")
    workflow_dir: Path = _path_env("WORKFLOW_DIR", PROJECT_ROOT / "workflows")
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "500"))
    allowed_origins: tuple[str, ...] = tuple(
        item.strip()
        for item in os.getenv(
            "ALLOWED_ORIGINS",
            "http://127.0.0.1:3300,http://localhost:3300,https://daichinopc.tail9ad2a3.ts.net:8444",
        ).split(",")
        if item.strip()
    )

    def ensure_directories(self) -> None:
        for path in (self.database_path.parent, self.upload_dir, self.output_dir, self.thumbnail_dir):
            path.mkdir(parents=True, exist_ok=True)


settings = Settings()


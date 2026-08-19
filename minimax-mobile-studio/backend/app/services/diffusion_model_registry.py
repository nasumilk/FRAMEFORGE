from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

from app.core.config import settings
from app.core.errors import AppError


REFERENCE_MODES = {"reference_image", "reference_video", "character_motion"}
ALL_MODES = ["t2v", "i2v", *sorted(REFERENCE_MODES)]
MODEL_EXTENSIONS = {".safetensors", ".sft", ".ckpt", ".pt", ".pt2", ".pth", ".bin", ".pkl"}


@dataclass(frozen=True)
class DiffusionModelMetadata:
    filename: str
    name: str
    family: str
    precision: str
    size: int
    native_modes: list[str]
    experimental_modes: list[str]

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class DiffusionModelRegistry:
    def __init__(self, model_root: Path | None = None):
        self.model_root = model_root or settings.comfyui_model_dir / "diffusion_models"

    def list(self) -> list[DiffusionModelMetadata]:
        if not self.model_root.is_dir():
            return []
        models: list[DiffusionModelMetadata] = []
        model_files = (
            path for path in self.model_root.rglob("*")
            if path.is_file() and path.suffix.lower() in MODEL_EXTENSIONS
        )
        for path in sorted(model_files, key=lambda item: item.relative_to(self.model_root).as_posix().lower()):
            relative = path.relative_to(self.model_root).as_posix()
            lowered = path.name.lower()
            is_h3 = "h3" in lowered or "minimax" in lowered
            family = "reference" if is_h3 and "ref2va" in lowered else "t2v" if is_h3 and "fl2va" in lowered else "h3" if is_h3 else "other"
            precision = "INT8 ConvRot" if "int8_convrot" in lowered else "INT8" if "int8" in lowered else "FP8" if "fp8" in lowered else "Default"
            if family == "reference":
                native_modes = sorted(REFERENCE_MODES)
                experimental_modes: list[str] = []
            elif family == "t2v":
                native_modes = ["i2v", "t2v"]
                experimental_modes = sorted(REFERENCE_MODES)
            else:
                native_modes = []
                experimental_modes = ALL_MODES
            models.append(
                DiffusionModelMetadata(
                    filename=relative,
                    name=path.stem.replace("_", " "),
                    family=family,
                    precision=precision,
                    size=path.stat().st_size,
                    native_modes=native_modes,
                    experimental_modes=experimental_modes,
                )
            )
        return models

    def resolve(self, filename: str | None) -> str | None:
        if not filename:
            return None
        safe = Path(filename)
        if safe.is_absolute() or ".." in safe.parts:
            raise AppError("DIFFUSION_MODEL_INVALID", "Invalid diffusion model path.", 422)
        models = {item.filename: item for item in self.list()}
        if filename not in models:
            raise AppError("DIFFUSION_MODEL_NOT_FOUND", f"Diffusion model '{filename}' is not installed.", 422)
        return filename

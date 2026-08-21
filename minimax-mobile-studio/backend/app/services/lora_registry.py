from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import re

import yaml

from app.core.config import settings
from app.core.errors import AppError
from app.schemas.generation import LoraSelection


@dataclass(frozen=True)
class LoraMetadata:
    id: str
    name: str
    filename: str
    category: str
    default_strength: float
    min_strength: float
    max_strength: float
    trigger_words: list[str]
    enabled: bool
    available: bool

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class LoraRegistry:
    def __init__(self, config_path: Path | None = None, model_root: Path | None = None, workflow_root: Path | None = None):
        self.config_path = config_path or settings.lora_config_path
        self.model_root = model_root or settings.comfyui_lora_dir
        # ComfyUI identifies LoRAs relative to models/loras, not the H3 library itself.
        self.workflow_root = workflow_root or (model_root if model_root is not None else settings.comfyui_model_dir / "loras")

    def list(self) -> list[LoraMetadata]:
        raw = yaml.safe_load(self.config_path.read_text(encoding="utf-8")) or {} if self.config_path.is_file() else {}
        entries = raw.get("loras", [])
        if not isinstance(entries, list):
            raise AppError("LORA_CONFIG_INVALID", "config/loras.yaml must contain a 'loras' list.", 500)
        result: list[LoraMetadata] = []
        seen: set[str] = set()
        for entry in entries:
            if not isinstance(entry, dict):
                raise AppError("LORA_CONFIG_INVALID", "Every LoRA entry must be an object.", 500)
            lora_id = str(entry.get("id", "")).strip()
            filename = str(entry.get("filename", "")).strip()
            if not lora_id or not filename or lora_id in seen:
                raise AppError("LORA_CONFIG_INVALID", "LoRA ids and filenames must be present and ids must be unique.", 500)
            relative_path = Path(filename)
            if relative_path.is_absolute() or ".." in relative_path.parts:
                raise AppError("LORA_CONFIG_INVALID", f"LoRA filename '{filename}' is not a safe relative path.", 500)
            seen.add(lora_id)
            result.append(
                LoraMetadata(
                    id=lora_id,
                    name=str(entry.get("name") or lora_id),
                    filename=filename.replace("\\", "/"),
                    category=str(entry.get("category") or "other"),
                    default_strength=float(entry.get("default_strength", 0.8)),
                    min_strength=float(entry.get("min_strength", 0)),
                    max_strength=float(entry.get("max_strength", 1.5)),
                    trigger_words=[str(word) for word in entry.get("trigger_words", [])],
                    enabled=bool(entry.get("enabled", True)),
                    available=(self.model_root / relative_path).is_file(),
                )
            )
        configured_filenames = {item.filename.casefold() for item in result}
        for path in sorted(self.model_root.rglob("*.safetensors")) if self.model_root.is_dir() else []:
            relative_path = path.relative_to(self.model_root)
            filename = relative_path.as_posix()
            if filename.casefold() in configured_filenames:
                continue
            stem = re.sub(r"[^a-z0-9]+", "-", relative_path.with_suffix("").as_posix().lower()).strip("-") or "lora"
            lora_id = f"discovered-{stem}"
            suffix = 2
            while lora_id in seen:
                lora_id = f"discovered-{stem}-{suffix}"
                suffix += 1
            seen.add(lora_id)
            result.append(
                LoraMetadata(
                    id=lora_id,
                    name=relative_path.stem,
                    filename=filename,
                    category="auto-discovered",
                    default_strength=0.8,
                    min_strength=0,
                    max_strength=1.5,
                    trigger_words=[],
                    enabled=True,
                    available=True,
                )
            )
        return result

    def resolve(self, selections: list[LoraSelection]) -> list[dict[str, object]]:
        if not selections:
            return []
        registry = {item.id: item for item in self.list()}
        resolved: list[dict[str, object]] = []
        for selection in selections:
            item = registry.get(selection.id)
            if not item or not item.enabled:
                raise AppError("LORA_NOT_FOUND", f"LoRA '{selection.id}' is not enabled in the local library.", 422)
            if not item.available:
                raise AppError("LORA_NOT_FOUND", f"LoRA file '{item.filename}' is not installed in ComfyUI.", 422)
            if not item.min_strength <= selection.strength <= item.max_strength:
                raise AppError(
                    "LORA_STRENGTH_INVALID",
                    f"Strength for '{item.name}' must be between {item.min_strength:g} and {item.max_strength:g}.",
                    422,
                )
            try:
                # ComfyUI's option values use the platform-native separator.
                # On Windows, ``h3\\file.safetensors`` is distinct from a
                # slash-delimited value during prompt validation.
                filename = str(self.model_root.relative_to(self.workflow_root) / item.filename)
            except ValueError as error:
                raise AppError(
                    "LORA_CONFIG_INVALID",
                    f"LoRA directory '{self.model_root}' must be inside ComfyUI's LoRA directory '{self.workflow_root}'.",
                    500,
                ) from error
            resolved_item: dict[str, object] = {"filename": filename, "strength": selection.strength}
            if selection.workflow_parameters:
                resolved_item["workflow_parameters"] = selection.workflow_parameters
            if selection.apply_activation_tags:
                tags = selection.activation_tags or item.trigger_words
                if tags:
                    resolved_item["activation_tags"] = tags
            resolved.append(resolved_item)
        return resolved

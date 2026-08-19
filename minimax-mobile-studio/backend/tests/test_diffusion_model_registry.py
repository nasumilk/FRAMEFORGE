from __future__ import annotations

from pathlib import Path

import pytest

from app.core.errors import AppError
from app.services.diffusion_model_registry import DiffusionModelRegistry


def test_registry_lists_all_diffusion_models_and_classifies_families(tmp_path: Path) -> None:
    (tmp_path / "PinkCherry_h3_fl2va_int8_convrot.safetensors").write_bytes(b"t2v")
    (tmp_path / "minimax_h3_ref2va_fp8.safetensors").write_bytes(b"ref")
    (tmp_path / "qwen_image.safetensors").write_bytes(b"other")

    models = DiffusionModelRegistry(tmp_path).list()

    assert [model.family for model in models] == ["reference", "t2v", "other"]
    t2v = next(model for model in models if model.family == "t2v")
    assert "character_motion" in t2v.experimental_modes
    assert "t2v" in t2v.native_modes
    other = next(model for model in models if model.family == "other")
    assert other.filename == "qwen_image.safetensors"
    assert "t2v" in other.experimental_modes


def test_registry_resolves_installed_h3_model(tmp_path: Path) -> None:
    filename = "minimax_h3_fl2va_fp8.safetensors"
    (tmp_path / filename).write_bytes(b"model")
    assert DiffusionModelRegistry(tmp_path).resolve(filename) == filename


def test_registry_resolves_non_h3_and_additional_supported_extensions(tmp_path: Path) -> None:
    (tmp_path / "qwen_image.safetensors").write_bytes(b"model")
    (tmp_path / "custom_model.ckpt").write_bytes(b"model")
    registry = DiffusionModelRegistry(tmp_path)
    assert registry.resolve("qwen_image.safetensors") == "qwen_image.safetensors"
    assert registry.resolve("custom_model.ckpt") == "custom_model.ckpt"


def test_registry_rejects_missing_model(tmp_path: Path) -> None:
    with pytest.raises(AppError, match="not installed"):
        DiffusionModelRegistry(tmp_path).resolve("missing.safetensors")

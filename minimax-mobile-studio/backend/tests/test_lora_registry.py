from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from app.core.errors import AppError
from app.schemas.generation import LoraSelection
from app.services.lora_registry import LoraRegistry


def write_config(path: Path) -> None:
    path.write_text(yaml.safe_dump({"loras": [
        {"id": "motion", "name": "Motion", "filename": "motion.safetensors", "default_strength": 0.8, "min_strength": 0, "max_strength": 1.5, "enabled": True},
        {"id": "style", "name": "Style", "filename": "style.safetensors", "default_strength": 0.7, "min_strength": 0, "max_strength": 1.2, "enabled": True},
    ]}), encoding="utf-8")


def test_registry_resolves_multiple_installed_loras(tmp_path: Path) -> None:
    config = tmp_path / "loras.yaml"
    models = tmp_path / "models"
    models.mkdir()
    (models / "motion.safetensors").write_bytes(b"model")
    (models / "style.safetensors").write_bytes(b"model")
    write_config(config)

    resolved = LoraRegistry(config, models).resolve(
        [LoraSelection(id="motion", strength=0.5), LoraSelection(id="style", strength=1.0)]
    )

    assert resolved == [
        {"filename": "motion.safetensors", "strength": 0.5},
        {"filename": "style.safetensors", "strength": 1.0},
    ]


def test_registry_uses_per_selection_activation_tags_when_opted_in(tmp_path: Path) -> None:
    config = tmp_path / "loras.yaml"
    models = tmp_path / "models"
    models.mkdir()
    (models / "motion.safetensors").write_bytes(b"model")
    write_config(config)
    resolved = LoraRegistry(config, models).resolve([
        LoraSelection(id="motion", strength=0.5, apply_activation_tags=True, activation_tags=["motion blur", "turbo"]),
    ])
    assert resolved == [{"filename": "motion.safetensors", "strength": 0.5, "activation_tags": ["motion blur", "turbo"]}]


def test_registry_preserves_workflow_parameters(tmp_path: Path) -> None:
    config = tmp_path / "loras.yaml"
    models = tmp_path / "models"
    models.mkdir()
    (models / "motion.safetensors").write_bytes(b"model")
    write_config(config)
    resolved = LoraRegistry(config, models).resolve([
        LoraSelection(id="motion", strength=0.5, workflow_parameters={"strength_clip": 0.75}),
    ])
    assert resolved == [{
        "filename": "motion.safetensors",
        "strength": 0.5,
        "workflow_parameters": {"strength_clip": 0.75},
    }]


def test_registry_rejects_missing_file(tmp_path: Path) -> None:
    config = tmp_path / "loras.yaml"
    models = tmp_path / "models"
    models.mkdir()
    write_config(config)
    with pytest.raises(AppError, match="not installed"):
        LoraRegistry(config, models).resolve([LoraSelection(id="motion", strength=0.8)])


def test_registry_reads_h3_library_and_resolves_comfyui_relative_filename(tmp_path: Path) -> None:
    config = tmp_path / "loras.yaml"
    lora_root = tmp_path / "loras"
    h3_library = lora_root / "h3"
    h3_library.mkdir(parents=True)
    (h3_library / "motion.safetensors").write_bytes(b"model")
    write_config(config)

    resolved = LoraRegistry(config, h3_library, lora_root).resolve([LoraSelection(id="motion", strength=0.5)])

    assert resolved == [{"filename": str(Path("h3") / "motion.safetensors"), "strength": 0.5}]


def test_registry_auto_discovers_new_h3_loras(tmp_path: Path) -> None:
    config = tmp_path / "loras.yaml"
    lora_root = tmp_path / "loras"
    h3_library = lora_root / "h3"
    h3_library.mkdir(parents=True)
    (h3_library / "new_motion.safetensors").write_bytes(b"model")
    config.write_text("loras: []\n", encoding="utf-8")

    registry = LoraRegistry(config, h3_library, lora_root)
    catalog = registry.list()

    assert len(catalog) == 1
    assert catalog[0].name == "new_motion"
    assert catalog[0].category == "auto-discovered"
    assert catalog[0].available is True
    assert registry.resolve([LoraSelection(id=catalog[0].id, strength=0.8)]) == [
        {"filename": str(Path("h3") / "new_motion.safetensors"), "strength": 0.8}
    ]

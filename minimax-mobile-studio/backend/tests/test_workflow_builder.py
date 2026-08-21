from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml
from types import SimpleNamespace

from app.comfy.workflow_builder import WorkflowBuilder
from app.comfy.workflow_registry import WorkflowRegistry
from app.comfy import workflow_registry
from app.core.errors import AppError
from app.core.config import settings


def write_fixture(root: Path) -> None:
    (root / "mappings").mkdir()
    (root / "demo.json").write_text(json.dumps({"7": {"class_type": "Text", "inputs": {"text": "old"}}, "9": {"class_type": "Seed", "inputs": {"seed": 1}}}), encoding="utf-8")
    (root / "mappings/demo.yaml").write_text(yaml.safe_dump({"template": "demo.json", "inputs": {"prompt": {"node_id": "7", "input": "text", "required": True}, "seed": {"node_id": "9", "input": "seed"}}}), encoding="utf-8")


def test_builder_injects_values_without_mutating_template(tmp_path: Path) -> None:
    write_fixture(tmp_path)
    builder = WorkflowBuilder(WorkflowRegistry(tmp_path))
    first = builder.build("demo", {"prompt": "FRAMEFORGE PROMPT", "seed": 99})
    second = builder.build("demo", {"prompt": "another", "seed": 12})
    assert first["7"]["inputs"]["text"] == "FRAMEFORGE PROMPT"
    assert first["9"]["inputs"]["seed"] == 99
    assert second["7"]["inputs"]["text"] == "another"


def test_builder_chains_multiple_loras_and_reconnects_model_consumers(tmp_path: Path) -> None:
    (tmp_path / "mappings").mkdir()
    template = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "base.safetensors"}},
        "2": {"class_type": "BasicScheduler", "inputs": {"model": ["1", 0]}},
        "3": {"class_type": "BasicGuider", "inputs": {"model": ["1", 0]}},
    }
    mapping = {
        "template": "demo.json",
        "inputs": {},
        "lora_stack": {
            "model": {"node_id": "1", "output": 0},
            "loader_class": "LoraLoaderModelOnly",
            "model_input": "model",
            "name_input": "lora_name",
            "strength_input": "strength_model",
            "output": 0,
        },
    }
    (tmp_path / "demo.json").write_text(json.dumps(template), encoding="utf-8")
    (tmp_path / "mappings/demo.yaml").write_text(yaml.safe_dump(mapping), encoding="utf-8")

    workflow = WorkflowBuilder(WorkflowRegistry(tmp_path)).build(
        "demo",
        {"loras": [
            {"filename": "first.safetensors", "strength": 0.6},
            {"filename": "second.safetensors", "strength": 1.1},
        ]},
    )

    assert workflow["mobile_studio_lora_1"]["inputs"] == {
        "model": ["1", 0],
        "lora_name": "first.safetensors",
        "strength_model": 0.6,
    }
    assert workflow["mobile_studio_lora_2"]["inputs"]["model"] == ["mobile_studio_lora_1", 0]
    assert workflow["2"]["inputs"]["model"] == ["mobile_studio_lora_2", 0]
    assert workflow["3"]["inputs"]["model"] == ["mobile_studio_lora_2", 0]


def test_builder_chains_model_and_clip_with_workflow_parameters(tmp_path: Path) -> None:
    (tmp_path / "mappings").mkdir()
    template = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "base.safetensors"}},
        "4": {"class_type": "CLIPLoader", "inputs": {"clip_name": "clip.safetensors"}},
        "5": {"class_type": "Sampler", "inputs": {"model": ["1", 0]}},
        "6": {"class_type": "TextEncode", "inputs": {"clip": ["4", 0]}},
    }
    mapping = {
        "workflow": "demo",
        "template": "demo.json",
        "inputs": {},
        "lora_stack": {
            "model": {"node_id": "1", "output": 0},
            "clip": {"node_id": "4", "output": 0},
            "loader_class": "LoraLoader",
            "model_output": 0,
            "clip_output": 1,
            "parameter_inputs": {
                "strength_clip": {
                    "input": "strength_clip",
                    "type": "number",
                    "default": 0.9,
                    "min": -2,
                    "max": 2,
                },
            },
        },
    }
    (tmp_path / "demo.json").write_text(json.dumps(template), encoding="utf-8")
    (tmp_path / "mappings/demo.yaml").write_text(yaml.safe_dump(mapping), encoding="utf-8")

    workflow = WorkflowBuilder(WorkflowRegistry(tmp_path)).build(
        "demo",
        {"loras": [
            {"filename": "first.safetensors", "strength": 0.6, "workflow_parameters": {"strength_clip": 0.4}},
            {"filename": "second.safetensors", "strength": 1.1},
        ]},
    )

    assert workflow["mobile_studio_lora_1"]["inputs"] == {
        "model": ["1", 0],
        "clip": ["4", 0],
        "lora_name": "first.safetensors",
        "strength_model": 0.6,
        "strength_clip": 0.4,
    }
    assert workflow["mobile_studio_lora_2"]["inputs"]["model"] == ["mobile_studio_lora_1", 0]
    assert workflow["mobile_studio_lora_2"]["inputs"]["clip"] == ["mobile_studio_lora_1", 1]
    assert workflow["mobile_studio_lora_2"]["inputs"]["strength_clip"] == 0.9
    assert workflow["5"]["inputs"]["model"] == ["mobile_studio_lora_2", 0]
    assert workflow["6"]["inputs"]["clip"] == ["mobile_studio_lora_2", 1]


def test_builder_rejects_lora_parameter_not_declared_by_workflow(tmp_path: Path) -> None:
    (tmp_path / "mappings").mkdir()
    template = {"1": {"class_type": "UNETLoader", "inputs": {"unet_name": "base.safetensors"}}}
    mapping = {
        "workflow": "demo",
        "template": "demo.json",
        "inputs": {},
        "lora_stack": {"model": {"node_id": "1"}, "parameter_inputs": {}},
    }
    (tmp_path / "demo.json").write_text(json.dumps(template), encoding="utf-8")
    (tmp_path / "mappings/demo.yaml").write_text(yaml.safe_dump(mapping), encoding="utf-8")

    with pytest.raises(AppError, match="not supported"):
        WorkflowBuilder(WorkflowRegistry(tmp_path)).build(
            "demo",
            {"loras": [{"filename": "first.safetensors", "workflow_parameters": {"strength_clip": 1.0}}]},
        )


def test_registry_status_exposes_workflow_lora_controls(tmp_path: Path) -> None:
    (tmp_path / "mappings").mkdir()
    template = {
        "1": {"class_type": "UNETLoader", "inputs": {}},
        "2": {"class_type": "CLIPLoader", "inputs": {}},
    }
    mapping = {
        "template": "demo.json",
        "inputs": {},
        "lora_stack": {
            "model": {"node_id": "1"},
            "clip": {"node_id": "2"},
            "loader_class": "LoraLoader",
            "parameter_inputs": {
                "strength_clip": {"input": "strength_clip", "label": "CLIP strength", "type": "number", "default": 1.0},
            },
        },
    }
    (tmp_path / "demo.json").write_text(json.dumps(template), encoding="utf-8")
    (tmp_path / "mappings/demo.yaml").write_text(yaml.safe_dump(mapping), encoding="utf-8")

    status = WorkflowRegistry(tmp_path).status("demo")
    assert status["lora_loader"] == "LoraLoader"
    assert status["lora_has_clip"] is True
    assert [control["key"] for control in status["lora_controls"]] == ["strength_model", "strength_clip"]


def test_registry_rejects_editable_graph_json(tmp_path: Path) -> None:
    (tmp_path / "mappings").mkdir()
    (tmp_path / "graph.json").write_text('{"nodes": []}', encoding="utf-8")
    (tmp_path / "mappings/graph.yaml").write_text("template: graph.json\ninputs: {}\n", encoding="utf-8")
    with pytest.raises(AppError, match="API format"):
        WorkflowRegistry(tmp_path).get("graph")


def test_builder_rejects_stale_mapping(tmp_path: Path) -> None:
    write_fixture(tmp_path)
    mapping_path = tmp_path / "mappings/demo.yaml"
    mapping = yaml.safe_load(mapping_path.read_text(encoding="utf-8"))
    mapping["inputs"]["prompt"]["node_id"] = "404"
    mapping_path.write_text(yaml.safe_dump(mapping), encoding="utf-8")
    with pytest.raises(AppError, match="does not exist"):
        WorkflowBuilder(WorkflowRegistry(tmp_path)).build("demo", {"prompt": "x"})


def test_registry_rejects_incomplete_required_model(tmp_path: Path, monkeypatch) -> None:
    write_fixture(tmp_path)
    model_root = tmp_path / "models"
    model_path = model_root / "diffusion_models" / "required.safetensors"
    model_path.parent.mkdir(parents=True)
    model_path.write_bytes(b"partial")
    mapping_path = tmp_path / "mappings/demo.yaml"
    mapping = yaml.safe_load(mapping_path.read_text(encoding="utf-8"))
    mapping["required_models"] = [
        {"directory": "diffusion_models", "filename": "required.safetensors", "bytes": 100}
    ]
    mapping_path.write_text(yaml.safe_dump(mapping), encoding="utf-8")
    monkeypatch.setattr(workflow_registry, "settings", SimpleNamespace(comfyui_model_dir=model_root))

    with pytest.raises(AppError, match="still downloading"):
        WorkflowRegistry(tmp_path).get("demo")


def test_official_i2v_mapping_injects_image_and_generation_controls() -> None:
    workflow = WorkflowBuilder(WorkflowRegistry(settings.workflow_dir)).build(
        "h3_i2v",
        {
            "prompt": "Safe adult office scene",
            "image": "mobile-studio/test.png",
            "seed": 12345,
            "duration": 5,
            "steps": 32,
            "aspect_ratio": "1:1 (Square)",
            "megapixels": 0.4,
        },
    )

    assert workflow["105:104"]["inputs"]["prompt"] == "Safe adult office scene"
    assert workflow["114"]["inputs"]["image"] == "mobile-studio/test.png"
    assert workflow["105:15"]["inputs"]["noise_seed"] == 12345
    assert workflow["105:111"]["inputs"]["value"] == 5
    assert workflow["105:9"]["inputs"]["steps"] == 32
    assert workflow["115"]["inputs"]["aspect_ratio"] == "1:1 (Square)"


@pytest.mark.parametrize(
    ("workflow_name", "media_key", "media_value", "node_id", "input_name"),
    [
        ("h3_reference_image", "image", "reference.png", "137", "image"),
        ("h3_reference_video", "video", "reference.mp4", "137", "file"),
    ],
)
def test_official_reference_mapping_injects_media_and_controls(
    workflow_name: str,
    media_key: str,
    media_value: str,
    node_id: str,
    input_name: str,
) -> None:
    workflow = WorkflowBuilder(WorkflowRegistry(settings.workflow_dir)).build(
        workflow_name,
        {
            "prompt": "Safe adult reference scene",
            media_key: media_value,
            "seed": 2468,
            "duration": 5,
            "aspect_ratio": "16:9 (Widescreen)",
            "megapixels": 0.4,
            "reference_size": "match",
        },
    )

    assert workflow[node_id]["inputs"][input_name] == media_value
    assert workflow["136"]["inputs"]["prompt"] == "Safe adult reference scene"
    assert workflow["136"]["inputs"]["ref_image_size"] == "match"
    assert workflow["129"]["inputs"]["noise_seed"] == 2468


def test_character_motion_mapping_adds_multiple_images_and_motion_video() -> None:
    workflow = WorkflowBuilder(WorkflowRegistry(settings.workflow_dir)).build(
        "h3_character_motion",
        {
            "prompt": "Use the character identity and trace the motion.",
            "character_images": ["front.png", "profile.png", "detail.png"],
            "motion_video": "motion.mp4",
            "seed": 97531,
            "duration": 6,
            "aspect_ratio": "9:16 (Portrait Widescreen)",
            "megapixels": 0.4,
            "reference_size": "match",
        },
    )

    assert workflow["mobile_studio_ref_image_1"]["inputs"]["image"] == "front.png"
    assert workflow["mobile_studio_ref_image_3"]["inputs"]["image"] == "detail.png"
    assert workflow["136"]["inputs"]["ref_images.ref_image_0"] == ["mobile_studio_ref_image_1", 0]
    assert workflow["136"]["inputs"]["ref_images.ref_image_2"] == ["mobile_studio_ref_image_3", 0]
    assert workflow["mobile_studio_ref_video_1"]["inputs"]["file"] == "motion.mp4"
    assert workflow["136"]["inputs"]["ref_videos.ref_video_0"] == ["mobile_studio_ref_video_components_1", 0]
    assert workflow["136"]["inputs"]["ref_video_audios.ref_video_audio_0"] == ["mobile_studio_ref_video_components_1", 1]


@pytest.mark.parametrize(
    ("workflow_name", "node_id"),
    [
        ("h3_t2v", "105:6"),
        ("h3_i2v", "105:6"),
        ("h3_reference_image", "127"),
        ("h3_reference_video", "127"),
        ("h3_character_motion", "127"),
    ],
)
def test_all_h3_workflows_accept_selected_diffusion_model(workflow_name: str, node_id: str) -> None:
    definition = WorkflowRegistry(settings.workflow_dir).get(workflow_name)
    values: dict[str, object] = {
        "prompt": "A safe cinematic scene",
        "diffusion_model": "PinkCherry_h3_fl2va_int8_convrot_v0.5-alpha.safetensors",
    }
    for semantic_name, target in definition.mapping["inputs"].items():
        if target.get("required") and semantic_name not in values:
            values[semantic_name] = "input.png" if semantic_name == "image" else "input.mp4"
    workflow = WorkflowBuilder(WorkflowRegistry(settings.workflow_dir)).build(workflow_name, values)
    assert workflow[node_id]["inputs"]["unet_name"] == "PinkCherry_h3_fl2va_int8_convrot_v0.5-alpha.safetensors"

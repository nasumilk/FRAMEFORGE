from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml

from app.comfy.workflow_builder import WorkflowBuilder
from app.comfy.workflow_registry import WorkflowRegistry
from app.core.errors import AppError


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


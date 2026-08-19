from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from app.core.config import settings
from app.core.errors import AppError


@dataclass(frozen=True)
class WorkflowDefinition:
    name: str
    template_path: Path
    mapping_path: Path
    template: dict[str, Any]
    mapping: dict[str, Any]


class WorkflowRegistry:
    def __init__(self, root: Path | None = None):
        self.root = root or settings.workflow_dir
        self.mapping_root = self.root / "mappings"

    def names(self) -> list[str]:
        if not self.mapping_root.exists():
            return []
        return sorted(path.stem for path in self.mapping_root.glob("*.yaml") if not path.name.endswith(".example.yaml"))

    def get(self, name: str) -> WorkflowDefinition:
        safe_name = Path(name).name
        mapping_path = self.mapping_root / f"{safe_name}.yaml"
        if not mapping_path.exists():
            raise AppError("WORKFLOW_NOT_FOUND", f"Workflow mapping '{safe_name}' is not installed.", 422)
        mapping = yaml.safe_load(mapping_path.read_text(encoding="utf-8")) or {}
        self._validate_required_models(mapping)
        template_name = mapping.get("template", f"{safe_name}.json")
        template_path = self.root / Path(str(template_name)).name
        if not template_path.exists():
            raise AppError("WORKFLOW_NOT_FOUND", f"Workflow template '{template_path.name}' is not installed.", 422)
        try:
            template = json.loads(template_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            raise AppError("WORKFLOW_INVALID", f"Workflow template '{template_path.name}' is invalid.", 422) from exc
        self._validate_api_format(template)
        return WorkflowDefinition(safe_name, template_path, mapping_path, template, mapping)

    @staticmethod
    def _validate_required_models(mapping: dict[str, Any]) -> None:
        requirements = mapping.get("required_models", [])
        if not isinstance(requirements, list):
            raise AppError("WORKFLOW_INVALID", "required_models must be a list.", 422)
        for requirement in requirements:
            if not isinstance(requirement, dict):
                raise AppError("WORKFLOW_INVALID", "Each required model must be an object.", 422)
            directory = Path(str(requirement.get("directory", ""))).name
            filename = Path(str(requirement.get("filename", ""))).name
            expected_bytes = int(requirement.get("bytes", 0))
            path = settings.comfyui_model_dir / directory / filename
            if not path.is_file() or (expected_bytes and path.stat().st_size < expected_bytes):
                raise AppError(
                    "WORKFLOW_NOT_FOUND",
                    f"Required model '{filename}' is missing or still downloading.",
                    422,
                )

    @staticmethod
    def _validate_api_format(template: dict[str, Any]) -> None:
        if "nodes" in template or not template:
            raise AppError(
                "WORKFLOW_INVALID",
                "Workflow must be exported in ComfyUI API format, not the editable graph format.",
                422,
            )
        for node_id, node in template.items():
            if not isinstance(node, dict) or "class_type" not in node or not isinstance(node.get("inputs"), dict):
                raise AppError("WORKFLOW_INVALID", f"Node '{node_id}' is not a valid API workflow node.", 422)

    @staticmethod
    def _lora_controls(mapping: dict[str, Any]) -> tuple[str | None, bool, list[dict[str, Any]]]:
        stack = mapping.get("lora_stack")
        if not isinstance(stack, dict):
            return None, False, []
        loader_class = str(stack.get("loader_class", "LoraLoaderModelOnly"))
        controls: list[dict[str, Any]] = [{
            "key": "strength_model",
            "input": str(stack.get("strength_input", "strength_model")),
            "label": "Model strength",
            "type": "number",
            "default": float(stack.get("default_strength", 0.8)),
            "min": float(stack.get("min_strength", 0)),
            "max": float(stack.get("max_strength", 2)),
            "step": float(stack.get("strength_step", 0.05)),
        }]
        parameter_inputs = stack.get("parameter_inputs", {})
        if isinstance(parameter_inputs, dict):
            for key, raw_spec in parameter_inputs.items():
                spec = {"input": raw_spec} if isinstance(raw_spec, str) else raw_spec
                if not isinstance(spec, dict):
                    continue
                control: dict[str, Any] = {
                    "key": str(key),
                    "input": str(spec.get("input", key)),
                    "label": str(spec.get("label", str(key).replace("_", " ").title())),
                    "type": str(spec.get("type", "number")),
                }
                for field in ("default", "min", "max", "step", "options"):
                    if field in spec:
                        control[field] = spec[field]
                controls.append(control)
        return loader_class, isinstance(stack.get("clip"), dict), controls

    def status(self, name: str) -> dict[str, Any]:
        try:
            definition = self.get(name)
            loader_class, has_clip, controls = self._lora_controls(definition.mapping)
            return {
                "name": name,
                "ready": True,
                "template": definition.template_path.name,
                "message": "Ready",
                "lora_loader": loader_class,
                "lora_has_clip": has_clip,
                "lora_controls": controls,
            }
        except AppError as exc:
            return {
                "name": name,
                "ready": False,
                "template": f"{name}.json",
                "message": exc.message,
                "lora_loader": None,
                "lora_has_clip": False,
                "lora_controls": [],
            }

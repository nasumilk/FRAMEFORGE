from __future__ import annotations

import copy
from typing import Any

from app.comfy.workflow_registry import WorkflowRegistry
from app.core.errors import AppError


class WorkflowBuilder:
    def __init__(self, registry: WorkflowRegistry | None = None):
        self.registry = registry or WorkflowRegistry()

    def build(self, workflow_name: str, values: dict[str, Any]) -> dict[str, Any]:
        definition = self.registry.get(workflow_name)
        workflow = copy.deepcopy(definition.template)
        inputs = definition.mapping.get("inputs")
        if not isinstance(inputs, dict):
            raise AppError("WORKFLOW_MAPPING_ERROR", "Mapping must contain an 'inputs' object.", 422)

        for semantic_name, target in inputs.items():
            if semantic_name not in values or values[semantic_name] is None:
                if isinstance(target, dict) and target.get("required"):
                    raise AppError("WORKFLOW_MAPPING_ERROR", f"Required value '{semantic_name}' is missing.", 422)
                continue
            if not isinstance(target, dict):
                raise AppError("WORKFLOW_MAPPING_ERROR", f"Mapping for '{semantic_name}' must be an object.", 422)
            node_id = str(target.get("node_id", ""))
            input_name = str(target.get("input", ""))
            node = workflow.get(node_id)
            if not node:
                raise AppError("WORKFLOW_MAPPING_ERROR", f"Mapped node '{node_id}' does not exist.", 422)
            if input_name not in node.get("inputs", {}):
                raise AppError("WORKFLOW_MAPPING_ERROR", f"Input '{input_name}' does not exist on node '{node_id}'.", 422)
            node["inputs"][input_name] = values[semantic_name]
        return workflow


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
        self._apply_lora_stack(workflow, definition.mapping, values.get("loras"))
        self._apply_reference_media(workflow, definition.mapping, values)
        return workflow

    @staticmethod
    def _apply_reference_media(workflow: dict[str, Any], mapping: dict[str, Any], values: dict[str, Any]) -> None:
        media = mapping.get("reference_media")
        if not isinstance(media, dict):
            return
        target_node_id = str(media.get("target_node_id", ""))
        target = workflow.get(target_node_id)
        if not target:
            raise AppError("WORKFLOW_MAPPING_ERROR", f"Reference target node '{target_node_id}' does not exist.", 422)

        images = values.get(str(media.get("images_value", "character_images"))) or []
        max_images = int(media.get("max_images", 9))
        if not isinstance(images, list) or len(images) > max_images:
            raise AppError("WORKFLOW_MAPPING_ERROR", f"Reference images must be a list of at most {max_images} items.", 422)
        for index, filename in enumerate(images):
            node_id = f"mobile_studio_ref_image_{index + 1}"
            workflow[node_id] = {"class_type": str(media.get("image_loader_class", "LoadImage")), "inputs": {str(media.get("image_loader_input", "image")): str(filename)}}
            input_name = f"{media.get('image_target_prefix', 'ref_images.ref_image_')}{index}"
            target["inputs"][input_name] = [node_id, int(media.get("image_output", 0))]

        video = values.get(str(media.get("video_value", "motion_video")))
        if video:
            loader_id = "mobile_studio_ref_video_1"
            components_id = "mobile_studio_ref_video_components_1"
            workflow[loader_id] = {"class_type": str(media.get("video_loader_class", "LoadVideo")), "inputs": {str(media.get("video_loader_input", "file")): str(video)}}
            workflow[components_id] = {"class_type": str(media.get("video_components_class", "GetVideoComponents")), "inputs": {str(media.get("video_components_input", "video")): [loader_id, int(media.get("video_loader_output", 0))]}}
            target["inputs"][str(media.get("video_target_input", "ref_videos.ref_video_0"))] = [components_id, int(media.get("video_output", 0))]
            if media.get("audio_target_input"):
                target["inputs"][str(media["audio_target_input"])] = [components_id, int(media.get("audio_output", 1))]

    @staticmethod
    def _apply_lora_stack(workflow: dict[str, Any], mapping: dict[str, Any], loras: Any) -> None:
        if not loras:
            return
        if not isinstance(loras, list):
            raise AppError("WORKFLOW_MAPPING_ERROR", "LoRA selections must be a list.", 422)
        stack = mapping.get("lora_stack")
        if not isinstance(stack, dict):
            raise AppError("WORKFLOW_MAPPING_ERROR", "This workflow does not define a LoRA stack.", 422)
        source = stack.get("model")
        if not isinstance(source, dict):
            raise AppError("WORKFLOW_MAPPING_ERROR", "LoRA stack must define its model source.", 422)
        source_node_id = str(source.get("node_id", ""))
        source_output = int(source.get("output", 0))
        if source_node_id not in workflow:
            raise AppError("WORKFLOW_MAPPING_ERROR", f"LoRA model node '{source_node_id}' does not exist.", 422)

        loader_class = str(stack.get("loader_class", "LoraLoaderModelOnly"))
        model_input = str(stack.get("model_input", "model"))
        name_input = str(stack.get("name_input", "lora_name"))
        strength_input = str(stack.get("strength_input", "strength_model"))
        model_output = int(stack.get("model_output", stack.get("output", 0)))
        clip_source = stack.get("clip")
        has_clip = isinstance(clip_source, dict)
        clip_input = str(stack.get("clip_input", "clip"))
        clip_output = int(stack.get("clip_output", 1))
        original_clip: list[Any] | None = None
        previous_clip: list[Any] | None = None
        if has_clip:
            clip_node_id = str(clip_source.get("node_id", ""))
            clip_source_output = int(clip_source.get("output", 0))
            if clip_node_id not in workflow:
                raise AppError("WORKFLOW_MAPPING_ERROR", f"LoRA CLIP node '{clip_node_id}' does not exist.", 422)
            original_clip = [clip_node_id, clip_source_output]
            previous_clip = original_clip.copy()

        parameter_inputs = stack.get("parameter_inputs", {})
        if not isinstance(parameter_inputs, dict):
            raise AppError("WORKFLOW_MAPPING_ERROR", "LoRA parameter_inputs must be an object.", 422)

        previous_model: list[Any] = [source_node_id, source_output]
        inserted_ids: set[str] = set()
        for index, selection in enumerate(loras, start=1):
            if not isinstance(selection, dict) or not selection.get("filename"):
                raise AppError("WORKFLOW_MAPPING_ERROR", "Every LoRA selection requires a filename.", 422)
            supplied_parameters = selection.get("workflow_parameters", {})
            if not isinstance(supplied_parameters, dict):
                raise AppError("WORKFLOW_MAPPING_ERROR", "LoRA workflow_parameters must be an object.", 422)
            unsupported = sorted(set(supplied_parameters) - set(parameter_inputs))
            if unsupported:
                raise AppError(
                    "WORKFLOW_MAPPING_ERROR",
                    f"LoRA parameter(s) {', '.join(unsupported)} are not supported by workflow '{mapping.get('workflow', 'unknown')}'.",
                    422,
                )
            node_id = f"mobile_studio_lora_{index}"
            while node_id in workflow:
                node_id = f"_{node_id}"
            node_inputs: dict[str, Any] = {
                model_input: previous_model,
                name_input: str(selection["filename"]),
                strength_input: float(selection.get("strength", 0.8)),
            }
            if previous_clip is not None:
                node_inputs[clip_input] = previous_clip
            for parameter_name, raw_spec in parameter_inputs.items():
                spec = {"input": raw_spec} if isinstance(raw_spec, str) else raw_spec
                if not isinstance(spec, dict):
                    raise AppError(
                        "WORKFLOW_MAPPING_ERROR",
                        f"LoRA parameter mapping '{parameter_name}' must be a string or object.",
                        422,
                    )
                if parameter_name in supplied_parameters:
                    raw_value = supplied_parameters[parameter_name]
                elif "default" in spec:
                    raw_value = spec["default"]
                else:
                    continue
                input_name = str(spec.get("input", parameter_name)).strip()
                if not input_name:
                    raise AppError("WORKFLOW_MAPPING_ERROR", f"LoRA parameter '{parameter_name}' has no input name.", 422)
                node_inputs[input_name] = WorkflowBuilder._normalize_lora_parameter(
                    str(parameter_name), raw_value, spec
                )
            workflow[node_id] = {
                "class_type": loader_class,
                "inputs": node_inputs,
            }
            inserted_ids.add(node_id)
            previous_model = [node_id, model_output]
            if previous_clip is not None:
                previous_clip = [node_id, clip_output]

        original_model = [source_node_id, source_output]
        for node_id, node in workflow.items():
            if node_id in inserted_ids:
                continue
            for input_name, value in node.get("inputs", {}).items():
                if value == original_model:
                    node["inputs"][input_name] = previous_model
                elif original_clip is not None and value == original_clip:
                    node["inputs"][input_name] = previous_clip

    @staticmethod
    def _normalize_lora_parameter(name: str, value: Any, spec: dict[str, Any]) -> Any:
        parameter_type = str(spec.get("type", "number")).lower()
        try:
            if parameter_type in ("number", "float"):
                normalized: Any = float(value)
            elif parameter_type in ("integer", "int"):
                normalized = int(value)
            elif parameter_type in ("boolean", "bool"):
                if isinstance(value, bool):
                    normalized = value
                elif isinstance(value, str) and value.lower() in ("true", "false"):
                    normalized = value.lower() == "true"
                else:
                    raise ValueError
            elif parameter_type in ("string", "select"):
                normalized = str(value)
            else:
                raise AppError(
                    "WORKFLOW_MAPPING_ERROR",
                    f"LoRA parameter '{name}' has unsupported type '{parameter_type}'.",
                    422,
                )
        except (TypeError, ValueError) as exc:
            raise AppError(
                "WORKFLOW_MAPPING_ERROR",
                f"LoRA parameter '{name}' must be a valid {parameter_type} value.",
                422,
            ) from exc

        if isinstance(normalized, (int, float)) and not isinstance(normalized, bool):
            if "min" in spec and normalized < float(spec["min"]):
                raise AppError("WORKFLOW_MAPPING_ERROR", f"LoRA parameter '{name}' is below its minimum.", 422)
            if "max" in spec and normalized > float(spec["max"]):
                raise AppError("WORKFLOW_MAPPING_ERROR", f"LoRA parameter '{name}' is above its maximum.", 422)
        options = spec.get("options")
        if options is not None:
            if not isinstance(options, list) or normalized not in options:
                raise AppError("WORKFLOW_MAPPING_ERROR", f"LoRA parameter '{name}' is not an allowed option.", 422)
        return normalized

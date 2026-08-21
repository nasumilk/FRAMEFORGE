from __future__ import annotations

import json
import re
import secrets
from pathlib import Path

from sqlalchemy.orm import Session

from app.comfy.client import ComfyUIClient
from app.comfy.workflow_builder import WorkflowBuilder
from app.core.errors import AppError
from app.models.entities import Generation, Job, Upload
from app.repositories.jobs import JobRepository
from app.schemas.generation import GenerationRequest
from app.services.lora_registry import LoraRegistry
from app.services.diffusion_model_registry import DiffusionModelRegistry


MODE_WORKFLOWS = {
    "t2v": "h3_t2v",
    "i2v": "h3_i2v",
    "reference_image": "h3_reference_image",
    "reference_video": "h3_reference_video",
    "character_motion": "h3_character_motion",
}


class GenerationService:
    def __init__(self, db: Session, client: ComfyUIClient | None = None, builder: WorkflowBuilder | None = None, lora_registry: LoraRegistry | None = None, diffusion_registry: DiffusionModelRegistry | None = None):
        self.repo = JobRepository(db)
        self.client = client or ComfyUIClient()
        self.builder = builder or WorkflowBuilder()
        self.lora_registry = lora_registry or LoraRegistry()
        self.diffusion_registry = diffusion_registry or DiffusionModelRegistry()

    async def create(self, request: GenerationRequest) -> Job:
        seed = request.seed if request.seed is not None else secrets.randbelow(2**31 - 1)
        workflow_name = request.workflow_name or MODE_WORKFLOWS[request.mode.value]
        workflow_prompt = _enhance_fpv_prompt(_reference_aware_prompt(request.mode.value, request.prompt, len(request.image_ids)))
        image_name = await self._prepare_upload(request.image_id, "image") if request.image_id else None
        image_names = [await self._prepare_upload(upload_id, "image") for upload_id in request.image_ids]
        video_name = await self._prepare_upload(request.video_id, "video") if request.video_id else None
        loras = self.lora_registry.resolve(request.loras)
        workflow_prompt = _apply_lora_activation_tags(workflow_prompt, loras)
        diffusion_model = self.diffusion_registry.resolve(request.diffusion_model)
        values = {
            "prompt": workflow_prompt,
            "negative_prompt": request.negative_prompt or "",
            "seed": seed,
            "width": request.width,
            "height": request.height,
            "duration": request.duration,
            "steps": request.steps,
            "aspect_ratio": request.aspect_ratio,
            "megapixels": request.megapixels,
            "image": image_name,
            "character_images": image_names,
            "video": video_name,
            "motion_video": video_name,
            "loras": loras,
            "diffusion_model": diffusion_model,
            **request.advanced,
        }
        workflow = self.builder.build(workflow_name, values)
        generation = self.repo.add_generation(
            Generation(
                mode=request.mode.value,
                prompt=workflow_prompt,
                negative_prompt=request.negative_prompt,
                seed=seed,
                width=request.width,
                height=request.height,
                duration=request.duration,
                workflow_name=workflow_name,
                settings_json=json.dumps(request.model_dump(mode="json"), ensure_ascii=False),
            )
        )
        job = self.repo.add_job(Job(generation_id=generation.id, status="pending", stage="building workflow"))
        try:
            prompt_id = await self.client.queue_prompt(workflow)
        except Exception:
            job.status = "failed"
            job.stage = "submission failed"
            self.repo.save(job)
            raise
        job.comfy_prompt_id = prompt_id
        job.status = "queued"
        job.stage = "queued in ComfyUI"
        return self.repo.save(job)

    async def _prepare_upload(self, upload_id: str, expected_type: str) -> str:
        upload = self.repo.db.get(Upload, upload_id)
        if not upload or upload.type != expected_type:
            raise AppError("UPLOAD_INVALID", f"The selected {expected_type} upload was not found.", 422)
        result = await self.client.upload_input(Path(upload.path))
        name = result.get("name")
        if not name:
            raise AppError("UPLOAD_INVALID", f"ComfyUI did not accept the uploaded {expected_type}.", 502)
        subfolder = str(result.get("subfolder") or "").strip("/\\")
        return f"{subfolder}/{name}" if subfolder else str(name)


def _reference_aware_prompt(mode: str, prompt: str, image_count: int = 0) -> str:
    normalized_prompt = prompt.lower()
    has_i2v_authority = "authoritative visual source" in normalized_prompt or "image_to_video_instruction:" in normalized_prompt
    if mode == "i2v" and not has_i2v_authority:
        return (
            "The supplied first frame is the authoritative visual source at 0.00 seconds. "
            "Preserve its exact subject identity, facial structure, body proportions, scene layout, camera viewpoint, lighting, and composition. "
            "If text conflicts with the first frame, the first frame wins; text may direct only continuous changes after 0.00 seconds. "
            f"{prompt}"
        )
    if mode == "reference_image" and "<Picture 1>" not in prompt:
        return f"Use <Picture 1> as the visual identity and appearance reference. {prompt}"
    if mode == "reference_video" and "<Video 1>" not in prompt:
        return (
            "Use <Video 1> as the motion and appearance reference. "
            "Use <Audio 1> as the soundtrack reference when present. "
            f"{prompt}"
        )
    if mode == "character_motion":
        pictures = " and ".join(f"<Picture {index}>" for index in range(1, image_count + 1))
        prefix = (
            f"Use {pictures} exclusively as identity, face, hair, body-proportion, and wardrobe references for the target character. "
            "Use <Video 1> exclusively as the motion, pose sequence, body mechanics, action timing, and camera-motion reference. "
            "The target character from the pictures performs the movement traced from <Video 1>. "
            "Do not copy the identity, face, hair, body shape, or clothing of the person in <Video 1>. "
            "Preserve the target character's identity consistently in every frame. "
        )
        return prompt if all(tag in prompt for tag in ("<Picture 1>", "<Video 1>")) else f"{prefix}{prompt}"
    return prompt


def _apply_lora_activation_tags(prompt: str, loras: list[dict[str, object]]) -> str:
    """Append opt-in, per-LoRA trigger tags once without changing model weights."""
    tags: list[str] = []
    seen: set[str] = set()
    for lora in loras:
        for tag in lora.get("activation_tags", []):
            value = str(tag).strip()
            if value and value.casefold() not in seen:
                seen.add(value.casefold())
                tags.append(value)
    if not tags:
        return prompt
    return f"{prompt.rstrip()}\n\nLoRA activation tags: {', '.join(tags)}."


def _enhance_fpv_prompt(prompt: str) -> str:
    """Add the viewpoint cue that makes MiniMax H3 FPV shots feel more immersive."""
    has_fpv = re.search(r"(?<![A-Za-z0-9])fpv(?![A-Za-z0-9])", prompt, re.IGNORECASE)
    has_vr_viewpoint = re.search(
        r"(?:VR\s*(?:視点|視野|POV|point[ -]?of[ -]?view)|virtual[ -]?reality\s*(?:POV|point[ -]?of[ -]?view))",
        prompt,
        re.IGNORECASE,
    )
    if not has_fpv or has_vr_viewpoint:
        return prompt
    return f"{prompt.rstrip()} Use an immersive VR point-of-view (VR視点) camera angle for the FPV shot."

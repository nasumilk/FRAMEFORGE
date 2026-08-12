from __future__ import annotations

import json
import secrets
from pathlib import Path

from sqlalchemy.orm import Session

from app.comfy.client import ComfyUIClient
from app.comfy.workflow_builder import WorkflowBuilder
from app.core.errors import AppError
from app.models.entities import Generation, Job, Upload
from app.repositories.jobs import JobRepository
from app.schemas.generation import GenerationRequest


MODE_WORKFLOWS = {
    "t2v": "h3_t2v",
    "i2v": "h3_i2v",
    "reference_image": "h3_reference_image",
    "reference_video": "h3_reference_video",
}


class GenerationService:
    def __init__(self, db: Session, client: ComfyUIClient | None = None, builder: WorkflowBuilder | None = None):
        self.repo = JobRepository(db)
        self.client = client or ComfyUIClient()
        self.builder = builder or WorkflowBuilder()

    async def create(self, request: GenerationRequest) -> Job:
        seed = request.seed if request.seed is not None else secrets.randbelow(2**31 - 1)
        workflow_name = request.workflow_name or MODE_WORKFLOWS[request.mode.value]
        workflow_prompt = _reference_aware_prompt(request.mode.value, request.prompt)
        image_name = await self._prepare_upload(request.image_id, "image") if request.image_id else None
        video_name = await self._prepare_upload(request.video_id, "video") if request.video_id else None
        values = {
            "prompt": workflow_prompt,
            "negative_prompt": request.negative_prompt or "",
            "seed": seed,
            "width": request.width,
            "height": request.height,
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
            "megapixels": request.megapixels,
            "image": image_name,
            "video": video_name,
            **request.advanced,
        }
        workflow = self.builder.build(workflow_name, values)
        generation = self.repo.add_generation(
            Generation(
                mode=request.mode.value,
                prompt=request.prompt,
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


def _reference_aware_prompt(mode: str, prompt: str) -> str:
    if mode == "reference_image" and "<Picture 1>" not in prompt:
        return f"Use <Picture 1> as the visual identity and appearance reference. {prompt}"
    if mode == "reference_video" and "<Video 1>" not in prompt:
        return (
            "Use <Video 1> as the motion and appearance reference. "
            "Use <Audio 1> as the soundtrack reference when present. "
            f"{prompt}"
        )
    return prompt

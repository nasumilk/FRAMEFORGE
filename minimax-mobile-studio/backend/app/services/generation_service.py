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
        image_name = await self._prepare_image(request.image_id) if request.image_id else None
        values = {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt or "",
            "seed": seed,
            "width": request.width,
            "height": request.height,
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
            "megapixels": request.megapixels,
            "image": image_name,
            "video": request.video_id,
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

    async def _prepare_image(self, upload_id: str) -> str:
        upload = self.repo.db.get(Upload, upload_id)
        if not upload or upload.type != "image":
            raise AppError("UPLOAD_INVALID", "The selected image upload was not found.", 422)
        result = await self.client.upload_image(Path(upload.path))
        name = result.get("name")
        if not name:
            raise AppError("UPLOAD_INVALID", "ComfyUI did not accept the uploaded image.", 502)
        subfolder = str(result.get("subfolder") or "").strip("/\\")
        return f"{subfolder}/{name}" if subfolder else str(name)

from __future__ import annotations

import json
import secrets

from sqlalchemy.orm import Session

from app.comfy.client import ComfyUIClient
from app.comfy.workflow_builder import WorkflowBuilder
from app.models.entities import Generation, Job
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
        values = {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt or "",
            "seed": seed,
            "width": request.width,
            "height": request.height,
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
            "megapixels": request.megapixels,
            "image": request.image_id,
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

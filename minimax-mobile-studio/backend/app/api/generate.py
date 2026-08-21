from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.generation import GenerationRequest, JobResponse
from app.services.generation_service import GenerationService
from app.services.job_monitor import monitor_comfy_job


router = APIRouter(prefix="/generations", tags=["generations"])


@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate(request: GenerationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> JobResponse:
    service = GenerationService(db)
    job = await service.create(request)
    if job.comfy_prompt_id:
        background_tasks.add_task(monitor_comfy_job, job.id, job.comfy_prompt_id, service.client.client_id)
    return JobResponse.model_validate(job)

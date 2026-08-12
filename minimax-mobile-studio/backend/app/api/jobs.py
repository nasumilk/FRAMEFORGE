from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.comfy.client import ComfyUIClient
from app.core.errors import AppError
from app.db.session import get_db
from app.repositories.jobs import JobRepository
from app.schemas.generation import JobResponse


router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobResponse])
def list_jobs(db: Session = Depends(get_db)) -> list[JobResponse]:
    return [JobResponse.model_validate(job) for job in JobRepository(db).list()]


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)) -> JobResponse:
    job = JobRepository(db).get(job_id)
    if not job:
        raise AppError("JOB_NOT_FOUND", "Job was not found.", 404)
    return JobResponse.model_validate(job)


@router.post("/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(job_id: str, db: Session = Depends(get_db)) -> JobResponse:
    repo = JobRepository(db)
    job = repo.get(job_id)
    if not job:
        raise AppError("JOB_NOT_FOUND", "Job was not found.", 404)
    await ComfyUIClient().interrupt()
    job.status = "cancelled"
    job.stage = "cancelled"
    return JobResponse.model_validate(repo.save(job))


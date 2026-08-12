from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
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
    if job.status in ("completed", "failed", "cancelled"):
        return JobResponse.model_validate(job)
    client = ComfyUIClient()
    queue = await client.get_queue()
    running_ids = _queue_prompt_ids(queue.get("queue_running", []))
    pending_ids = _queue_prompt_ids(queue.get("queue_pending", []))
    if job.comfy_prompt_id in pending_ids:
        await client.delete_from_queue(str(job.comfy_prompt_id))
    elif job.comfy_prompt_id in running_ids:
        await client.interrupt()
    else:
        raise AppError("GENERATION_FAILED", "The ComfyUI job is no longer cancellable.", 409)
    job.status = "cancelled"
    job.stage = "cancelled"
    return JobResponse.model_validate(repo.save(job))


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: str, db: Session = Depends(get_db)) -> Response:
    repo = JobRepository(db)
    job = repo.get(job_id)
    if not job:
        raise AppError("JOB_NOT_FOUND", "Job was not found.", 404)
    if job.status not in ("completed", "failed", "cancelled"):
        raise AppError("GENERATION_FAILED", "Cancel the active job before deleting its history.", 409)
    # Delete database history only. The ComfyUI output file remains intact.
    repo.delete(job)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _queue_prompt_ids(entries: object) -> set[str]:
    if not isinstance(entries, list):
        return set()
    return {
        str(entry[1])
        for entry in entries
        if isinstance(entry, list) and len(entry) > 1
    }

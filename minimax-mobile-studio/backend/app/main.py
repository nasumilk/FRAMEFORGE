from __future__ import annotations

import asyncio
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import generate, jobs, media, system, workflows
from app.core.config import settings
from app.core.errors import AppError, app_error_handler
from app.db.session import init_db
from app.db.session import SessionLocal
from app.models.entities import Job
from app.services.job_monitor import monitor_comfy_job


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.ensure_directories()
    init_db()
    # ComfyUI keeps processing across an API restart. Resume monitoring jobs
    # that were previously queued or running so their terminal state and media
    # are still collected.
    with SessionLocal() as db:
        active_jobs = list(
            db.query(Job)
            .filter(Job.status.in_(("pending", "queued", "running")))
            .filter(Job.comfy_prompt_id.is_not(None))
            .all()
        )
    monitor_tasks = {
        asyncio.create_task(
            monitor_comfy_job(job.id, str(job.comfy_prompt_id), str(uuid.uuid4()))
        )
        for job in active_jobs
    }
    try:
        yield
    finally:
        for task in monitor_tasks:
            task.cancel()
        await asyncio.gather(*monitor_tasks, return_exceptions=True)


app = FastAPI(title="MiniMax H3 Mobile Studio API", version="0.1.0", lifespan=lifespan)
app.add_exception_handler(AppError, app_error_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(system.router, prefix="/api/v1")
app.include_router(generate.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(media.router, prefix="/api/v1")
app.include_router(workflows.router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "MiniMax H3 Mobile Studio API", "docs": "/docs"}

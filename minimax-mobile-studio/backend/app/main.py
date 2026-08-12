from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import generate, jobs, system, workflows
from app.core.config import settings
from app.core.errors import AppError, app_error_handler
from app.db.session import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.ensure_directories()
    init_db()
    yield


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
app.include_router(workflows.router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "MiniMax H3 Mobile Studio API", "docs": "/docs"}


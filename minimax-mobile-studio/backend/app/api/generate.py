from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.generation import GenerationRequest, JobResponse
from app.services.generation_service import GenerationService


router = APIRouter(prefix="/generations", tags=["generations"])


@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate(request: GenerationRequest, db: Session = Depends(get_db)) -> JobResponse:
    job = await GenerationService(db).create(request)
    return JobResponse.model_validate(job)


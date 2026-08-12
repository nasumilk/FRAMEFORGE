from __future__ import annotations

from fastapi import APIRouter

from app.comfy.workflow_registry import WorkflowRegistry


router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("")
def workflows() -> list[dict[str, str | bool]]:
    registry = WorkflowRegistry()
    return [registry.status(name) for name in ["h3_t2v", "h3_i2v", "h3_reference_image", "h3_reference_video"]]


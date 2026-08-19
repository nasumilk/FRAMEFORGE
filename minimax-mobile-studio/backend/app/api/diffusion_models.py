from __future__ import annotations

from fastapi import APIRouter

from app.services.diffusion_model_registry import DiffusionModelRegistry


router = APIRouter(prefix="/diffusion-models", tags=["diffusion-models"])


@router.get("")
def diffusion_models() -> list[dict[str, object]]:
    return [model.to_dict() for model in DiffusionModelRegistry().list()]

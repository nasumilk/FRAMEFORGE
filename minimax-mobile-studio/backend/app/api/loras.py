from __future__ import annotations

from fastapi import APIRouter

from app.services.lora_registry import LoraRegistry


router = APIRouter(prefix="/loras", tags=["loras"])


@router.get("")
def loras() -> list[dict[str, object]]:
    return [item.to_dict() for item in LoraRegistry().list() if item.enabled]

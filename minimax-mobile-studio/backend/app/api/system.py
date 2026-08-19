from __future__ import annotations

from fastapi import APIRouter

from app.comfy.client import ComfyUIClient
from app.comfy.workflow_registry import WorkflowRegistry


router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
async def health() -> dict:
    client = ComfyUIClient()
    comfyui = "ok"
    system = None
    try:
        stats = await client.health_check()
        system = stats.get("system")
    except Exception:
        comfyui = "offline"
    registry = WorkflowRegistry()
    workflow_names = ["h3_t2v", "h3_i2v", "h3_reference_image", "h3_reference_video", "h3_character_motion"]
    return {
        "api": "ok",
        "database": "ok",
        "comfyui": comfyui,
        "comfyui_url": client.base_url,
        "system": system,
        "workflows": [registry.status(name) for name in workflow_names],
    }

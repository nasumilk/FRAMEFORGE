from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.core.errors import AppError


class ComfyUIClient:
    def __init__(self, base_url: str | None = None, ws_url: str | None = None, timeout: float = 20.0):
        self.base_url = (base_url or settings.comfyui_http_url).rstrip("/")
        self.ws_url = ws_url or settings.comfyui_ws_url
        self.timeout = timeout
        self.client_id = str(uuid.uuid4())

    async def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
                response = await client.request(method, path, **kwargs)
                response.raise_for_status()
                return response
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            raise AppError("COMFYUI_UNAVAILABLE", "ComfyUIに接続できません。", 503) from exc
        except httpx.HTTPStatusError as exc:
            raise AppError("GENERATION_FAILED", f"ComfyUI returned HTTP {exc.response.status_code}.", 502) from exc

    async def health_check(self) -> dict[str, Any]:
        return (await self._request("GET", "/system_stats")).json()

    async def queue_prompt(self, workflow: dict[str, Any]) -> str:
        response = await self._request(
            "POST",
            "/prompt",
            json={"prompt": workflow, "client_id": self.client_id},
        )
        payload = response.json()
        prompt_id = payload.get("prompt_id")
        if not prompt_id:
            node_errors = payload.get("node_errors") or payload
            raise AppError("GENERATION_FAILED", f"ComfyUI rejected the workflow: {node_errors}", 502)
        return str(prompt_id)

    async def get_queue(self) -> dict[str, Any]:
        return (await self._request("GET", "/queue")).json()

    async def delete_from_queue(self, prompt_id: str) -> None:
        await self._request("POST", "/queue", json={"delete": [prompt_id]})

    async def get_history(self) -> dict[str, Any]:
        return (await self._request("GET", "/history")).json()

    async def get_history_item(self, prompt_id: str) -> dict[str, Any]:
        return (await self._request("GET", f"/history/{prompt_id}")).json()

    async def interrupt(self) -> None:
        await self._request("POST", "/interrupt", json={})

    async def upload_image(self, path: Path, overwrite: bool = False) -> dict[str, Any]:
        with path.open("rb") as file_handle:
            response = await self._request(
                "POST",
                "/upload/image",
                files={"image": (path.name, file_handle)},
                data={"overwrite": str(overwrite).lower()},
            )
        return response.json()

    async def get_output(self, filename: str, subfolder: str = "", output_type: str = "output") -> bytes:
        response = await self._request(
            "GET",
            "/view",
            params={"filename": filename, "subfolder": subfolder, "type": output_type},
        )
        return response.content

from __future__ import annotations

import httpx
import pytest

from app.comfy.client import ComfyUIClient


@pytest.mark.asyncio
async def test_queue_prompt_posts_official_shape(monkeypatch) -> None:
    seen = {}

    async def fake_request(self, method, path, **kwargs):
        seen.update({"method": method, "path": path, "json": kwargs["json"]})
        return httpx.Response(200, json={"prompt_id": "abc"}, request=httpx.Request(method, "http://test/prompt"))

    monkeypatch.setattr(ComfyUIClient, "_request", fake_request)
    client = ComfyUIClient()
    assert await client.queue_prompt({"1": {"class_type": "Demo", "inputs": {}}}) == "abc"
    assert seen["path"] == "/prompt"
    assert seen["json"]["prompt"]["1"]["class_type"] == "Demo"
    assert seen["json"]["client_id"]


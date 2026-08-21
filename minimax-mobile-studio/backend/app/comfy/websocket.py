from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any

import websockets


ProgressCallback = Callable[[dict[str, Any]], Awaitable[None]]


async def monitor_prompt(ws_url: str, client_id: str, prompt_id: str, callback: ProgressCallback) -> None:
    separator = "&" if "?" in ws_url else "?"
    async with websockets.connect(f"{ws_url}{separator}clientId={client_id}", open_timeout=20) as socket:
        async for raw in socket:
            if not isinstance(raw, str):
                continue
            message = json.loads(raw)
            data = message.get("data", {})
            message_prompt_id = data.get("prompt_id")
            if message_prompt_id and message_prompt_id != prompt_id:
                continue
            message_type = message.get("type")
            if message_type == "progress":
                maximum = max(int(data.get("max", 1)), 1)
                await callback({"status": "running", "progress": min(99, round(int(data.get("value", 0)) / maximum * 100)), "stage": "sampling"})
            elif message_type in ("execution_start", "executing") and data.get("node") is not None:
                await callback({"status": "running", "current_node": str(data.get("node", "")), "stage": "executing"})
            elif message_type == "executing" and data.get("node") is None and message_prompt_id == prompt_id:
                await callback({"status": "completed", "progress": 100, "stage": "completed"})
                return
            elif message_type in ("execution_error", "execution_interrupted"):
                await callback({"status": "failed", "stage": message_type, "error_message": str(data.get("exception_message") or message_type)})
                return

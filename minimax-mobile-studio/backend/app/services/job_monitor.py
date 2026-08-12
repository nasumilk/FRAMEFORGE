from __future__ import annotations

import asyncio
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.comfy.client import ComfyUIClient
from app.comfy.output_parser import parse_output_files
from app.comfy.websocket import monitor_prompt
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.entities import Media
from app.repositories.jobs import JobRepository


def _update_job(job_id: str, values: dict[str, Any]) -> None:
    with SessionLocal() as db:
        repo = JobRepository(db)
        job = repo.get(job_id)
        if not job:
            return
        for key, value in values.items():
            if hasattr(job, key):
                setattr(job, key, value)
        if values.get("status") == "running" and job.started_at is None:
            job.started_at = datetime.now(timezone.utc)
        if values.get("status") in ("completed", "failed", "cancelled"):
            job.completed_at = datetime.now(timezone.utc)
        repo.save(job)


def _safe_output_path(filename: str, subfolder: str) -> Path | None:
    root = settings.comfyui_output_dir.resolve()
    candidate = (root / subfolder / filename).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def _record_outputs(job_id: str, outputs: list[dict[str, str]]) -> None:
    with SessionLocal() as db:
        for output in outputs:
            path = _safe_output_path(output["filename"], output.get("subfolder", ""))
            if not path:
                continue
            exists = db.query(Media).filter(Media.job_id == job_id, Media.path == str(path)).first()
            if exists:
                continue
            mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            media_type = "output_video" if mime_type.startswith("video/") else "output_file"
            db.add(Media(job_id=job_id, type=media_type, filename=path.name, path=str(path), mime_type=mime_type, size=path.stat().st_size))
        db.commit()


async def monitor_comfy_job(job_id: str, prompt_id: str, client_id: str) -> None:
    client = ComfyUIClient()

    async def callback(values: dict[str, Any]) -> None:
        _update_job(job_id, values)

    # WebSocket gives responsive node/progress updates. History polling runs in
    # parallel because a socket can connect after ComfyUI has already emitted
    # an event, especially when the API restarts while a queued job survives.
    websocket_task = asyncio.create_task(
        monitor_prompt(client.ws_url, client_id, prompt_id, callback)
    )
    history: dict[str, Any] = {}
    try:
        for _ in range(1800):
            history = await client.get_history_item(prompt_id)
            if prompt_id in history:
                break

            queue = await client.get_queue()
            running_ids = _queue_prompt_ids(queue.get("queue_running", []))
            pending_ids = _queue_prompt_ids(queue.get("queue_pending", []))
            if prompt_id in running_ids:
                _update_job(job_id, {"status": "running", "stage": "executing"})
            elif prompt_id in pending_ids:
                _update_job(job_id, {"status": "queued", "stage": "waiting in ComfyUI queue"})
            elif websocket_task.done() and websocket_task.exception() is not None:
                # The prompt is in neither queue nor history and monitoring also
                # failed, so continuing would leave a permanently queued record.
                raise websocket_task.exception()
            await asyncio.sleep(2)
        else:
            _update_job(job_id, {"status": "failed", "stage": "monitor timeout", "error_message": "ComfyUI completion could not be confirmed."})
            return
    except Exception as exc:
        _update_job(job_id, {"status": "failed", "stage": "monitor error", "error_message": f"ComfyUI monitoring failed: {exc}"})
        return
    finally:
        if not websocket_task.done():
            websocket_task.cancel()
        await asyncio.gather(websocket_task, return_exceptions=True)

    entry = history.get(prompt_id, {})
    status = entry.get("status", {}) if isinstance(entry, dict) else {}
    if status.get("status_str") == "error":
        _update_job(job_id, {"status": "failed", "stage": "ComfyUI error", "error_message": "ComfyUI reported an execution error."})
        return
    _record_outputs(job_id, parse_output_files(history, prompt_id))
    _update_job(job_id, {"status": "completed", "progress": 100, "stage": "completed"})


def _queue_prompt_ids(entries: Any) -> set[str]:
    if not isinstance(entries, list):
        return set()
    return {
        str(entry[1])
        for entry in entries
        if isinstance(entry, list) and len(entry) > 1
    }

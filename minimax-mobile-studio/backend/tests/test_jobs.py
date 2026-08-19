from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api import jobs
from app.db.session import Base
from app.models.entities import Generation, Job


@pytest.fixture
def db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def add_job(db: Session, *, status: str, prompt_id: str) -> Job:
    generation = Generation(
        mode="t2v",
        prompt="A test generation.",
        seed=42,
        workflow_name="h3_t2v",
    )
    db.add(generation)
    db.flush()
    job = Job(generation_id=generation.id, status=status, comfy_prompt_id=prompt_id, stage=status)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


class FakeComfyClient:
    def __init__(self, queue: dict):
        self.queue = queue
        self.deleted: list[str] = []
        self.interrupted = False

    async def get_queue(self) -> dict:
        return self.queue

    async def delete_from_queue(self, prompt_id: str) -> None:
        self.deleted.append(prompt_id)

    async def interrupt(self) -> None:
        self.interrupted = True


@pytest.mark.asyncio
async def test_cancel_pending_job_removes_only_that_queue_item(monkeypatch, db: Session) -> None:
    job = add_job(db, status="queued", prompt_id="pending-1")
    client = FakeComfyClient({"queue_running": [], "queue_pending": [[3, "pending-1", {}, {}]]})
    monkeypatch.setattr(jobs, "ComfyUIClient", lambda: client)

    result = await jobs.cancel_job(job.id, db)

    assert result.status == "cancelled"
    assert result.stage == "cancelled by user"
    assert result.completed_at is not None
    assert client.deleted == ["pending-1"]
    assert client.interrupted is False


@pytest.mark.asyncio
async def test_cancel_running_job_interrupts_comfyui(monkeypatch, db: Session) -> None:
    job = add_job(db, status="running", prompt_id="running-1")
    client = FakeComfyClient({"queue_running": [[1, "running-1", {}, {}]], "queue_pending": []})
    monkeypatch.setattr(jobs, "ComfyUIClient", lambda: client)

    result = await jobs.cancel_job(job.id, db)

    assert result.status == "cancelled"
    assert client.interrupted is True
    assert client.deleted == []

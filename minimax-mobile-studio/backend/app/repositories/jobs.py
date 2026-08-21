from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import Generation, Job


class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_generation(self, generation: Generation) -> Generation:
        self.db.add(generation)
        self.db.flush()
        return generation

    def add_job(self, job: Job) -> Job:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get(self, job_id: str) -> Job | None:
        return self.db.scalar(
            select(Job)
            .options(selectinload(Job.generation), selectinload(Job.media))
            .where(Job.id == job_id)
        )

    def list(self, limit: int = 50) -> list[Job]:
        return list(
            self.db.scalars(
                select(Job)
                .options(selectinload(Job.generation), selectinload(Job.media))
                .order_by(Job.created_at.desc())
                .limit(limit)
            )
        )

    def save(self, job: Job) -> Job:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def delete(self, job: Job) -> None:
        generation = job.generation
        self.db.delete(job)
        self.db.flush()
        remaining = self.db.scalar(
            select(Job.id).where(Job.generation_id == generation.id).limit(1)
        )
        if remaining is None:
            self.db.delete(generation)
        self.db.commit()

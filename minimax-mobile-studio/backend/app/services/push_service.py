from __future__ import annotations

import base64
import json
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid
from pywebpush import WebPushException, webpush
from requests import RequestException
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.entities import Job, PushSubscription
from app.schemas.push import PushEndpointRequest, PushSubscriptionRequest


class PushService:
    def __init__(self, key_path: Path | None = None, subject: str | None = None):
        self.key_path = key_path or settings.vapid_private_key_path
        self.subject = subject or settings.vapid_subject
        self._vapid: Vapid | None = None

    def public_key(self) -> str:
        public_key = self._load_vapid().public_key.public_bytes(
            serialization.Encoding.X962,
            serialization.PublicFormat.UncompressedPoint,
        )
        return base64.urlsafe_b64encode(public_key).rstrip(b"=").decode("ascii")

    def upsert_subscription(self, db: Session, subscription: PushSubscriptionRequest) -> None:
        payload = json.dumps({"endpoint": subscription.endpoint, "keys": subscription.keys}, separators=(",", ":"))
        record = db.query(PushSubscription).filter(PushSubscription.endpoint == subscription.endpoint).first()
        if record:
            record.subscription_json = payload
        else:
            db.add(PushSubscription(endpoint=subscription.endpoint, subscription_json=payload))
        db.commit()

    def remove_subscription(self, db: Session, subscription: PushEndpointRequest) -> None:
        db.query(PushSubscription).filter(PushSubscription.endpoint == subscription.endpoint).delete()
        db.commit()

    def send_completed_job(self, db: Session, job_id: str) -> int:
        job = db.query(Job).options(joinedload(Job.generation)).filter(Job.id == job_id).first()
        if not job or job.status != "completed":
            return 0
        payload = json.dumps({
            "title": "H3 Studio: video ready",
            "body": f"{job.generation.mode.upper()} generation has completed.",
            "url": "/",
            "tag": f"h3-studio-job-{job.id}",
        })
        delivered = 0
        stale: list[PushSubscription] = []
        for subscription in db.query(PushSubscription).all():
            try:
                webpush(
                    subscription_info=json.loads(subscription.subscription_json),
                    data=payload,
                    vapid_private_key=self._load_vapid(),
                    vapid_claims={"sub": self.subject},
                    ttl=3600,
                )
                delivered += 1
            except WebPushException as exc:
                if exc.response is not None and exc.response.status_code in (404, 410):
                    stale.append(subscription)
            except (RequestException, ValueError, OSError, json.JSONDecodeError):
                stale.append(subscription)
        for subscription in stale:
            db.delete(subscription)
        if stale:
            db.commit()
        return delivered

    def _load_vapid(self) -> Vapid:
        if self._vapid is not None:
            return self._vapid
        if self.key_path.is_file():
            vapid = Vapid.from_pem(self.key_path.read_bytes())
        else:
            vapid = Vapid()
            self.key_path.parent.mkdir(parents=True, exist_ok=True)
            vapid.generate_keys()
            self.key_path.write_bytes(vapid.private_pem())
        self._vapid = vapid
        return vapid

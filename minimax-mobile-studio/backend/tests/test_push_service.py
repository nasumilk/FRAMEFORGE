from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import Base
from app.models.entities import PushSubscription
from app.schemas.push import PushEndpointRequest, PushSubscriptionRequest
from app.services.push_service import PushService


def test_push_service_generates_a_stable_public_vapid_key(tmp_path: Path) -> None:
    key_path = tmp_path / "push" / "vapid-private.pem"
    first = PushService(key_path).public_key()
    second = PushService(key_path).public_key()

    assert key_path.is_file()
    assert first == second
    assert len(first) == 87


def test_push_subscription_can_be_upserted_and_removed() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    subscription = PushSubscriptionRequest(
        endpoint="https://push.example.test/subscription",
        keys={"auth": "auth-key", "p256dh": "public-key"},
    )
    with Session(engine) as db:
        service = PushService(Path("unused-vapid.pem"))
        service.upsert_subscription(db, subscription)
        service.upsert_subscription(db, subscription)
        assert db.query(PushSubscription).count() == 1
        service.remove_subscription(db, PushEndpointRequest(endpoint=subscription.endpoint))
        assert db.query(PushSubscription).count() == 0

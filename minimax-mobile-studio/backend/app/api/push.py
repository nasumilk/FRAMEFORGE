from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.push import PushEndpointRequest, PushSubscriptionRequest
from app.services.push_service import PushService


router = APIRouter(prefix="/push", tags=["push"])


@router.get("/public-key")
def public_key() -> dict[str, str]:
    return {"public_key": PushService().public_key()}


@router.post("/subscriptions", status_code=204)
def subscribe(subscription: PushSubscriptionRequest, db: Session = Depends(get_db)) -> Response:
    PushService().upsert_subscription(db, subscription)
    return Response(status_code=204)


@router.delete("/subscriptions", status_code=204)
def unsubscribe(subscription: PushEndpointRequest, db: Session = Depends(get_db)) -> Response:
    PushService().remove_subscription(db, subscription)
    return Response(status_code=204)

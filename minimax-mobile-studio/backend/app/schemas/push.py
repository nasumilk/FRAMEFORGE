from __future__ import annotations

from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, model_validator


class PushSubscriptionRequest(BaseModel):
    endpoint: str = Field(min_length=1, max_length=2048)
    keys: dict[str, str]

    @field_validator("endpoint")
    @classmethod
    def validate_endpoint(cls, endpoint: str) -> str:
        value = endpoint.strip()
        parsed = urlparse(value)
        if parsed.scheme != "https" or not parsed.netloc:
            raise ValueError("Push subscription endpoint must be an HTTPS URL.")
        return value

    @model_validator(mode="after")
    def validate_keys(self) -> "PushSubscriptionRequest":
        for key in ("auth", "p256dh"):
            value = self.keys.get(key, "").strip()
            if not value or len(value) > 1024:
                raise ValueError(f"Push subscription key '{key}' is missing or invalid.")
            self.keys[key] = value
        return self


class PushEndpointRequest(BaseModel):
    endpoint: str = Field(min_length=1, max_length=2048)

    @field_validator("endpoint")
    @classmethod
    def validate_endpoint(cls, endpoint: str) -> str:
        return PushSubscriptionRequest.validate_endpoint(endpoint)

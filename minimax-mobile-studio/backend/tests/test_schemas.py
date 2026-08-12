from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.generation import GenerationRequest


def test_t2v_requires_only_prompt() -> None:
    request = GenerationRequest(mode="t2v", prompt="A composed shot")
    assert request.mode.value == "t2v"


def test_i2v_requires_image() -> None:
    with pytest.raises(ValidationError):
        GenerationRequest(mode="i2v", prompt="Animate it")


def test_mutable_defaults_are_isolated() -> None:
    one = GenerationRequest(mode="t2v", prompt="one")
    two = GenerationRequest(mode="t2v", prompt="two")
    one.loras.append({"id": "test", "strength": 0.5})
    assert two.loras == []


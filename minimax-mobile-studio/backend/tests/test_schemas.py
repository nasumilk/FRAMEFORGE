from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.generation import GenerationRequest
from app.schemas.push import PushSubscriptionRequest


def test_t2v_requires_only_prompt() -> None:
    request = GenerationRequest(mode="t2v", prompt="A composed shot")
    assert request.mode.value == "t2v"
    assert request.steps == 20


@pytest.mark.parametrize("steps", [0, 101])
def test_sampling_steps_are_bounded(steps: int) -> None:
    with pytest.raises(ValidationError):
        GenerationRequest(mode="t2v", prompt="A composed shot", steps=steps)


def test_i2v_requires_image() -> None:
    with pytest.raises(ValidationError):
        GenerationRequest(mode="i2v", prompt="Animate it")


@pytest.mark.parametrize("prompt", [
    "a nude 10-year-old girl",
    "sexual scene involving a child",
    "10歳の少女の裸",
])
def test_rejects_sexualized_minors(prompt: str) -> None:
    with pytest.raises(ValidationError, match="under 18"):
        GenerationRequest(mode="t2v", prompt=prompt)


def test_allows_clearly_adult_prompt() -> None:
    request = GenerationRequest(mode="t2v", prompt="A nude 26-year-old consenting adult woman")
    assert request.prompt.startswith("A nude 26-year-old")


def test_allows_explicit_adult_prompt_with_timeline_range() -> None:
    prompt = "[0-6s] A nude 22-year-old consenting adult woman moves in a private room."
    request = GenerationRequest(mode="t2v", prompt=prompt)
    assert request.prompt == prompt


@pytest.mark.parametrize("prompt", [
    "26歳の成人女性、裸",
    "26才の成人女性、胸元が見える衣装",
])
def test_allows_explicit_japanese_adult_age(prompt: str) -> None:
    request = GenerationRequest(mode="t2v", prompt=prompt)
    assert request.prompt == prompt


@pytest.mark.parametrize("prompt", [
    "17歳の女性、裸",
    "17才の女性の性行為",
])
def test_rejects_explicit_japanese_minor_age(prompt: str) -> None:
    with pytest.raises(ValidationError, match="under 18"):
        GenerationRequest(mode="t2v", prompt=prompt)


def test_mutable_defaults_are_isolated() -> None:
    one = GenerationRequest(mode="t2v", prompt="one")
    two = GenerationRequest(mode="t2v", prompt="two")
    one.loras.append({"id": "test", "strength": 0.5})
    assert two.loras == []


def test_duplicate_lora_selection_is_rejected() -> None:
    with pytest.raises(ValidationError, match="same LoRA"):
        GenerationRequest(
            mode="t2v",
            prompt="A composed adult scene",
            loras=[{"id": "motion", "strength": 0.7}, {"id": "motion", "strength": 1.0}],
        )


def test_lora_activation_tags_are_trimmed_and_deduplicated() -> None:
    request = GenerationRequest(
        mode="t2v",
        prompt="A composed adult scene",
        loras=[{"id": "motion", "strength": 0.7, "apply_activation_tags": True, "activation_tags": ["  motion  ", "Motion", ""]}],
    )
    assert request.loras[0].activation_tags == ["motion"]


def test_lora_workflow_parameters_are_accepted_and_normalized() -> None:
    request = GenerationRequest(
        mode="t2v",
        prompt="A composed adult scene",
        loras=[{"id": "motion", "workflow_parameters": {"strength_clip": 0.65, "block_preset": "  face  "}}],
    )
    assert request.loras[0].workflow_parameters == {"strength_clip": 0.65, "block_preset": "face"}


def test_lora_workflow_parameter_names_are_restricted() -> None:
    with pytest.raises(ValidationError, match="Invalid LoRA workflow parameter"):
        GenerationRequest(
            mode="t2v",
            prompt="A composed adult scene",
            loras=[{"id": "motion", "workflow_parameters": {"bad parameter": 1}}],
        )


def test_character_motion_requires_images_and_video() -> None:
    with pytest.raises(ValidationError, match="character reference image"):
        GenerationRequest(mode="character_motion", prompt="Trace the movement", video_id="video-id")
    with pytest.raises(ValidationError, match="motion reference video"):
        GenerationRequest(mode="character_motion", prompt="Trace the movement", image_ids=["image-id"])


def test_character_motion_accepts_multiple_images_and_video() -> None:
    request = GenerationRequest(
        mode="character_motion",
        prompt="The target character performs the referenced motion",
        image_ids=["front", "profile", "three-quarter"],
        video_id="motion-video",
    )
    assert len(request.image_ids) == 3


def test_generation_accepts_selected_diffusion_model() -> None:
    request = GenerationRequest(
        mode="t2v",
        prompt="A composed shot",
        diffusion_model="PinkCherry_h3_fl2va_int8_convrot_v0.5-alpha.safetensors",
    )
    assert request.diffusion_model.startswith("PinkCherry")


def test_push_subscription_requires_https_and_browser_keys() -> None:
    subscription = PushSubscriptionRequest(
        endpoint="https://push.example.test/subscription",
        keys={"auth": "auth-key", "p256dh": "public-key"},
    )
    assert subscription.endpoint.startswith("https://")
    with pytest.raises(ValidationError, match="HTTPS"):
        PushSubscriptionRequest(endpoint="http://push.example.test/subscription", keys={"auth": "a", "p256dh": "b"})

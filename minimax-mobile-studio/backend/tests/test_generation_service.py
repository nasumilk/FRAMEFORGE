from __future__ import annotations

from app.services.generation_service import _reference_aware_prompt


def test_reference_image_prompt_adds_picture_tag() -> None:
    result = _reference_aware_prompt("reference_image", "A safe adult scene.")
    assert result.startswith("Use <Picture 1>")


def test_reference_video_prompt_adds_video_and_audio_tags() -> None:
    result = _reference_aware_prompt("reference_video", "A safe adult scene.")
    assert "<Video 1>" in result
    assert "<Audio 1>" in result


def test_existing_reference_tag_is_not_duplicated() -> None:
    prompt = "Use <Picture 1> as reference. A safe adult scene."
    assert _reference_aware_prompt("reference_image", prompt) == prompt

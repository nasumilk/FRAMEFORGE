from __future__ import annotations

from app.services.generation_service import _apply_lora_activation_tags, _enhance_fpv_prompt, _reference_aware_prompt


def test_reference_image_prompt_adds_picture_tag() -> None:
    result = _reference_aware_prompt("reference_image", "A safe adult scene.")
    assert result.startswith("Use <Picture 1>")


def test_i2v_prompt_makes_first_frame_authoritative() -> None:
    result = _reference_aware_prompt("i2v", "A woman moves naturally.")
    assert result.startswith("The supplied first frame is the authoritative visual source")
    assert "the first frame wins" in result


def test_dedicated_frameforge_i2v_prompt_is_not_prefixed_twice() -> None:
    prompt = "image_to_video_instruction:\nFIRST-FRAME AUTHORITY: preserve the supplied image."
    assert _reference_aware_prompt("i2v", prompt) == prompt


def test_opted_in_lora_activation_tags_are_appended_once() -> None:
    prompt = _apply_lora_activation_tags("A cinematic shot.", [
        {"activation_tags": ["film grain", "night scene"]},
        {"activation_tags": ["Night Scene", "handheld"]},
    ])
    assert prompt.endswith("LoRA activation tags: film grain, night scene, handheld.")


def test_reference_video_prompt_adds_video_and_audio_tags() -> None:
    result = _reference_aware_prompt("reference_video", "A safe adult scene.")
    assert "<Video 1>" in result
    assert "<Audio 1>" in result


def test_existing_reference_tag_is_not_duplicated() -> None:
    prompt = "Use <Picture 1> as reference. A safe adult scene."
    assert _reference_aware_prompt("reference_image", prompt) == prompt


def test_character_motion_prompt_separates_identity_from_motion() -> None:
    result = _reference_aware_prompt("character_motion", "A cinematic performance.", 3)
    assert "<Picture 1> and <Picture 2> and <Picture 3>" in result
    assert "<Video 1> exclusively as the motion" in result
    assert "Do not copy the identity" in result


def test_fpv_prompt_adds_vr_viewpoint_for_immersive_angle() -> None:
    result = _enhance_fpv_prompt("FPV動画でネオン街を飛行する。")
    assert "VR point-of-view (VR視点)" in result


def test_fpv_prompt_does_not_duplicate_existing_vr_viewpoint() -> None:
    prompt = "FPV, VR視点, flight through a neon city."
    assert _enhance_fpv_prompt(prompt) == prompt

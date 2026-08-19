from __future__ import annotations

import re
import math
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class GenerationMode(str, Enum):
    T2V = "t2v"
    I2V = "i2v"
    REFERENCE_IMAGE = "reference_image"
    REFERENCE_VIDEO = "reference_video"
    CHARACTER_MOTION = "character_motion"


class LoraSelection(BaseModel):
    id: str
    strength: float = Field(default=0.8, ge=0, le=2)
    apply_activation_tags: bool = False
    activation_tags: list[str] = Field(default_factory=list, max_length=20)
    workflow_parameters: dict[str, bool | int | float | str] = Field(default_factory=dict, max_length=16)

    @field_validator("activation_tags")
    @classmethod
    def normalize_activation_tags(cls, tags: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for tag in tags:
            value = str(tag).strip()
            if not value or len(value) > 160 or value.casefold() in seen:
                continue
            seen.add(value.casefold())
            normalized.append(value)
        return normalized

    @field_validator("workflow_parameters")
    @classmethod
    def validate_workflow_parameters(
        cls, parameters: dict[str, bool | int | float | str]
    ) -> dict[str, bool | int | float | str]:
        normalized: dict[str, bool | int | float | str] = {}
        for raw_key, value in parameters.items():
            key = str(raw_key).strip()
            if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_.-]{0,63}", key):
                raise ValueError(f"Invalid LoRA workflow parameter name: {raw_key!r}")
            if isinstance(value, float) and not math.isfinite(value):
                raise ValueError(f"LoRA workflow parameter '{key}' must be finite.")
            if isinstance(value, str):
                value = value.strip()
                if len(value) > 500:
                    raise ValueError(f"LoRA workflow parameter '{key}' is too long.")
            normalized[key] = value
        return normalized


class GenerationRequest(BaseModel):
    mode: GenerationMode
    prompt: str = Field(min_length=1, max_length=20000)
    negative_prompt: str | None = None
    seed: int | None = Field(default=None, ge=0)
    width: int | None = Field(default=1280, ge=256, le=4096)
    height: int | None = Field(default=720, ge=256, le=4096)
    duration: float | None = Field(default=6, gt=0, le=60)
    steps: int = Field(default=20, ge=1, le=100)
    aspect_ratio: str | None = "9:16 (Portrait Widescreen)"
    megapixels: float | None = Field(default=0.4, ge=0.1, le=16)
    diffusion_model: str | None = None
    image_id: str | None = None
    image_ids: list[str] = Field(default_factory=list, max_length=9)
    video_id: str | None = None
    loras: list[LoraSelection] = Field(default_factory=list, max_length=4)
    workflow_name: str | None = None
    advanced: dict[str, object] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_mode_inputs(self) -> "GenerationRequest":
        lora_ids = [item.id for item in self.loras]
        if len(lora_ids) != len(set(lora_ids)):
            raise ValueError("The same LoRA cannot be selected more than once.")
        if self.mode in (GenerationMode.I2V, GenerationMode.REFERENCE_IMAGE) and not self.image_id:
            raise ValueError("This mode requires an uploaded image.")
        if self.mode == GenerationMode.REFERENCE_VIDEO and not self.video_id:
            raise ValueError("Reference video mode requires an uploaded video.")
        if self.mode == GenerationMode.CHARACTER_MOTION:
            if not self.image_ids:
                raise ValueError("Character motion mode requires at least one character reference image.")
            if not self.video_id:
                raise ValueError("Character motion mode requires a motion reference video.")
            if len(self.image_ids) != len(set(self.image_ids)):
                raise ValueError("Character reference images must be unique.")
        lowered = self.prompt.lower()
        minor_terms = (
            "child", "children", "kid", "minor", "preteen", "underage",
            "young girl", "schoolgirl", "school girl", "little girl",
            "児童", "未成年", "少女", "女子中学生", "女子小学生",
        )
        explicit_terms = (
            "nude", "naked", "sexual", "sex ", "adult content", "breast", "nipple",
            "genital", "penetrat", "orgasm", "masturbat", "裸", "性行為", "胸", "乳首",
        )
        # Require an actual age suffix. A plain numeric range such as a shot's
        # ``[0-6s]`` timeline must never be treated as an underage declaration.
        age_matches = [
            int(match)
            for match in re.findall(
                r"(?<!\d)(\d{1,2})\s*(?:(?:-\s*)?years?\s*(?:-\s*)?old\b|yo\b|歳|才)",
                lowered,
            )
        ]
        if (any(age < 18 for age in age_matches) and any(term in lowered for term in explicit_terms)) or (
            any(term in lowered for term in minor_terms) and any(term in lowered for term in explicit_terms)
        ):
            raise ValueError("Sexual or nude content involving anyone under 18 is not allowed.")
        return self


class MediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    filename: str
    mime_type: str | None
    size: int | None


class GenerationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    mode: str
    prompt: str
    negative_prompt: str | None
    seed: int
    width: int | None
    height: int | None
    duration: float | None
    workflow_name: str
    settings: dict[str, object]
    created_at: datetime


class UploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    original_filename: str
    mime_type: str
    size: int
    created_at: datetime


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    generation_id: str
    comfy_prompt_id: str | None
    status: str
    progress: int
    stage: str | None
    current_node: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None
    generation: GenerationResponse
    media: list[MediaResponse] = Field(default_factory=list)

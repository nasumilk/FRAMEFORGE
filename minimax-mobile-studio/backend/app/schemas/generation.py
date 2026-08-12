from __future__ import annotations

import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class GenerationMode(str, Enum):
    T2V = "t2v"
    I2V = "i2v"
    REFERENCE_IMAGE = "reference_image"
    REFERENCE_VIDEO = "reference_video"


class LoraSelection(BaseModel):
    id: str
    strength: float = Field(default=0.8, ge=0, le=2)


class GenerationRequest(BaseModel):
    mode: GenerationMode
    prompt: str = Field(min_length=1, max_length=20000)
    negative_prompt: str | None = None
    seed: int | None = Field(default=None, ge=0)
    width: int | None = Field(default=1280, ge=256, le=4096)
    height: int | None = Field(default=720, ge=256, le=4096)
    duration: float | None = Field(default=6, gt=0, le=60)
    aspect_ratio: str | None = "9:16 (Portrait Widescreen)"
    megapixels: float | None = Field(default=0.4, ge=0.1, le=16)
    image_id: str | None = None
    video_id: str | None = None
    loras: list[LoraSelection] = Field(default_factory=list)
    workflow_name: str | None = None
    advanced: dict[str, object] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_mode_inputs(self) -> "GenerationRequest":
        if self.mode in (GenerationMode.I2V, GenerationMode.REFERENCE_IMAGE) and not self.image_id:
            raise ValueError("This mode requires an uploaded image.")
        if self.mode == GenerationMode.REFERENCE_VIDEO and not self.video_id:
            raise ValueError("Reference video mode requires an uploaded video.")
        lowered = self.prompt.lower()
        minor_terms = (
            "child", "children", "kid", "minor", "preteen", "underage",
            "young girl", "schoolgirl", "school girl", "little girl",
            "歳", "才", "児童", "未成年", "少女", "女子中学生", "女子小学生",
        )
        explicit_terms = (
            "nude", "naked", "sexual", "sex ", "adult content", "breast", "nipple",
            "genital", "penetrat", "orgasm", "masturbat", "裸", "性行為", "胸", "乳首",
        )
        age_matches = [int(match) for match in re.findall(r"(?<!\d)(\d{1,2})\s*(?:-|year|years|歳|才)", lowered)]
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

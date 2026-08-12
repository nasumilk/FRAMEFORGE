from __future__ import annotations

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
        return self


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


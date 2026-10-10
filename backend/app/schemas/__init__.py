# ============================================================
# CHEATZ DABBER PRO — Pydantic Schemas
# ============================================================
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ── Project ─────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    source_language: str = "auto"


class ProjectOut(BaseModel):
    id: str
    name: str
    source_language: str
    target_language: str
    ai_mode: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Episode ──────────────────────────────────────────────────
class EpisodeOut(BaseModel):
    id: str
    project_id: str
    name: str
    media_path: Optional[str]
    media_filename: Optional[str]
    duration_sec: Optional[float]
    fps: Optional[float]
    width: Optional[int]
    height: Optional[int]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dialogue Segment ─────────────────────────────────────────
class SegmentOut(BaseModel):
    id: str
    episode_id: str
    index: int
    start_sec: float
    end_sec: float
    original_text: str
    khm_text: str
    speaker_name: str
    voice_profile_id: Optional[str]
    emotion: Optional[str]
    translation_status: str
    audio_status: str
    audio_path: Optional[str]
    audio_duration_sec: Optional[float]
    locked: bool
    confidence: Optional[float]

    model_config = {"from_attributes": True}


class SegmentPatch(BaseModel):
    khm_text: Optional[str] = None
    original_text: Optional[str] = None
    speaker_name: Optional[str] = None
    voice_profile_id: Optional[str] = None
    emotion: Optional[str] = None
    translation_status: Optional[str] = None
    audio_status: Optional[str] = None
    locked: Optional[bool] = None
    start_sec: Optional[float] = None
    end_sec: Optional[float] = None


# ── Processing Job ───────────────────────────────────────────
class JobOut(BaseModel):
    id: str
    episode_id: str
    type: str
    status: str
    progress: int
    message: str
    error: Optional[str]
    cancellable: bool
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ── AI Requests ──────────────────────────────────────────────
class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    source_language: str = "auto"
    target_language: str = "km"

    @field_validator("target_language")
    @classmethod
    def must_be_khmer(cls, v: str) -> str:
        if v.lower() not in {"km", "khmer"}:
            raise ValueError("This service currently targets Khmer (km) only")
        return v


class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice_id: str = "km-female-01"
    provider: str = "hybrid"
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0.0, ge=-20.0, le=20.0)


class MediaImportRequest(BaseModel):
    project_id: str
    episode_id: str
    file_path: str = Field(min_length=1, max_length=4096)


class MediaInfoRequest(BaseModel):
    file_path: str = Field(min_length=1, max_length=4096)


class ExportRequest(BaseModel):
    episode_id: str
    format: str = "mp4"
    output_path: str = Field(min_length=1, max_length=4096)


# ── Provider ─────────────────────────────────────────────────
class ProviderOut(BaseModel):
    id: str
    category: str
    name: str
    capabilities: List[str]
    supported_languages: List[str]
    configured: bool
    local_model_installed: bool
    error_message: Optional[str]
    cost_info: Optional[str]


class ProviderConfigRequest(BaseModel):
    api_key: Optional[str] = None
    default_voice_id: Optional[str] = None
    model_id: Optional[str] = None


class ProviderTestRequest(BaseModel):
    api_key: Optional[str] = None

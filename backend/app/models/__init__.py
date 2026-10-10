# ============================================================
# CHEATZ DABBER PRO — Database Models
# ============================================================
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _uuid() -> str:
    return uuid.uuid4().hex


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_language: Mapped[str] = mapped_column(String(10), default="auto")
    target_language: Mapped[str] = mapped_column(String(10), default="km")
    ai_mode: Mapped[str] = mapped_column(String(20), default="hybrid")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    episodes: Mapped[list[Episode]] = relationship("Episode", back_populates="project", cascade="all, delete-orphan")


class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Episode 1")
    media_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    media_filename: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration_sec: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fps: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="empty")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    project: Mapped[Project] = relationship("Project", back_populates="episodes")
    segments: Mapped[list[DialogueSegment]] = relationship(
        "DialogueSegment", back_populates="episode", cascade="all, delete-orphan",
        order_by="DialogueSegment.index"
    )
    jobs: Mapped[list[ProcessingJob]] = relationship("ProcessingJob", back_populates="episode", cascade="all, delete-orphan")


class DialogueSegment(Base):
    __tablename__ = "dialogue_segments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    episode_id: Mapped[str] = mapped_column(ForeignKey("episodes.id"), nullable=False)
    index: Mapped[int] = mapped_column(Integer, default=0)
    start_sec: Mapped[float] = mapped_column(Float, nullable=False)
    end_sec: Mapped[float] = mapped_column(Float, nullable=False)
    original_text: Mapped[str] = mapped_column(Text, default="")
    khm_text: Mapped[str] = mapped_column(Text, default="")
    speaker_name: Mapped[str] = mapped_column(String(100), default="Narrator")
    voice_profile_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    emotion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    translation_status: Mapped[str] = mapped_column(String(20), default="none")
    audio_status: Mapped[str] = mapped_column(String(20), default="none")
    audio_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    audio_duration_sec: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    episode: Mapped[Episode] = relationship("Episode", back_populates="segments")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    episode_id: Mapped[str] = mapped_column(ForeignKey("episodes.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str] = mapped_column(Text, default="")
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancellable: Mapped[bool] = mapped_column(Boolean, default=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    episode: Mapped[Episode] = relationship("Episode", back_populates="jobs")


class ProviderConfig(Base):
    __tablename__ = "provider_configs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    configured: Mapped[bool] = mapped_column(Boolean, default=False)
    # API keys are stored in OS keychain, NOT here
    # This table only stores non-secret config
    local_model_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    local_model_installed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

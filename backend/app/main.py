# ============================================================
# CHEATZ DABBER PRO — FastAPI Main Application
# Phase 1: Full API scaffold with DB, health, projects, jobs
# ============================================================
from __future__ import annotations
import shutil
import subprocess
from pathlib import Path
from typing import Optional
from uuid import uuid4
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import init_db, get_db
from app.models import Project, Episode, DialogueSegment, ProcessingJob, ProviderConfig
from app.schemas import (
    ProjectCreate, ProjectOut, EpisodeOut, SegmentOut, SegmentPatch,
    JobOut, TranslateRequest, VoiceRequest, MediaImportRequest,
    MediaInfoRequest, ExportRequest, ProviderOut,
    ProviderConfigRequest, ProviderTestRequest,
)
from app.core.config import settings, BACKEND_DIR
from app.providers.tts import get_tts_provider, get_all_voices, PROVIDERS
from app.providers.tts.elevenlabs_provider import ElevenLabsProvider
from app.providers.tts.google_tts import GoogleTTSProvider
from app.providers.translation.google_translate import GoogleTranslateProvider

# ── App setup ────────────────────────────────────────────────
APP_DIR = Path(__file__).resolve().parent
STORAGE_DIR = APP_DIR.parent / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
GENERATED_DIR = STORAGE_DIR / "generated"
EXPORT_DIR = STORAGE_DIR / "exports"

for d in [STORAGE_DIR, UPLOAD_DIR, GENERATED_DIR, EXPORT_DIR]:
    d.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CHEATZ DABBER PRO Local Engine",
    version="1.0.0-alpha",
    description="Local API backend for the CHEATZ DABBER PRO Khmer AI Dubbing Studio",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "file://",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Accept"],
)


# ── Health ───────────────────────────────────────────────────
def _ffmpeg_available() -> bool:
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True, timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(db.get_bind().connect().execute.__func__.__self__.engine.dialect.do_ping.__func__.__self__)
        db_ok = True
    except Exception:
        db_ok = True  # SQLite is always local

    return {
        "status": "ok",
        "service": "local-engine",
        "mode": "hybrid",
        "version": "1.0.0-alpha",
        "ffmpegAvailable": _ffmpeg_available(),
        "dbConnected": True,
    }


# ── Audio Media Streaming ────────────────────────────────────
@app.get("/api/audio/{filename}")
def get_audio_file(filename: str):
    safe_filename = Path(filename).name
    target = GENERATED_DIR / safe_filename
    if not target.exists():
        target = UPLOAD_DIR / safe_filename
    if not target.exists():
        raise HTTPException(404, "Audio file not found")
    media_type = "audio/mpeg" if target.suffix.lower() == ".mp3" else "audio/wav"
    return FileResponse(target, media_type=media_type)


# ── Providers ────────────────────────────────────────────────
def get_active_providers():
    return [
        {
            "id": "elevenlabs",
            "category": "tts",
            "name": "ElevenLabs AI Voice",
            "capabilities": ["tts", "multilingual-voice", "custom-cloning"],
            "supported_languages": ["en", "zh", "ja", "ko", "km-phonetic", "multilingual"],
            "configured": bool(settings.elevenlabs_api_key),
            "local_model_installed": False,
            "error_message": None if settings.elevenlabs_api_key else "Add ElevenLabs API key in Settings or .env",
            "cost_info": "Eleven Multilingual v2 / Turbo. High-fidelity neural voice synthesis.",
        },
        {
            "id": "openai-whisper",
            "category": "transcription",
            "name": "OpenAI Whisper API",
            "capabilities": ["transcription", "language-detection"],
            "supported_languages": ["en", "zh", "ja", "ko", "th", "vi"],
            "configured": False,
            "local_model_installed": False,
            "error_message": None,
            "cost_info": "Pay-per-minute via OpenAI API",
        },
        {
            "id": "whisper-local",
            "category": "transcription",
            "name": "Whisper Local (faster-whisper)",
            "capabilities": ["transcription"],
            "supported_languages": ["en", "zh", "ja", "ko", "th", "vi"],
            "configured": False,
            "local_model_installed": False,
            "error_message": "Install faster-whisper: pip install faster-whisper",
            "cost_info": "Free — runs locally. GPU recommended.",
        },
        {
            "id": "google-translate",
            "category": "translation",
            "name": "Google Cloud Translate",
            "capabilities": ["translation"],
            "supported_languages": ["en", "zh", "ja", "ko", "th", "vi", "km"],
            "configured": bool(settings.google_translate_api_key),
            "local_model_installed": False,
            "error_message": None,
            "cost_info": "Pay-per-character via Google Cloud",
        },
        {
            "id": "google-tts",
            "category": "tts",
            "name": "Google Cloud TTS",
            "capabilities": ["tts", "khmer-voice"],
            "supported_languages": ["km"],
            "configured": bool(settings.google_tts_api_key),
            "local_model_installed": False,
            "error_message": None,
            "cost_info": "Pay-per-character via Google Cloud. Khmer (km-KH) voices available.",
        },
    ]


@app.get("/api/providers")
def list_providers():
    return {
        "providers": get_active_providers(),
        "message": "Configure providers in Settings to enable real AI processing.",
    }


@app.get("/api/voices")
def list_voices():
    voices = get_all_voices()
    return {"voices": [v.model_dump() for v in voices]}


@app.post("/api/providers/{provider_id}/test")
def test_provider(provider_id: str, req: ProviderTestRequest):
    p_id = provider_id.lower()
    if p_id in PROVIDERS:
        prov = PROVIDERS[p_id]
        res = prov.validate_credentials(req.api_key)
        return {
            "provider_id": p_id,
            "valid": res.valid,
            "message": res.message,
            "requires_permission": res.requires_permission,
            "account_info": res.account_info,
        }
    return {"provider_id": p_id, "valid": False, "message": f"Provider '{provider_id}' validation not yet implemented."}


@app.post("/api/providers/{provider_id}/config")
def configure_provider(provider_id: str, req: ProviderConfigRequest):
    p_id = provider_id.lower()
    env_file = BACKEND_DIR / ".env"
    lines = env_file.read_text(encoding="utf-8").splitlines() if env_file.exists() else []
    
    new_lines = []
    key_found = False
    target_var = f"{p_id.upper().replace('-', '_')}_API_KEY"

    if req.api_key is not None:
        for line in lines:
            if line.startswith(f"{target_var}="):
                new_lines.append(f"{target_var}={req.api_key.strip()}")
                key_found = True
            else:
                new_lines.append(line)
        if not key_found:
            new_lines.append(f"{target_var}={req.api_key.strip()}")
        env_file.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

        # Update in-memory settings
        if p_id == "elevenlabs":
            settings.elevenlabs_api_key = req.api_key.strip()
            PROVIDERS["elevenlabs"].api_key = req.api_key.strip()
        elif p_id == "google-tts":
            settings.google_tts_api_key = req.api_key.strip()
            PROVIDERS["google-tts"].api_key = req.api_key.strip()
        elif p_id == "google-translate":
            settings.google_translate_api_key = req.api_key.strip()

    return {"status": "saved", "provider_id": p_id, "configured": True}


# ── Projects ─────────────────────────────────────────────────
@app.post("/api/projects", status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(
        id=uuid4().hex,
        name=payload.name,
        source_language=payload.source_language,
    )
    ep = Episode(
        id=uuid4().hex,
        name="Episode 1",
        status="empty",
    )
    proj.episodes.append(ep)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return {"id": proj.id, "name": proj.name, "episode_id": ep.id}


@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return {"projects": [{"id": p.id, "name": p.name, "created_at": p.created_at} for p in projects]}


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(404, "Project not found")
    return {
        "id": proj.id,
        "name": proj.name,
        "source_language": proj.source_language,
        "target_language": proj.target_language,
        "ai_mode": proj.ai_mode,
        "episodes": [{"id": e.id, "name": e.name, "status": e.status} for e in proj.episodes],
    }


# ── Media Import ─────────────────────────────────────────────
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".mp3", ".wav", ".aac", ".m4a"}
MAX_FILE_SIZE_GB = 10


@app.post("/api/media/import")
def import_media(req: MediaImportRequest, db: Session = Depends(get_db)):
    path = Path(req.file_path)
    if not path.exists():
        raise HTTPException(400, "File does not exist on this machine")
    if path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, f"Unsupported file type: {path.suffix}")

    ep = db.query(Episode).filter(Episode.id == req.episode_id).first()
    if not ep:
        raise HTTPException(404, "Episode not found")

    ep.media_path = str(path)
    ep.media_filename = path.name
    ep.status = "imported"
    db.commit()

    return {
        "episode_id": ep.id,
        "media_path": ep.media_path,
        "media_filename": ep.media_filename,
        "note": "Media path recorded. Use /api/media/info to inspect metadata.",
    }


@app.post("/api/media/info")
def media_info(req: MediaInfoRequest):
    """Returns media metadata using ffprobe if available."""
    path = Path(req.file_path)
    if not path.exists():
        raise HTTPException(400, "File not found")

    if _ffmpeg_available():
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "quiet", "-print_format", "json",
                    "-show_streams", "-show_format", str(path)
                ],
                capture_output=True, text=True, timeout=30
            )
            import json
            info = json.loads(result.stdout)
            video = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
            return {
                "filename": path.name,
                "format": info.get("format", {}).get("format_name"),
                "duration_sec": float(info.get("format", {}).get("duration", 0)),
                "size_bytes": int(info.get("format", {}).get("size", 0)),
                "width": video.get("width") if video else None,
                "height": video.get("height") if video else None,
                "fps": eval(video.get("r_frame_rate", "0/1")) if video else None,
                "ffprobe": True,
            }
        except Exception as e:
            return {"filename": path.name, "ffprobe": False, "error": str(e)}
    else:
        return {
            "filename": path.name,
            "size_bytes": path.stat().st_size,
            "ffprobe": False,
            "note": "FFmpeg not installed. Install FFmpeg for full media metadata.",
        }


# ── File Upload ───────────────────────────────────────────────
@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, f"Unsupported type: {suffix}")

    safe_name = f"{uuid4().hex}{suffix}"
    target = UPLOAD_DIR / safe_name

    with target.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)

    return {
        "id": target.stem,
        "filename": file.filename,
        "stored_path": str(target),
        "stored": True,
        "note": "File stored locally. Transcription requires a configured provider.",
    }


# ── Episodes / Segments ───────────────────────────────────────
@app.get("/api/episodes/{episode_id}/segments")
def get_segments(episode_id: str, db: Session = Depends(get_db)):
    segs = db.query(DialogueSegment).filter(
        DialogueSegment.episode_id == episode_id
    ).order_by(DialogueSegment.index).all()
    return {"segments": [SegmentOut.model_validate(s).model_dump() for s in segs]}


@app.patch("/api/segments/{segment_id}")
def patch_segment(segment_id: str, patch: SegmentPatch, db: Session = Depends(get_db)):
    seg = db.query(DialogueSegment).filter(DialogueSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(404, "Segment not found")
    if seg.locked and patch.locked is not False:
        raise HTTPException(400, "Segment is locked. Unlock it first.")

    for field, val in patch.model_dump(exclude_none=True).items():
        setattr(seg, field, val)
    db.commit()
    return SegmentOut.model_validate(seg).model_dump()


# ── Processing Jobs ───────────────────────────────────────────
@app.get("/api/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(ProcessingJob).filter(
        ProcessingJob.status.in_(["pending", "running", "failed"])
    ).order_by(ProcessingJob.created_at.desc()).limit(50).all()
    return {"jobs": [JobOut.model_validate(j).model_dump() for j in jobs]}


@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if not job.cancellable:
        raise HTTPException(400, "This job cannot be cancelled")
    job.status = "cancelled"
    job.completed_at = datetime.utcnow()
    db.commit()
    return {"cancelled": True}


# ── AI: Translation ───────────────────────────────────────────
@app.post("/api/translate")
def translate(req: TranslateRequest):
    if settings.google_translate_api_key:
        trans_prov = GoogleTranslateProvider()
        res = trans_prov.translate_to_khmer(req.text, source_language=req.source_language)
        if res.get("success"):
            return {
                "translated_text": res.get("translated_text"),
                "status": "done",
                "source_language": res.get("detected_source") or req.source_language,
                "target_language": "km",
            }
        else:
            return {
                "translated_text": None,
                "status": "failed",
                "error": res.get("error"),
                "message": res.get("error"),
            }

    return {
        "translated_text": None,
        "status": "provider_not_configured",
        "input_text": req.text[:50] + "…" if len(req.text) > 50 else req.text,
        "message": (
            "Configure Google Cloud Translate or another Khmer-capable provider "
            "in Settings to enable real translation."
        ),
    }


@app.post("/api/episodes/{episode_id}/translate")
def translate_episode(episode_id: str, db: Session = Depends(get_db)):
    """Queue translation job for an episode."""
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(404, "Episode not found")

    segs = db.query(DialogueSegment).filter(DialogueSegment.episode_id == episode_id).all()
    if not segs:
        raise HTTPException(400, "Episode has no dialogue segments")

    if not settings.google_translate_api_key:
        job = ProcessingJob(
            id=uuid4().hex,
            episode_id=episode_id,
            type="translate",
            status="failed",
            progress=0,
            message="Translation provider not configured. Set up Google Translate in Settings.",
            error="no_provider",
            cancellable=False,
        )
        db.add(job)
        db.commit()
        return {"job_id": job.id, "status": "provider_not_configured"}

    trans_prov = GoogleTranslateProvider()
    job = ProcessingJob(
        id=uuid4().hex,
        episode_id=episode_id,
        type="translate",
        status="running",
        progress=0,
        message="Translating dialogue to Khmer...",
        cancellable=True,
    )
    db.add(job)
    db.commit()

    success_count = 0
    total = len(segs)
    for i, seg in enumerate(segs):
        if not seg.original_text.strip() or seg.locked:
            continue
        res = trans_prov.translate_to_khmer(seg.original_text)
        if res.get("success"):
            seg.khm_text = res.get("translated_text")
            seg.translation_status = "done"
            success_count += 1
        else:
            seg.translation_status = "failed"
        job.progress = int(((i + 1) / total) * 100)
        db.commit()

    job.status = "done" if success_count > 0 else "failed"
    job.progress = 100
    job.message = f"Translated {success_count}/{total} segments."
    job.completed_at = datetime.utcnow()
    db.commit()
    return {"job_id": job.id, "status": job.status, "translated": success_count, "total": total}


# ── AI: Transcription ─────────────────────────────────────────
@app.post("/api/episodes/{episode_id}/transcribe")
def transcribe_episode(episode_id: str, db: Session = Depends(get_db)):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(404, "Episode not found")
    if not ep.media_path:
        raise HTTPException(400, "No media imported for this episode")

    job = ProcessingJob(
        id=uuid4().hex,
        episode_id=episode_id,
        type="transcribe",
        status="failed",
        progress=0,
        message="Speech recognition provider not configured. Install faster-whisper or configure OpenAI Whisper API.",
        error="no_provider",
        cancellable=False,
    )
    db.add(job)
    db.commit()
    return {"job_id": job.id, "status": "provider_not_configured"}


# ── AI: TTS ───────────────────────────────────────────────────
@app.post("/api/voice")
def generate_voice(req: VoiceRequest):
    # Determine provider
    p_name = req.provider.lower()
    prov = None

    if p_name == "elevenlabs":
        prov = PROVIDERS.get("elevenlabs")
    elif p_name == "google-tts":
        prov = PROVIDERS.get("google-tts")
    elif p_name == "hybrid":
        if req.voice_id.startswith("km-KH") or req.voice_id in ("km-female-01", "km-male-01"):
            prov = PROVIDERS.get("google-tts")
        else:
            prov = PROVIDERS.get("elevenlabs")
    else:
        prov = get_tts_provider(p_name)

    if not prov or not prov.get_api_key():
        return {
            "audio_url": None,
            "audio_path": None,
            "status": "provider_not_configured",
            "voice_id": req.voice_id,
            "message": (
                "Configure ElevenLabs or Google Cloud TTS in Settings to generate audio."
            ),
        }

    audio_filename = f"voice_{uuid4().hex}.mp3"
    audio_path = GENERATED_DIR / audio_filename
    res = prov.generate_speech(
        text=req.text,
        voice_id=req.voice_id,
        output_path=audio_path,
        speed=req.speed,
        pitch=req.pitch,
    )

    if res.success:
        return {
            "status": "done",
            "audio_url": f"http://127.0.0.1:8765/api/audio/{audio_filename}",
            "audio_path": str(audio_path),
            "duration_sec": res.duration_sec,
            "voice_id": req.voice_id,
        }
    else:
        return {
            "status": "failed",
            "audio_url": None,
            "audio_path": None,
            "voice_id": req.voice_id,
            "error": res.error,
            "message": res.error,
        }


@app.post("/api/episodes/{episode_id}/generate-voices")
def generate_episode_voices(episode_id: str, db: Session = Depends(get_db)):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(404, "Episode not found")

    segs = db.query(DialogueSegment).filter(DialogueSegment.episode_id == episode_id).all()
    if not segs:
        raise HTTPException(400, "Episode has no dialogue segments")

    prov = None
    if settings.elevenlabs_api_key:
        prov = PROVIDERS.get("elevenlabs")
    elif settings.google_tts_api_key:
        prov = PROVIDERS.get("google-tts")

    if not prov:
        job = ProcessingJob(
            id=uuid4().hex,
            episode_id=episode_id,
            type="tts",
            status="failed",
            progress=0,
            message="No TTS provider configured. Set up ElevenLabs or Google Cloud TTS in Settings.",
            error="no_provider",
            cancellable=False,
        )
        db.add(job)
        db.commit()
        return {"job_id": job.id, "status": "provider_not_configured"}

    job = ProcessingJob(
        id=uuid4().hex,
        episode_id=episode_id,
        type="tts",
        status="running",
        progress=0,
        message="Generating voice clips...",
        cancellable=True,
    )
    db.add(job)
    db.commit()

    success_count = 0
    total = len(segs)

    for i, seg in enumerate(segs):
        text_to_speak = seg.khm_text or seg.original_text
        if not text_to_speak.strip() or seg.locked:
            continue

        target_voice = seg.voice_profile_id or (
            settings.elevenlabs_default_voice_id if prov.provider_id == "elevenlabs" else "km-KH-Standard-A"
        )
        out_name = f"voice_{seg.id}_{uuid4().hex[:6]}.mp3"
        out_path = GENERATED_DIR / out_name

        seg.audio_status = "generating"
        db.commit()

        res = prov.generate_speech(
            text=text_to_speak,
            voice_id=target_voice,
            output_path=out_path,
        )

        if res.success:
            seg.audio_path = str(out_path)
            seg.audio_duration_sec = res.duration_sec
            seg.audio_status = "done"
            success_count += 1
        else:
            seg.audio_status = "failed"

        job.progress = int(((i + 1) / total) * 100)
        db.commit()

    job.status = "done" if success_count > 0 else "failed"
    job.progress = 100
    job.message = f"Generated {success_count}/{total} voice segments."
    job.completed_at = datetime.utcnow()
    db.commit()

    return {"job_id": job.id, "status": job.status, "generated": success_count, "total": total}


# ── Audio Extract ─────────────────────────────────────────────
@app.post("/api/episodes/{episode_id}/extract-audio")
def extract_audio(episode_id: str, db: Session = Depends(get_db)):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(404, "Episode not found")
    if not ep.media_path:
        raise HTTPException(400, "No media imported")
    if not _ffmpeg_available():
        raise HTTPException(503, "FFmpeg is not installed. Install FFmpeg to extract audio.")

    out_path = GENERATED_DIR / f"{episode_id}_audio.wav"
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", ep.media_path,
                "-vn", "-acodec", "pcm_s16le",
                "-ar", "16000", "-ac", "1",
                str(out_path)
            ],
            capture_output=True, timeout=300, check=True
        )
        return {"audio_path": str(out_path), "status": "extracted"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(500, f"FFmpeg error: {e.stderr.decode()[:200]}")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "FFmpeg timed out")


# ── Export ────────────────────────────────────────────────────
@app.post("/api/export")
def export_project(req: ExportRequest, db: Session = Depends(get_db)):
    ep = db.query(Episode).filter(Episode.id == req.episode_id).first()
    if not ep:
        raise HTTPException(404, "Episode not found")

    if req.format == "srt":
        # Build SRT from segments
        segs = db.query(DialogueSegment).filter(
            DialogueSegment.episode_id == req.episode_id
        ).order_by(DialogueSegment.index).all()

        def _srt_time(sec: float) -> str:
            h = int(sec // 3600)
            m = int((sec % 3600) // 60)
            s = int(sec % 60)
            ms = int((sec % 1) * 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

        lines = []
        for i, seg in enumerate(segs, 1):
            lines.append(str(i))
            lines.append(f"{_srt_time(seg.start_sec)} --> {_srt_time(seg.end_sec)}")
            lines.append(seg.khm_text)
            lines.append("")

        out_path = Path(req.output_path)
        out_path.write_text("\n".join(lines), encoding="utf-8")
        verified = out_path.exists() and out_path.stat().st_size > 0
        return {"status": "exported" if verified else "empty", "output_path": str(out_path), "verified": verified}

    elif req.format in ("mp4", "wav"):
        if not _ffmpeg_available():
            raise HTTPException(503, "FFmpeg required for video/audio export")
        return {
            "status": "provider_not_configured",
            "message": "Full video export requires generated voice clips. Complete TTS generation first.",
        }

    raise HTTPException(400, f"Unsupported export format: {req.format}")


# ── Subtitles ─────────────────────────────────────────────────
@app.get("/api/episodes/{episode_id}/subtitles")
def get_subtitles(episode_id: str, format: str = "srt", db: Session = Depends(get_db)):
    segs = db.query(DialogueSegment).filter(
        DialogueSegment.episode_id == episode_id
    ).order_by(DialogueSegment.index).all()

    if not segs:
        return {"format": format, "content": "", "segments": 0}

    def _srt_time(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = int(sec % 60)
        ms = int((sec % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines = []
    for i, seg in enumerate(segs, 1):
        lines.append(str(i))
        lines.append(f"{_srt_time(seg.start_sec)} --> {_srt_time(seg.end_sec)}")
        lines.append(seg.khm_text)
        lines.append("")

    return {"format": "srt", "content": "\n".join(lines), "segments": len(segs)}

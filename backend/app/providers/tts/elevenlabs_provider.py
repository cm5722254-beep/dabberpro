import json
from pathlib import Path
from typing import List, Optional, Dict, Any
import httpx

from app.providers.tts.base import (
    BaseTTSProvider,
    VoiceProfileInfo,
    TTSValidationResult,
    TTSResult,
)
from app.core.config import settings

ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

# Standard curated voices for dubbing
DEFAULT_ELEVENLABS_VOICES = [
    VoiceProfileInfo(
        id="JBFqnCBsd6RMkjVDRZzb",
        label="George (Multilingual Storyteller / Narrator)",
        provider="elevenlabs",
        gender="male",
        language="multilingual",
        description="Warm, versatile narrative voice using Eleven Multilingual v2",
    ),
    VoiceProfileInfo(
        id="21m00Tcm4TlvDq8ikWAM",
        label="Rachel (Calm & Professional)",
        provider="elevenlabs",
        gender="female",
        language="multilingual",
        description="Clear, soothing voice with natural inflection",
    ),
    VoiceProfileInfo(
        id="AZnzlk1XvdvUeBnXmlld",
        label="Domi (Strong & Dynamic)",
        provider="elevenlabs",
        gender="female",
        language="multilingual",
        description="Engaging female voice with strong cadence",
    ),
    VoiceProfileInfo(
        id="pNInz6obpgDQGcFmaJgB",
        label="Adam (Conversational Male)",
        provider="elevenlabs",
        gender="male",
        language="multilingual",
        description="Deep, natural conversational narrator voice",
    ),
]


class ElevenLabsProvider(BaseTTSProvider):
    provider_id = "elevenlabs"
    provider_name = "ElevenLabs AI Voice"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.elevenlabs_api_key

    def get_api_key(self) -> Optional[str]:
        return self.api_key or settings.elevenlabs_api_key

    def validate_credentials(self, api_key: Optional[str] = None) -> TTSValidationResult:
        key = api_key or self.get_api_key()
        if not key:
            return TTSValidationResult(
                valid=False,
                message="No ElevenLabs API key provided. Add key in Settings or .env",
            )

        headers = {"xi-api-key": key.strip()}

        # 1. Test user endpoint first
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(f"{ELEVENLABS_API_BASE}/user", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    sub = data.get("subscription", {})
                    return TTSValidationResult(
                        valid=True,
                        message="ElevenLabs API key is active with full permissions.",
                        account_info={
                            "tier": sub.get("tier"),
                            "character_count": sub.get("character_count"),
                            "character_limit": sub.get("character_limit"),
                        },
                    )

                # Check if it failed due to scoped permissions
                error_body = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                detail = error_body.get("detail", {})
                msg = detail.get("message", res.text) if isinstance(detail, dict) else str(detail)
                code = detail.get("code") if isinstance(detail, dict) else ""
                status = detail.get("status") if isinstance(detail, dict) else ""

                if "missing the permission" in msg or status == "missing_permissions":
                    # Key is valid on ElevenLabs, but restricted
                    # Let's test if text-to-speech permission works with a dry test
                    tts_test = client.post(
                        f"{ELEVENLABS_API_BASE}/text-to-speech/{settings.elevenlabs_default_voice_id}",
                        headers={**headers, "Content-Type": "application/json"},
                        json={"text": "Test", "model_id": settings.elevenlabs_model_id},
                    )
                    if tts_test.status_code == 200:
                        return TTSValidationResult(
                            valid=True,
                            message="ElevenLabs API key is valid and has Text-to-Speech permission enabled.",
                        )
                    else:
                        tts_err = tts_test.json() if tts_test.headers.get("content-type", "").startswith("application/json") else {}
                        tts_detail = tts_err.get("detail", {})
                        tts_msg = tts_detail.get("message", tts_test.text) if isinstance(tts_detail, dict) else str(tts_detail)
                        return TTSValidationResult(
                            valid=False,
                            message=f"ElevenLabs key authenticated, but lacks permissions: {tts_msg}",
                            requires_permission="text_to_speech",
                        )

                return TTSValidationResult(
                    valid=False,
                    message=f"ElevenLabs validation failed ({res.status_code}): {msg}",
                )

        except Exception as e:
            return TTSValidationResult(
                valid=False,
                message=f"Network or connection error connecting to ElevenLabs: {str(e)}",
            )

    def list_voices(self) -> List[VoiceProfileInfo]:
        key = self.get_api_key()
        if not key:
            return DEFAULT_ELEVENLABS_VOICES

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(
                    f"{ELEVENLABS_API_BASE}/voices",
                    headers={"xi-api-key": key.strip()},
                )
                if res.status_code == 200:
                    data = res.json()
                    voices = []
                    for v in data.get("voices", []):
                        voices.append(
                            VoiceProfileInfo(
                                id=v.get("voice_id"),
                                label=f"{v.get('name')} ({v.get('category', 'custom')})",
                                provider="elevenlabs",
                                gender=v.get("labels", {}).get("gender", "neutral"),
                                language="multilingual",
                                description=v.get("description") or f"ElevenLabs {v.get('category', '')} voice",
                            )
                        )
                    if voices:
                        return voices
        except Exception:
            pass

        return DEFAULT_ELEVENLABS_VOICES

    def generate_speech(
        self,
        text: str,
        voice_id: str,
        output_path: Path,
        speed: float = 1.0,
        pitch: float = 0.0,
        model_id: Optional[str] = None,
    ) -> TTSResult:
        key = self.get_api_key()
        if not key:
            return TTSResult(
                success=False,
                error="ElevenLabs API key is not configured. Please add it in Settings.",
            )

        if not text.strip():
            return TTSResult(success=False, error="Input text is empty.")

        target_model = model_id or settings.elevenlabs_model_id or "eleven_multilingual_v2"
        target_voice = voice_id if voice_id and voice_id != "default" else settings.elevenlabs_default_voice_id

        headers = {
            "xi-api-key": key.strip(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        payload: Dict[str, Any] = {
            "text": text,
            "model_id": target_model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        }

        url = f"{ELEVENLABS_API_BASE}/text-to-speech/{target_voice}?output_format=mp3_44100_128"

        try:
            with httpx.Client(timeout=60.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_bytes(res.content)

                    # Estimate duration based on size or audio length
                    # 128 kbps = 16,000 bytes/sec
                    size = len(res.content)
                    duration_sec = round(size / 16000.0, 2)

                    return TTSResult(
                        success=True,
                        audio_path=str(output_path),
                        duration_sec=duration_sec,
                        format="mp3",
                    )
                else:
                    error_msg = res.text
                    try:
                        err_json = res.json()
                        detail = err_json.get("detail", {})
                        if isinstance(detail, dict):
                            error_msg = detail.get("message", res.text)
                        elif isinstance(detail, str):
                            error_msg = detail
                    except Exception:
                        pass
                    return TTSResult(
                        success=False,
                        error=f"ElevenLabs error ({res.status_code}): {error_msg}",
                    )
        except Exception as e:
            return TTSResult(
                success=False,
                error=f"ElevenLabs request exception: {str(e)}",
            )

import base64
from pathlib import Path
from typing import List, Optional
import httpx

from app.providers.tts.base import (
    BaseTTSProvider,
    VoiceProfileInfo,
    TTSValidationResult,
    TTSResult,
)
from app.core.config import settings

GOOGLE_TTS_API_BASE = "https://texttospeech.googleapis.com/v1"

KHMER_VOICES = [
    VoiceProfileInfo(
        id="km-KH-Standard-A",
        label="Sreymom (Standard Female)",
        provider="google-tts",
        gender="female",
        language="km-KH",
        description="Clear, expressive native Khmer female voice",
    ),
    VoiceProfileInfo(
        id="km-KH-Standard-B",
        label="Piseth (Standard Male)",
        provider="google-tts",
        gender="male",
        language="km-KH",
        description="Resonant, natural native Khmer male voice",
    ),
    VoiceProfileInfo(
        id="km-KH-Wavenet-A",
        label="Bopha (Neural WaveNet Female)",
        provider="google-tts",
        gender="female",
        language="km-KH",
        description="Studio quality Neural WaveNet Khmer female voice",
    ),
    VoiceProfileInfo(
        id="km-KH-Wavenet-B",
        label="Dara (Neural WaveNet Male)",
        provider="google-tts",
        gender="male",
        language="km-KH",
        description="Studio quality Neural WaveNet Khmer male voice",
    ),
]


class GoogleTTSProvider(BaseTTSProvider):
    provider_id = "google-tts"
    provider_name = "Google Cloud TTS (Khmer Native)"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.google_tts_api_key

    def get_api_key(self) -> Optional[str]:
        return self.api_key or settings.google_tts_api_key

    def validate_credentials(self, api_key: Optional[str] = None) -> TTSValidationResult:
        key = api_key or self.get_api_key()
        if not key:
            return TTSValidationResult(
                valid=False,
                message="Google Cloud TTS API key not configured.",
            )

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(
                    f"{GOOGLE_TTS_API_BASE}/voices?key={key.strip()}&languageCode=km-KH"
                )
                if res.status_code == 200:
                    data = res.json()
                    voices = data.get("voices", [])
                    return TTSValidationResult(
                        valid=True,
                        message=f"Google Cloud TTS active with {len(voices)} Khmer voices available.",
                    )
                else:
                    return TTSValidationResult(
                        valid=False,
                        message=f"Google Cloud TTS key validation failed: {res.text}",
                    )
        except Exception as e:
            return TTSValidationResult(
                valid=False,
                message=f"Network error validating Google TTS: {str(e)}",
            )

    def list_voices(self) -> List[VoiceProfileInfo]:
        return KHMER_VOICES

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
                error="Google Cloud TTS API key not configured.",
            )

        if not text.strip():
            return TTSResult(success=False, error="Input text is empty.")

        target_voice = voice_id if voice_id and voice_id.startswith("km-KH") else "km-KH-Standard-A"

        payload = {
            "input": {"text": text},
            "voice": {
                "languageCode": "km-KH",
                "name": target_voice,
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "speakingRate": max(0.5, min(2.0, speed)),
                "pitch": max(-20.0, min(20.0, pitch)),
            },
        }

        try:
            with httpx.Client(timeout=60.0) as client:
                res = client.post(
                    f"{GOOGLE_TTS_API_BASE}/text:synthesize?key={key.strip()}",
                    json=payload,
                )
                if res.status_code == 200:
                    data = res.json()
                    audio_b64 = data.get("audioContent")
                    if not audio_b64:
                        return TTSResult(success=False, error="No audioContent returned by Google TTS")

                    audio_bytes = base64.b64decode(audio_b64)
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_bytes(audio_bytes)

                    duration_sec = round(len(audio_bytes) / 16000.0, 2)
                    return TTSResult(
                        success=True,
                        audio_path=str(output_path),
                        duration_sec=duration_sec,
                        format="mp3",
                    )
                else:
                    return TTSResult(
                        success=False,
                        error=f"Google TTS error ({res.status_code}): {res.text}",
                    )
        except Exception as e:
            return TTSResult(
                success=False,
                error=f"Google TTS request exception: {str(e)}",
            )

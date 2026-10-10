from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class VoiceProfileInfo(BaseModel):
    id: str
    label: str
    provider: str
    gender: str = "neutral"
    language: str = "km"
    description: Optional[str] = None

class TTSValidationResult(BaseModel):
    valid: bool
    message: str
    requires_permission: Optional[str] = None
    account_info: Optional[Dict[str, Any]] = None

class TTSResult(BaseModel):
    success: bool
    audio_path: Optional[str] = None
    audio_url: Optional[str] = None
    duration_sec: Optional[float] = None
    format: str = "mp3"
    error: Optional[str] = None

class BaseTTSProvider(ABC):
    provider_id: str
    provider_name: str

    @abstractmethod
    def validate_credentials(self, api_key: Optional[str] = None) -> TTSValidationResult:
        """Validate API credentials or local model readiness."""
        pass

    @abstractmethod
    def list_voices(self) -> List[VoiceProfileInfo]:
        """Return list of supported voices."""
        pass

    @abstractmethod
    def generate_speech(
        self,
        text: str,
        voice_id: str,
        output_path: Path,
        speed: float = 1.0,
        pitch: float = 0.0,
        model_id: Optional[str] = None,
    ) -> TTSResult:
        """Synthesize text into speech and save to output_path."""
        pass

from typing import Dict, List, Optional
from app.providers.tts.base import BaseTTSProvider, VoiceProfileInfo, TTSValidationResult, TTSResult
from app.providers.tts.elevenlabs_provider import ElevenLabsProvider
from app.providers.tts.google_tts import GoogleTTSProvider

PROVIDERS: Dict[str, BaseTTSProvider] = {
    "elevenlabs": ElevenLabsProvider(),
    "google-tts": GoogleTTSProvider(),
}

def get_tts_provider(provider_name: Optional[str] = None) -> BaseTTSProvider:
    if provider_name and provider_name.lower() in PROVIDERS:
        return PROVIDERS[provider_name.lower()]
    # Default to ElevenLabs if key configured, otherwise Google TTS
    el = PROVIDERS["elevenlabs"]
    if el.get_api_key():
        return el
    gt = PROVIDERS["google-tts"]
    if gt.get_api_key():
        return gt
    # Fallback to ElevenLabs default instance
    return el

def get_all_voices() -> List[VoiceProfileInfo]:
    voices: List[VoiceProfileInfo] = []
    for p in PROVIDERS.values():
        voices.extend(p.list_voices())
    return voices

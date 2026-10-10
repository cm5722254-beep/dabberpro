Put provider adapters here, for example:
- translation_api.py: cloud translation provider adapter
- local_translation.py: local model adapter
- tts_api.py: cloud TTS adapter
- local_tts.py: local Khmer TTS adapter
- media.py: FFmpeg probing, audio extraction, mixing and export

Keep API keys in environment variables or OS keychain, not in source code.

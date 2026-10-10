from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

GOOGLE_TRANSLATE_API = "https://translation.googleapis.com/language/translate/v2"

class GoogleTranslateProvider:
    provider_id = "google-translate"
    provider_name = "Google Cloud Translate"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.google_translate_api_key

    def get_api_key(self) -> Optional[str]:
        return self.api_key or settings.google_translate_api_key

    def translate_to_khmer(self, text: str, source_language: str = "auto") -> Dict[str, Any]:
        key = self.get_api_key()
        if not key:
            return {
                "success": False,
                "translated_text": None,
                "error": "Google Translate API key not configured. Add in Settings.",
            }

        params = {
            "key": key.strip(),
            "q": text,
            "target": "km",
            "format": "text",
        }
        if source_language and source_language != "auto":
            params["source"] = source_language

        try:
            with httpx.Client(timeout=20.0) as client:
                res = client.post(GOOGLE_TRANSLATE_API, params=params)
                if res.status_code == 200:
                    data = res.json()
                    translations = data.get("data", {}).get("translations", [])
                    if translations:
                        return {
                            "success": True,
                            "translated_text": translations[0].get("translatedText"),
                            "detected_source": translations[0].get("detectedSourceLanguage"),
                        }
                    return {"success": False, "translated_text": None, "error": "No translation data returned"}
                else:
                    return {"success": False, "translated_text": None, "error": f"API error ({res.status_code}): {res.text}"}
        except Exception as e:
            return {"success": False, "translated_text": None, "error": f"Connection error: {str(e)}"}

# ============================================================
# CHEATZ DABBER PRO — Backend Tests (Pytest)
# ============================================================
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

@pytest.fixture(autouse=True, scope="session")
def setup_database():
    init_db()

client = TestClient(app)


def test_health():
    """Backend health endpoint returns ok status."""
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "ffmpegAvailable" in data
    assert "dbConnected" in data


def test_providers_endpoint():
    """Providers list returns expected structure."""
    r = client.get("/api/providers")
    assert r.status_code == 200
    data = r.json()
    assert "providers" in data
    assert len(data["providers"]) > 0
    prov = data["providers"][0]
    assert "id" in prov
    assert "name" in prov
    assert "configured" in prov


def test_create_and_get_project():
    """Create a project and retrieve it."""
    r = client.post("/api/projects", json={"name": "Test Dub Project", "source_language": "en"})
    assert r.status_code == 201
    proj_id = r.json()["id"]

    r2 = client.get(f"/api/projects/{proj_id}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Test Dub Project"


def test_translate_requires_khmer():
    """Translation endpoint validates target language."""
    r = client.post("/api/translate", json={
        "text": "Hello world",
        "source_language": "en",
        "target_language": "fr"
    })
    assert r.status_code == 422  # Validation error


def test_translate_placeholder():
    """Translation returns honest provider_not_configured status."""
    r = client.post("/api/translate", json={
        "text": "Hello world",
        "source_language": "en",
        "target_language": "km"
    })
    assert r.status_code == 200
    assert r.json()["status"] == "provider_not_configured"
    assert r.json()["translated_text"] is None


def test_voice_placeholder():
    """TTS returns honest provider_not_configured status."""
    r = client.post("/api/voice", json={
        "text": "ភាសាខ្មែរ",
        "voice_id": "km-female-01",
        "provider": "hybrid"
    })
    assert r.status_code == 200
    assert r.json()["status"] == "provider_not_configured"
    assert r.json()["audio_url"] is None


def test_media_info_missing_file():
    """Media info with nonexistent file returns 400."""
    r = client.post("/api/media/info", json={"file_path": "/nonexistent/path/video.mp4"})
    assert r.status_code == 400


def test_jobs_list():
    """Jobs endpoint is reachable."""
    r = client.get("/api/jobs")
    assert r.status_code == 200
    assert "jobs" in r.json()


def test_list_projects():
    """Projects list is reachable."""
    r = client.get("/api/projects")
    assert r.status_code == 200
    assert "projects" in r.json()


def test_upload_wrong_type():
    """Upload rejects non-video files."""
    import io
    r = client.post(
        "/api/upload",
        files={"file": ("test.exe", io.BytesIO(b"binary data"), "application/octet-stream")}
    )
    assert r.status_code == 415


def test_khmer_unicode_in_translate():
    """Translate endpoint accepts Khmer Unicode input text."""
    r = client.post("/api/translate", json={
        "text": "ភាសាខ្មែរ",
        "source_language": "km",
        "target_language": "km"
    })
    # Should return placeholder, not error on Khmer input
    assert r.status_code == 200


def test_list_voices():
    """List voices endpoint returns available voices."""
    r = client.get("/api/voices")
    assert r.status_code == 200
    data = r.json()
    assert "voices" in data
    assert len(data["voices"]) > 0
    # Check that ElevenLabs George is present
    ids = [v["id"] for v in data["voices"]]
    assert "JBFqnCBsd6RMkjVDRZzb" in ids


def test_audio_endpoint_not_found():
    """Non-existent audio returns 404."""
    r = client.get("/api/audio/nonexistent_test.mp3")
    assert r.status_code == 404


def test_elevenlabs_provider_present():
    """Providers list includes ElevenLabs."""
    r = client.get("/api/providers")
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()["providers"]]
    assert "elevenlabs" in ids

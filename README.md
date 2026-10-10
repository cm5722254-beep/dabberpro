# CHEATZ DABBER PRO — Khmer AI Dubbing Studio

Starter desktop app: Electron + React + TypeScript UI, with a local Python FastAPI service.
This is a working foundation, not yet a production-ready AI dubbing engine.

## Requirements
- Node.js 20+
- Python 3.11+
- FFmpeg installed and available on PATH (for future media processing)

## Run on macOS
### 1) Install frontend dependencies
```bash
cd desktop
npm install
```

### 2) Set up backend
```bash
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3) Start backend (Terminal 1)
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765
```

### 4) Start desktop app (Terminal 2)
```bash
cd desktop
npm run dev
```

## Run on Windows
Use `py -3 -m venv .venv`, activate with `.venv\Scripts\activate`, then use the same `pip install` and `uvicorn` commands. Start the desktop app in another terminal with `npm install` and `npm run dev`.

## Current features
- Desktop shell and dark studio UI
- Import a local video file into the project view
- Local backend health check
- Dialogue editor starter table
- API/local AI provider settings scaffold

## Not implemented yet
- Real speech recognition / translation / Khmer TTS provider integration
- Full waveform timeline and multi-track editing
- Final MP4 export pipeline
- API key management UI and secure OS keychain storage

Never hard-code API keys in source code. Use environment variables or OS keychain storage.

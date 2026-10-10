// ============================================================
// Dubbing Studio — Main View
// Center: Video Preview + Dialogue Editor + Timeline
// ============================================================
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { VideoPlayer } from './VideoPlayer';
import { DialogueEditor } from '../transcript/DialogueEditor';
import { Timeline } from '../timeline/Timeline';

export function DubbingStudio() {
  const { aiMode, setAiMode, sourceLanguage, setSourceLanguage, setStatusMessage } = useAppStore((s) => ({
    aiMode: s.aiMode,
    setAiMode: s.setAiMode,
    sourceLanguage: s.sourceLanguage,
    setSourceLanguage: s.setSourceLanguage,
    setStatusMessage: s.setStatusMessage,
  }));

  const [mediaPath, setMediaPath] = useState<string | null>(null);

  function handleStartDubbing() {
    setStatusMessage(
      'Dubbing workflow queued: transcription → translation → Khmer TTS. Configure AI providers in Settings to run real processing.'
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">AI Production Workspace</div>
          <h1>Dubbing Studio <span className="sparkle">✦</span></h1>
          <div className="page-subtitle">Translate, voice, and synchronize your stories into Khmer</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn primary"
            onClick={handleStartDubbing}
            id="start-dubbing-btn"
          >
            <Sparkles size={14} /> Start Dubbing
          </button>
        </div>
      </div>

      {/* Settings Row */}
      <div className="settings-row">
        <div className="field">
          <label>Source Language</label>
          <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value as never)}>
            <option value="auto">Auto Detect</option>
            <option value="en">English</option>
            <option value="zh">Chinese (普通话)</option>
            <option value="ja">Japanese (日本語)</option>
            <option value="ko">Korean (한국어)</option>
            <option value="th">Thai (ภาษาไทย)</option>
            <option value="vi">Vietnamese (Tiếng Việt)</option>
          </select>
        </div>

        <span className="lang-arrow">→</span>

        <div className="field">
          <label>Target Language</label>
          <select defaultValue="km" disabled>
            <option value="km">ភាសាខ្មែរ (Khmer)</option>
          </select>
        </div>

        <div className="field">
          <label>AI Mode</label>
          <select value={aiMode} onChange={(e) => setAiMode(e.target.value as never)}>
            <option value="hybrid">Hybrid — best available</option>
            <option value="api-first">API First — cloud priority</option>
            <option value="local-first">Local First — private</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
          <label style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Quick Actions</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn sm ghost" onClick={() => setStatusMessage('Transcription requires a configured speech recognition provider.')}>Transcribe</button>
            <button className="btn sm ghost" onClick={() => setStatusMessage('Translation requires a configured translation provider with Khmer support.')}>Translate</button>
            <button className="btn sm primary" onClick={handleStartDubbing}><Sparkles size={12} /> Full Dub</button>
          </div>
        </div>
      </div>

      {/* Content Grid: Video Preview + Dialogue Editor */}
      <div className="content-grid" style={{ flex: 1, minHeight: 0 }}>
        <VideoPlayer mediaPath={mediaPath} onMediaImport={setMediaPath} />
        <DialogueEditor />
      </div>

      {/* Timeline */}
      <Timeline mediaPath={mediaPath} />
    </div>
  );
}

// ============================================================
// Status Bar
// ============================================================
import { Check } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export function StatusBar() {
  const { statusMessage, aiMode, health } = useAppStore((s) => ({
    statusMessage: s.statusMessage,
    aiMode: s.aiMode,
    health: s.health,
  }));

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <Check size={11} />
        <span>{statusMessage}</span>
      </div>
      <div className="statusbar-right">
        <span className={`dot ${health?.status === 'ok' ? 'green' : 'red'}`} />
        <span>{aiMode} mode</span>
        <span className="statusbar-sep">·</span>
        <span style={{ color: 'var(--text-dim)' }}>
          {health?.ffmpegAvailable ? 'FFmpeg ready' : 'FFmpeg not installed'}
        </span>
        <span className="statusbar-sep">·</span>
        <span style={{ color: 'var(--text-dim)' }}>v1.0.0-alpha</span>
      </div>
    </footer>
  );
}

// ============================================================
// Video Player Panel
// ============================================================
import { useRef, useState } from 'react';
import {
  FileVideo, FolderOpen, Play, Pause, Volume2, VolumeX,
  Maximize2, SkipBack, SkipForward
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { formatTime } from '../../hooks';

interface VideoPlayerProps {
  mediaPath: string | null;
  onMediaImport: (path: string) => void;
}

export function VideoPlayer({ mediaPath, onMediaImport }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [quality] = useState('Auto');

  const { isPlaying, setIsPlaying, currentTimeSec, setCurrentTimeSec, setStatusMessage } = useAppStore((s) => ({
    isPlaying: s.isPlaying,
    setIsPlaying: s.setIsPlaying,
    currentTimeSec: s.currentTimeSec,
    setCurrentTimeSec: s.setCurrentTimeSec,
    setStatusMessage: s.setStatusMessage,
  }));

  async function importVideo() {
    try {
      const path = await window.dabber?.openVideo();
      if (path) {
        onMediaImport(path);
        setStatusMessage(`Imported: ${path.split(/[\\/]/).pop()}`);
      }
    } catch {
      setStatusMessage('File dialog unavailable in browser mode. Run as Electron app to import files.');
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (v) setCurrentTimeSec(v.currentTime);
  }

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  }

  function skip(sec: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + sec));
  }

  function fullscreen() {
    videoRef.current?.requestFullscreen?.();
  }

  const progress = duration > 0 ? (currentTimeSec / duration) * 100 : 0;

  return (
    <section className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-head">
        <span className="panel-head-title">
          <FileVideo size={13} /> Video Preview
        </span>
        <div className="panel-actions">
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{quality}</span>
          <button className="btn ghost icon sm" onClick={importVideo} title="Import video">
            <FolderOpen size={13} />
          </button>
        </div>
      </div>

      {/* Video Canvas */}
      <div className="video-canvas">
        {mediaPath ? (
          <video
            ref={videoRef}
            src={mediaPath}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div className="empty-state">
            <div className="play-ring" onClick={importVideo} style={{ cursor: 'pointer' }}>
              <Play size={22} fill="currentColor" />
            </div>
            <h3>Your story starts here</h3>
            <p>Import a video to begin dubbing into Khmer</p>
            <button className="btn primary" onClick={importVideo}>
              <FolderOpen size={14} /> Choose Video
            </button>
          </div>
        )}
      </div>

      {/* Player Controls */}
      <div className="player-controls">
        <button className="btn ghost icon" onClick={() => skip(-5)} title="Back 5s" disabled={!mediaPath}>
          <SkipBack size={13} />
        </button>

        <button
          className="play-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          disabled={!mediaPath}
          id="video-play-btn"
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>

        <button className="btn ghost icon" onClick={() => skip(5)} title="Forward 5s" disabled={!mediaPath}>
          <SkipForward size={13} />
        </button>

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="progress-bar"
          onClick={seek}
          style={{ cursor: mediaPath ? 'pointer' : 'default' }}
        >
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <span className="player-time">
          {formatTime(currentTimeSec)} / {formatTime(duration)}
        </span>

        <button
          className="btn ghost icon volume-icon"
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (videoRef.current) videoRef.current.volume = v;
            setMuted(v === 0);
          }}
          style={{ width: 50, accentColor: 'var(--cyan-glow)', cursor: 'pointer' }}
          title={`Volume: ${Math.round(volume * 100)}%`}
        />

        <button className="btn ghost icon" onClick={fullscreen} title="Fullscreen" disabled={!mediaPath}>
          <Maximize2 size={13} />
        </button>
      </div>

      <div className="panel-foot">
        <span className="dot green" />
        Local media workspace
        <span className="text-dim" style={{ marginLeft: 4 }}>· Video stays on your computer</span>
      </div>
    </section>
  );
}

// ============================================================
// Multitrack Timeline
// ============================================================
import { useRef } from 'react';
import {
  Waves, FileVideo, AudioLines, Captions, Music, Volume2, VolumeX,
  ZoomIn, ZoomOut, Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { formatTime } from '../../hooks';
import type { TrackType } from '../../types';

interface TimelineProps {
  mediaPath: string | null;
}

interface TrackDef {
  type: TrackType;
  label: string;
  icon: JSX.Element;
  color: string;
}

const TRACK_DEFS: TrackDef[] = [
  { type: 'video',         label: 'VIDEO',        icon: <FileVideo size={12} />,   color: 'video' },
  { type: 'original-audio',label: 'ORIG. AUDIO',  icon: <Volume2 size={12} />,     color: 'audio' },
  { type: 'dubbed-audio',  label: 'KHMER VOICE',  icon: <AudioLines size={12} />,  color: 'dubbed' },
  { type: 'subtitles',     label: 'SUBTITLES',    icon: <Captions size={12} />,    color: 'subtitle' },
  { type: 'bg-music',      label: 'BG MUSIC',     icon: <Music size={12} />,       color: 'audio' },
];

const RULER_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

export function Timeline({ mediaPath }: TimelineProps) {
  const { segments, timelineZoom, setTimelineZoom, currentTimeSec, setStatusMessage } = useAppStore((s) => ({
    segments: s.segments,
    timelineZoom: s.timelineZoom,
    setTimelineZoom: s.setTimelineZoom,
    currentTimeSec: s.currentTimeSec,
    setStatusMessage: s.setStatusMessage,
  }));

  const contentRef = useRef<HTMLDivElement>(null);

  const totalSec = Math.max(60, ...segments.map((s) => s.endSec + 2));
  const pxPerSec = 12 * timelineZoom;

  function zoomIn() { setTimelineZoom(Math.min(8, timelineZoom * 1.5)); }
  function zoomOut() { setTimelineZoom(Math.max(0.25, timelineZoom / 1.5)); }

  const [mutedTracks, setMutedTracks] = React.useState<Set<TrackType>>(new Set());
  function toggleMute(type: TrackType) {
    setMutedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="timeline-panel">
      {/* Timeline Header */}
      <div className="timeline-head">
        <div className="timeline-head-left">
          <Waves size={13} />
          Timeline Editor
          {mediaPath && <span className="status-badge done" style={{ marginLeft: 8 }}>MEDIA LOADED</span>}
        </div>
        <div className="timeline-head-right">
          <div className="timeline-zoom">
            <button onClick={zoomOut} title="Zoom out"><ZoomOut size={11} /></button>
            <span>{Math.round(timelineZoom * 100)}%</span>
            <button onClick={zoomIn} title="Zoom in"><ZoomIn size={11} /></button>
          </div>
          <button
            className="btn ghost sm"
            onClick={() => setStatusMessage('Auto-sync requires generated voice clips with real timestamps.')}
          >
            <AudioLines size={12} /> Auto Sync
          </button>
          <button
            className="btn primary sm"
            onClick={() => setStatusMessage('Generate Voice requires a configured Khmer TTS provider. See Settings.')}
          >
            <Sparkles size={12} /> Generate Voice
          </button>
        </div>
      </div>

      {/* Timeline body */}
      <div className="timeline-body" ref={contentRef}>
        {/* Ruler */}
        <div style={{ display: 'flex', paddingLeft: 110 }}>
          <div className="timeline-ruler" style={{ width: totalSec * pxPerSec, minWidth: '100%' }}>
            {RULER_TICKS.filter((t) => t <= totalSec).map((t) => (
              <div
                key={t}
                className="ruler-tick"
                style={{ width: 5 * pxPerSec, flexShrink: 0 }}
              >
                {formatTime(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Tracks */}
        {TRACK_DEFS.map((def) => (
          <div key={def.type} className="track">
            <div className="track-label">
              {def.icon}
              <span style={{ flex: 1 }}>{def.label}</span>
              <div className="track-controls">
                <button
                  className={`track-mute-btn ${mutedTracks.has(def.type) ? 'active' : ''}`}
                  onClick={() => toggleMute(def.type)}
                  title={mutedTracks.has(def.type) ? 'Unmute' : 'Mute'}
                >
                  {mutedTracks.has(def.type) ? <VolumeX size={9} /> : 'M'}
                </button>
              </div>
            </div>

            {/* Track content */}
            <div
              className="track-content"
              style={{ width: totalSec * pxPerSec, minWidth: '100%', position: 'relative' }}
            >
              {/* Render clips based on track type */}
              {def.type === 'video' && mediaPath && (
                <div
                  className={`track-clip ${def.color}`}
                  style={{ left: 0, width: `${Math.min(95, (totalSec * pxPerSec - 8))}px` }}
                >
                  {mediaPath.split(/[\\/]/).pop()}
                </div>
              )}

              {def.type === 'dubbed-audio' && segments.map((seg) => (
                <div
                  key={seg.id}
                  className={`track-clip ${def.color}`}
                  style={{
                    left: seg.startSec * pxPerSec,
                    width: Math.max(20, (seg.endSec - seg.startSec) * pxPerSec - 2),
                  }}
                  title={`${seg.speakerName}: ${seg.khmText.slice(0, 40)}`}
                >
                  {seg.index + 1} · {seg.speakerName}
                </div>
              ))}

              {def.type === 'subtitles' && segments.map((seg) => (
                <div
                  key={seg.id}
                  className={`track-clip ${def.color}`}
                  style={{
                    left: seg.startSec * pxPerSec,
                    width: Math.max(20, (seg.endSec - seg.startSec) * pxPerSec - 2),
                  }}
                  title={seg.khmText}
                >
                  {seg.khmText.slice(0, 12)}…
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Playhead */}
        <div
          className="playhead"
          style={{ left: 110 + currentTimeSec * pxPerSec }}
        >
          <div className="playhead-handle" />
        </div>
      </div>
    </div>
  );
}

// Need React import for useState inside
import React from 'react';

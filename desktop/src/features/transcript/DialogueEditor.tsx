// ============================================================
// Dialogue & Translation Editor
// Full-featured transcript table with live ElevenLabs TTS & Audio Preview
// ============================================================
import { useState, useMemo, useRef } from 'react';
import {
  Languages, Plus, Trash2, Lock, Unlock, Play, Pause,
  RotateCcw, Search, Filter, Mic2, CheckSquare, Square,
  Sparkles, Loader2, Volume2
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { formatTime } from '../../hooks';
import type { DialogueSegment } from '../../types';

export function DialogueEditor() {
  const { segments, updateSegment, addSegment, removeSegment, voiceProfiles, setStatusMessage, project } = useAppStore((s) => ({
    segments: s.segments,
    updateSegment: s.updateSegment,
    addSegment: s.addSegment,
    removeSegment: s.removeSegment,
    voiceProfiles: s.voiceProfiles,
    setStatusMessage: s.setStatusMessage,
    project: s.project,
  }));

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [filterSpeaker, setFilterSpeaker] = useState('all');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakers = useMemo(() => {
    const names = new Set(segments.map((s) => s.speakerName));
    return ['all', ...Array.from(names)];
  }, [segments]);

  const filtered = useMemo(() => {
    return segments.filter((seg) => {
      const matchesSearch =
        !searchText ||
        seg.khmText.includes(searchText) ||
        seg.originalText.toLowerCase().includes(searchText.toLowerCase());
      const matchesSpeaker = filterSpeaker === 'all' || seg.speakerName === filterSpeaker;
      return matchesSearch && matchesSpeaker;
    });
  }, [segments, searchText, filterSpeaker]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  }

  function addNewLine() {
    const lastSeg = segments[segments.length - 1];
    const startSec = lastSeg ? lastSeg.endSec + 0.5 : 0;
    const newSeg: DialogueSegment = {
      id: crypto.randomUUID(),
      episodeId: project?.activeEpisodeId || 'demo',
      index: segments.length,
      startSec,
      endSec: startSec + 3,
      originalText: '',
      khmText: 'បញ្ចូលប្រយោគខ្មែរនៅទីនេះ…',
      speakerName: 'Narrator',
      voiceProfileId: 'JBFqnCBsd6RMkjVDRZzb',
      emotion: null,
      translationStatus: 'none',
      audioStatus: 'none',
      audioPath: null,
      audioDurationSec: null,
      locked: false,
      confidence: null,
    };
    addSegment(newSeg);
    setStatusMessage('New dialogue segment added');
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    selected.forEach((id) => removeSegment(id));
    setSelected(new Set());
    setStatusMessage(`Deleted ${selected.size} segment(s)`);
  }

  async function generateVoice(seg: DialogueSegment) {
    const textToSpeak = seg.khmText || seg.originalText;
    if (!textToSpeak.trim()) {
      setStatusMessage('Dialogue text is empty. Enter text before generating voice.');
      return;
    }

    updateSegment(seg.id, { audioStatus: 'generating' });
    setStatusMessage(`Generating voice for Segment #${seg.index + 1}…`);

    try {
      const res = await fetch('http://127.0.0.1:8765/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice_id: seg.voiceProfileId || 'JBFqnCBsd6RMkjVDRZzb',
          provider: 'hybrid',
          speed: 1.0,
        }),
      });

      const data = await res.json();
      if (data.status === 'done' && data.audio_path) {
        updateSegment(seg.id, {
          audioStatus: 'done',
          audioPath: data.audio_path,
          audioDurationSec: data.duration_sec,
        });
        setStatusMessage(`Voice generated for Segment #${seg.index + 1}! (${data.duration_sec}s)`);
        playAudio(data.audio_path, seg.id);
      } else {
        updateSegment(seg.id, { audioStatus: 'failed' });
        setStatusMessage(`Voice generation failed: ${data.message || data.error || 'Provider unconfigured'}`);
      }
    } catch (err) {
      updateSegment(seg.id, { audioStatus: 'failed' });
      setStatusMessage('Backend offline — start Python backend server.');
    }
  }

  function playAudio(path: string, segId: string) {
    if (playingSegmentId === segId && audioRef.current) {
      audioRef.current.pause();
      setPlayingSegmentId(null);
      return;
    }

    const filename = path.split(/[\\/]/).pop();
    const url = `http://127.0.0.1:8765/api/audio/${filename}`;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingSegmentId(segId);

    audio.onended = () => setPlayingSegmentId(null);
    audio.onerror = () => {
      setStatusMessage('Could not stream generated audio file.');
      setPlayingSegmentId(null);
    };
    audio.play().catch(() => setPlayingSegmentId(null));
  }

  function previewVoice(seg: DialogueSegment) {
    if (seg.audioPath) {
      playAudio(seg.audioPath, seg.id);
    } else {
      generateVoice(seg);
    }
  }

  async function handleBatchGenerate() {
    setIsBatchGenerating(true);
    setStatusMessage('Starting batch voice generation for dialogue segments…');
    const epId = project?.activeEpisodeId || 'demo';

    try {
      const res = await fetch(`http://127.0.0.1:8765/api/episodes/${epId}/generate-voices`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.status === 'done') {
        setStatusMessage(`Batch TTS complete! Generated ${data.generated}/${data.total} clips.`);
      } else {
        setStatusMessage(`Batch generation note: ${data.message || data.status}`);
      }
    } catch {
      setStatusMessage('Backend offline — verify backend is running on port 8765.');
    } finally {
      setIsBatchGenerating(false);
    }
  }

  async function handleBatchTranslate() {
    setIsTranslating(true);
    setStatusMessage('Translating dialogues to Khmer…');
    const epId = project?.activeEpisodeId || 'demo';

    try {
      const res = await fetch(`http://127.0.0.1:8765/api/episodes/${epId}/translate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.status === 'done') {
        setStatusMessage(`Translation complete! Translated ${data.translated}/${data.total} segments.`);
      } else {
        setStatusMessage(`Translation note: ${data.message || data.status}`);
      }
    } catch {
      setStatusMessage('Backend offline — verify backend is running on port 8765.');
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <section className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Panel header */}
      <div className="panel-head">
        <span className="panel-head-title">
          <Languages size={13} /> Dialogue & Translation Editor
        </span>
        <div className="panel-actions">
          <button
            className="btn ghost sm"
            onClick={deleteSelected}
            disabled={selected.size === 0}
            title="Delete selected segments"
          >
            <Trash2 size={12} /> Delete
          </button>
          <button
            className="btn ghost sm"
            onClick={handleBatchTranslate}
            disabled={isTranslating}
            title="Translate dialogue to Khmer"
          >
            {isTranslating ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
            Translate to Khmer
          </button>
          <button
            className="btn primary sm"
            onClick={handleBatchGenerate}
            disabled={isBatchGenerating}
            title="Generate AI Voice for all dialogue segments"
          >
            {isBatchGenerating ? <Loader2 size={12} className="spin" /> : <Mic2 size={12} />}
            Generate All Voices
          </button>
          <button className="btn ghost sm" onClick={addNewLine} title="Add dialogue line" id="add-dialogue-btn">
            <Plus size={12} /> Add Line
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dialogue-toolbar">
        <span className="dialogue-count">{filtered.length} / {segments.length} segments</span>
        <div className="dialogue-spacer" />

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={11} style={{ position: 'absolute', left: 8, color: 'var(--text-dim)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 26 }}
            placeholder="Search dialogue…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Speaker filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Filter size={11} style={{ color: 'var(--text-dim)' }} />
          <select
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-mid)',
              borderRadius: 6,
              color: 'var(--text-mid)',
              fontSize: 10,
              padding: '4px 6px',
              outline: 'none',
            }}
            value={filterSpeaker}
            onChange={(e) => setFilterSpeaker(e.target.value)}
          >
            {speakers.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All speakers' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table header */}
      <div className="table-head">
        <button
          onClick={selectAll}
          style={{ background: 'transparent', border: 'none', display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}
        >
          {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={13} /> : <Square size={13} />}
        </button>
        <span>TIME</span>
        <span>KHMER TRANSLATION</span>
        <span>VOICE PROFILE</span>
        <span title="Preview Voice">PREVIEW</span>
        <span title="Actions">ACTIONS</span>
      </div>

      {/* Dialogue list */}
      <div className="dialogue-list">
        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 11 }}>
            No segments match your filter.
          </div>
        )}
        {filtered.map((seg) => (
          <SegmentRow
            key={seg.id}
            seg={seg}
            isSelected={selected.has(seg.id)}
            isPlaying={playingSegmentId === seg.id}
            onToggleSelect={() => toggleSelect(seg.id)}
            onUpdate={(patch) => updateSegment(seg.id, patch)}
            onDelete={() => removeSegment(seg.id)}
            onGenerateVoice={() => generateVoice(seg)}
            onPreviewVoice={() => previewVoice(seg)}
            voiceProfiles={voiceProfiles.map((v) => ({ id: v.id, label: v.label }))}
          />
        ))}
      </div>

      <div className="panel-foot">
        <span className="dot green" />
        Live synchronization ready
        <span className="text-dim" style={{ marginLeft: 4 }}>· Auto-saved to project session</span>
        {selected.size > 0 && <span className="status-badge pending" style={{ marginLeft: 'auto' }}>{selected.size} selected</span>}
      </div>
    </section>
  );
}

// ─── Individual Segment Row ──────────────────────────────────
interface SegmentRowProps {
  seg: DialogueSegment;
  isSelected: boolean;
  isPlaying: boolean;
  onToggleSelect: () => void;
  onUpdate: (patch: Partial<DialogueSegment>) => void;
  onDelete: () => void;
  onGenerateVoice: () => void;
  onPreviewVoice: () => void;
  voiceProfiles: Array<{ id: string; label: string }>;
}

function SegmentRow({
  seg, isSelected, isPlaying, onToggleSelect, onUpdate, onDelete, onGenerateVoice, onPreviewVoice, voiceProfiles
}: SegmentRowProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className={`dialogue-row ${isSelected ? 'selected' : ''} ${seg.locked ? 'locked' : ''}`} id={`seg-${seg.id}`}>
      {/* Checkbox */}
      <input type="checkbox" checked={isSelected} onChange={onToggleSelect} disabled={seg.locked} />

      {/* Time */}
      <div className="time-cell">
        <span className="ts">{formatTime(seg.startSec)}</span>
        <span className="ts-end">{formatTime(seg.endSec)}</span>
        {seg.confidence !== null && (
          <span style={{ fontSize: 8, color: seg.confidence > 0.9 ? 'var(--green-glow)' : 'var(--amber-glow)', marginTop: 2 }}>
            {Math.round(seg.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Khmer text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <textarea
          className="khmer-textarea"
          value={seg.khmText}
          onChange={(e) => onUpdate({ khmText: e.target.value, translationStatus: 'done' })}
          disabled={seg.locked}
          aria-label="Khmer dialogue text"
          rows={2}
          style={{ minHeight: 44 }}
        />
        {/* Original text toggle */}
        <button
          onClick={() => setShowOriginal((v) => !v)}
          style={{ fontSize: 9, color: 'var(--text-dim)', background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer' }}
        >
          {showOriginal ? '▲ Hide original' : '▼ Show original'}
        </button>
        {showOriginal && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 6px', background: 'var(--bg-input)', borderRadius: 4, lineHeight: 1.6 }}>
            {seg.originalText || <em>No original text</em>}
          </div>
        )}
        {/* Speaker */}
        <input
          value={seg.speakerName}
          onChange={(e) => onUpdate({ speakerName: e.target.value })}
          placeholder="Speaker name"
          style={{ fontSize: 9, background: 'transparent', border: 'none', color: 'var(--cyan-mid)', padding: 0, outline: 'none', width: '100%' }}
        />
        {/* Status badges */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span className={`status-badge ${seg.translationStatus}`}>{seg.translationStatus}</span>
          <span className={`status-badge ${seg.audioStatus}`}>
            {seg.audioStatus === 'generating' && <Loader2 size={8} className="spin" style={{ marginRight: 3 }} />}
            {seg.audioStatus}
          </span>
          {seg.audioDurationSec && (
            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
              ({seg.audioDurationSec}s)
            </span>
          )}
        </div>
      </div>

      {/* Voice profile */}
      <select
        className="voice-select"
        value={seg.voiceProfileId ?? 'JBFqnCBsd6RMkjVDRZzb'}
        onChange={(e) => onUpdate({ voiceProfileId: e.target.value })}
        disabled={seg.locked}
      >
        <option value="JBFqnCBsd6RMkjVDRZzb">ElevenLabs: George (Multilingual)</option>
        <option value="21m00Tcm4TlvDq8ikWAM">ElevenLabs: Rachel (Calm)</option>
        <option value="km-KH-Standard-A">Google Khmer: Sreymom (Female)</option>
        <option value="km-KH-Standard-B">Google Khmer: Piseth (Male)</option>
        {voiceProfiles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>

      {/* Preview Voice */}
      <button
        className="row-action"
        title={isPlaying ? 'Pause audio' : 'Play generated audio / synthesize preview'}
        onClick={onPreviewVoice}
        id={`preview-voice-${seg.id}`}
        style={{
          background: isPlaying ? 'rgba(6, 182, 212, 0.2)' : undefined,
          color: isPlaying ? 'var(--cyan-glow)' : undefined,
        }}
      >
        {isPlaying ? <Pause size={12} /> : seg.audioPath ? <Volume2 size={12} /> : <Play size={10} />}
      </button>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          className="row-action"
          title={seg.locked ? 'Unlock' : 'Lock'}
          onClick={() => onUpdate({ locked: !seg.locked })}
        >
          {seg.locked ? <Unlock size={10} /> : <Lock size={10} />}
        </button>
        <button
          className="row-action"
          title="Generate voice"
          onClick={onGenerateVoice}
          disabled={seg.audioStatus === 'generating'}
        >
          {seg.audioStatus === 'generating' ? <Loader2 size={10} className="spin" /> : <Mic2 size={10} />}
        </button>
        <button
          className="row-action"
          title="Regenerate translation"
          onClick={() => onUpdate({ translationStatus: 'pending' })}
        >
          <RotateCcw size={10} />
        </button>
        <button
          className="row-action"
          title="Delete segment"
          onClick={onDelete}
          style={{ color: 'var(--red-glow)' }}
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

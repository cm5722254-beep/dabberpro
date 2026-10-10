// ============================================================
// Voice Profiles Management
// ElevenLabs & Khmer Native Voice Configuration
// ============================================================
import { useState } from 'react';
import { Mic2, Play, Pause, Sliders, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface VoiceItem {
  id: string;
  label: string;
  provider: 'elevenlabs' | 'google-tts';
  gender: string;
  language: string;
  description: string;
  sampleText: string;
}

const CURATED_VOICES: VoiceItem[] = [
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    label: 'George (Narrator / Storyteller)',
    provider: 'elevenlabs',
    gender: 'male',
    language: 'Eleven Multilingual v2',
    description: 'Deep, engaging narrative delivery. Ideal for documentary, fantasy, and cinematic dubbing.',
    sampleText: 'The first move is what sets everything in motion.',
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    label: 'Rachel (Calm & Clear)',
    provider: 'elevenlabs',
    gender: 'female',
    language: 'Eleven Multilingual v2',
    description: 'Clean, professional tone. Excellent for educational, narrative, and character dialogue.',
    sampleText: 'Everything you need to create amazing dubbed content is right here.',
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    label: 'Domi (Confident & Vibrant)',
    provider: 'elevenlabs',
    gender: 'female',
    language: 'Eleven Multilingual v2',
    description: 'Dynamic character voice with expressive emotional range.',
    sampleText: 'Listen closely, because this journey is only just beginning.',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    label: 'Adam (Natural Conversational)',
    provider: 'elevenlabs',
    gender: 'male',
    language: 'Eleven Multilingual v2',
    description: 'Warm, conversational baritone suitable for characters and dialogue scenes.',
    sampleText: 'Welcome to CHEATZ DABBER PRO. Let us bring your stories to life.',
  },
  {
    id: 'km-KH-Standard-A',
    label: 'Sreymom (Native Khmer Female)',
    provider: 'google-tts',
    gender: 'female',
    language: 'Khmer (km-KH)',
    description: 'Clear, natural native Khmer pronunciation with standard phrasing.',
    sampleText: 'សូមស្វាគមន៍មកកាន់ស្ទូឌីយោបញ្ចូលសំឡេង AI ភាសាខ្មែរ។',
  },
  {
    id: 'km-KH-Standard-B',
    label: 'Piseth (Native Khmer Male)',
    provider: 'google-tts',
    gender: 'male',
    language: 'Khmer (km-KH)',
    description: 'Deep, resonant native Khmer voice. Great for male character dubbing.',
    sampleText: 'ការបកប្រែនិងបញ្ចូលសំឡេងវីដេអូដោយស្វ័យប្រវត្តិ។',
  },
];

export function VoiceProfilesView() {
  const { setStatusMessage, segments, updateSegment } = useAppStore((s) => ({
    setStatusMessage: s.setStatusMessage,
    segments: s.segments,
    updateSegment: s.updateSegment,
  }));

  const [activeVoiceId, setActiveVoiceId] = useState<string>('JBFqnCBsd6RMkjVDRZzb');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0.0);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  async function handleTestSample(voice: VoiceItem) {
    setIsSynthesizing(true);
    setPlayingId(voice.id);
    setStatusMessage(`Testing voice synthesis for ${voice.label}…`);

    try {
      const res = await fetch('http://127.0.0.1:8765/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voice_id: voice.id,
          provider: voice.provider,
          speed: speed,
          pitch: pitch,
        }),
      });

      const data = await res.json();
      if (data.status === 'done' && data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => {
          setStatusMessage('Could not stream audio file.');
          setPlayingId(null);
        };
        await audio.play();
        setStatusMessage(`Playing preview for ${voice.label}`);
      } else {
        setPlayingId(null);
        setStatusMessage(`TTS Note: ${data.message || data.error || 'Provider not configured'}`);
      }
    } catch {
      setPlayingId(null);
      setStatusMessage('Backend offline — please verify local server is running on port 8765.');
    } finally {
      setIsSynthesizing(false);
    }
  }

  function handleAssignToAll(voiceId: string) {
    segments.forEach((seg) => {
      updateSegment(seg.id, { voiceProfileId: voiceId });
    });
    setStatusMessage(`Assigned voice profile to all ${segments.length} dialogue segments.`);
  }

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }} className="animate-fade-in">
      <div className="page-header" style={{ padding: 0, paddingBottom: 20 }}>
        <div className="page-header-left">
          <div className="page-eyebrow">Voice Profiles & ElevenLabs Engine</div>
          <h1>
            Voice Profiles <Mic2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
          </h1>
          <div className="page-subtitle">Assign ElevenLabs multilingual voices and Khmer native TTS profiles to speakers</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Voices list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Available Voice Profiles
          </div>

          {CURATED_VOICES.map((v) => {
            const isSelected = activeVoiceId === v.id;
            const isPlaying = playingId === v.id;

            return (
              <div
                key={v.id}
                className="panel"
                style={{
                  padding: 16,
                  borderColor: isSelected ? 'var(--cyan-glow)' : 'var(--border-mid)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.04)' : undefined,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
                onClick={() => setActiveVoiceId(v.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-bright)' }}>{v.label}</strong>
                      <span className="status-badge" style={{ background: v.provider === 'elevenlabs' ? '#2e1065' : '#042f2e', color: v.provider === 'elevenlabs' ? '#c084fc' : '#5eead4' }}>
                        {v.provider === 'elevenlabs' ? 'ElevenLabs' : 'Google Cloud'}
                      </span>
                      <span className="status-badge none">{v.gender}</span>
                    </div>
                    <p className="hint" style={{ fontSize: 11, marginBottom: 6 }}>{v.description}</p>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      Model: <strong>{v.language}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <button
                      className="btn ghost sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSample(v);
                      }}
                      title="Preview Voice Sample"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isPlaying ? <Pause size={12} /> : isSynthesizing && isSelected ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                      Sample
                    </button>
                    <button
                      className="btn primary sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignToAll(v.id);
                      }}
                      title="Assign to all dialogue segments"
                    >
                      Assign All
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected voice settings & tuning */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
            Voice Tuning & Parameters
          </div>

          <div className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sliders size={16} style={{ color: 'var(--cyan-glow)' }} />
              <strong style={{ fontSize: 12 }}>Delivery Controls</strong>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-mid)' }}>Speaking Rate / Speed</span>
                <span style={{ color: 'var(--cyan-glow)', fontFamily: 'monospace' }}>{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-glow)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                <span>0.7x (Slower)</span>
                <span>1.0x (Normal)</span>
                <span>1.5x (Faster)</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-mid)' }}>Pitch Adjustment</span>
                <span style={{ color: 'var(--cyan-glow)', fontFamily: 'monospace' }}>{pitch > 0 ? `+${pitch}` : pitch}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-glow)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                <span>Lower (-6)</span>
                <span>Neutral (0)</span>
                <span>Higher (+6)</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-mid)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 6 }}>
                Assigned Speakers
              </div>
              <p className="hint" style={{ fontSize: 10 }}>
                In CHEATZ DABBER PRO, each character or speaker can be assigned a unique voice profile so dialogues are naturally separated across timeline audio tracks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

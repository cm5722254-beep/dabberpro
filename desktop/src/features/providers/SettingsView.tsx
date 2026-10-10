// ============================================================
// Settings View — AI Providers, FFmpeg, ElevenLabs & API Keys
// ============================================================
import { useState, useEffect } from 'react';
import { Settings2, Sparkles, WandSparkles, AlertCircle, CheckCircle, ExternalLink, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface ProviderItem {
  id: string;
  name: string;
  category: string;
  description: string;
  configured: boolean;
  localOption: boolean;
  khmerSupport: string;
  docsUrl: string;
  defaultKey?: string;
}

const DEFAULT_PROVIDERS: ProviderItem[] = [
  {
    id: 'elevenlabs',
    name: 'ElevenLabs AI Voice',
    category: 'Text-to-Speech',
    description: 'High-fidelity AI voice synthesis with multilingual models (Eleven Multilingual v2). Supports English, Chinese, Japanese, Thai, Vietnamese, and phonetics.',
    configured: true,
    localOption: false,
    khmerSupport: 'Phonetic & Multilingual v2 models',
    docsUrl: 'https://elevenlabs.io/docs',
    defaultKey: 'sk_cfbce0e88eb6d03df9a592aa74dede11a85d02406c2dfb01',
  },
  {
    id: 'google-tts',
    name: 'Google Cloud TTS',
    category: 'Text-to-Speech',
    description: 'Google Cloud Text-to-Speech with dedicated native Khmer voices (km-KH-Standard-A/B and WaveNet).',
    configured: false,
    localOption: false,
    khmerSupport: 'Yes — Official km-KH native voices',
    docsUrl: 'https://cloud.google.com/text-to-speech',
  },
  {
    id: 'google-translate',
    name: 'Google Cloud Translate',
    category: 'Translation',
    description: 'Translates source dialogue (English, Chinese, Thai, Vietnamese, etc.) accurately into Khmer Unicode.',
    configured: false,
    localOption: false,
    khmerSupport: 'Yes — Full Khmer translation',
    docsUrl: 'https://cloud.google.com/translate',
  },
  {
    id: 'openai-whisper',
    name: 'OpenAI Whisper API',
    category: 'Transcription',
    description: 'Speech recognition via OpenAI Cloud API. High accuracy for multi-language dialogue transcription.',
    configured: false,
    localOption: false,
    khmerSupport: 'Standard speech transcription',
    docsUrl: 'https://platform.openai.com/docs/guides/speech-to-text',
  },
  {
    id: 'whisper-local',
    name: 'Whisper (Local faster-whisper)',
    category: 'Transcription (Local)',
    description: 'Run Whisper locally for maximum privacy and zero cloud cost. GPU recommended.',
    configured: false,
    localOption: true,
    khmerSupport: 'Local speech recognition',
    docsUrl: 'https://github.com/SYSTRAN/faster-whisper',
  },
];

export function SettingsView() {
  const { health, setStatusMessage } = useAppStore((s) => ({
    health: s.health,
    setStatusMessage: s.setStatusMessage,
  }));

  const [keys, setKeys] = useState<Record<string, string>>({
    elevenlabs: 'sk_cfbce0e88eb6d03df9a592aa74dede11a85d02406c2dfb01',
  });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string; requiresPermission?: string }>>({});
  const [providers, setProviders] = useState<ProviderItem[]>(DEFAULT_PROVIDERS);

  // Fetch live provider status on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8765/api/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.providers && Array.isArray(data.providers)) {
          setProviders((prev) =>
            prev.map((p) => {
              const live = data.providers.find((lp: { id: string }) => lp.id === p.id);
              return live ? { ...p, configured: live.configured } : p;
            })
          );
        }
      })
      .catch(() => {
        // Backend offline or local fallback
      });
  }, []);

  async function handleSaveAndTest(providerId: string) {
    const key = keys[providerId] || '';
    setTestingId(providerId);

    try {
      // 1. Save config to backend
      await fetch(`http://127.0.0.1:8765/api/providers/${providerId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key }),
      });

      // 2. Test provider credentials
      const testRes = await fetch(`http://127.0.0.1:8765/api/providers/${providerId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key }),
      });

      const resData = await testRes.json();
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          valid: resData.valid,
          message: resData.message,
          requiresPermission: resData.requires_permission,
        },
      }));

      if (resData.valid) {
        setStatusMessage(`Successfully verified ${providerId} API key!`);
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, configured: true } : p))
        );
      } else {
        setStatusMessage(`Validation note for ${providerId}: ${resData.message}`);
      }
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          valid: false,
          message: 'Backend engine offline. Make sure uvicorn is running on port 8765.',
        },
      }));
      setStatusMessage('Could not connect to backend engine.');
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }} className="animate-fade-in">
      <div className="page-header" style={{ padding: 0, paddingBottom: 20 }}>
        <div className="page-header-left">
          <div className="page-eyebrow">Configuration</div>
          <h1>
            Settings <Settings2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
          </h1>
          <div className="page-subtitle">Configure AI providers, ElevenLabs voice engine, API keys, and studio preferences</div>
        </div>
      </div>

      {/* Backend engine health card */}
      <div className="panel" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>Backend Engine</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                {health?.status === 'ok' ? (
                  <CheckCircle size={14} style={{ color: 'var(--green-glow)' }} />
                ) : (
                  <AlertCircle size={14} style={{ color: 'var(--red-glow)' }} />
                )}
                Local engine: {health?.status ?? 'checking…'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                {health?.ffmpegAvailable ? (
                  <CheckCircle size={14} style={{ color: 'var(--green-glow)' }} />
                ) : (
                  <AlertCircle size={14} style={{ color: 'var(--amber-glow)' }} />
                )}
                FFmpeg: {health?.ffmpegAvailable ? 'Available' : 'Not found (install via winget install ffmpeg)'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                {health?.dbConnected ? (
                  <CheckCircle size={14} style={{ color: 'var(--green-glow)' }} />
                ) : (
                  <AlertCircle size={14} style={{ color: 'var(--text-dim)' }} />
                )}
                Database: {health?.dbConnected ? 'SQLite Connected' : 'Local SQLite ready'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'right' }}>
            <div>Start backend server:</div>
            <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4, fontSize: 9, color: 'var(--cyan-glow)' }}>
              uvicorn app.main:app --reload --port 8765
            </code>
          </div>
        </div>
      </div>

      {/* Provider list */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
        AI Provider & Voice Engine Configuration
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {providers.map((prov) => {
          const test = testResults[prov.id];
          const isTesting = testingId === prov.id;

          return (
            <div key={prov.id} className="panel" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div className={`provider-icon ${prov.localOption ? 'local' : ''}`} style={{ flexShrink: 0, marginTop: 2 }}>
                  {prov.localOption ? <WandSparkles size={14} /> : <Sparkles size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-bright)' }}>{prov.name}</strong>
                    <span className="status-badge none">{prov.category}</span>
                    {prov.configured && (
                      <span className="status-badge done" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={10} /> CONFIGURED
                      </span>
                    )}
                    {prov.localOption && (
                      <span className="status-badge" style={{ background: '#1e1440', color: 'var(--purple-glow)', border: '1px solid #3a2870' }}>
                        LOCAL
                      </span>
                    )}
                  </div>
                  <p className="hint" style={{ marginBottom: 8, fontSize: 11 }}>{prov.description}</p>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 10 }}>
                    <strong style={{ color: 'var(--text-mid)' }}>Khmer voice support:</strong> {prov.khmerSupport}
                  </div>

                  {!prov.localOption && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 650 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type="password"
                          placeholder={`Enter ${prov.name} API key…`}
                          value={keys[prov.id] ?? ''}
                          onChange={(e) => setKeys({ ...keys, [prov.id]: e.target.value })}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-mid)',
                            borderRadius: 7,
                            color: 'var(--text-bright)',
                            padding: '7px 10px',
                            fontSize: 11,
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                          aria-label={`${prov.name} API key`}
                        />
                      </div>
                      <button
                        className="btn primary sm"
                        disabled={isTesting}
                        onClick={() => handleSaveAndTest(prov.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {isTesting ? <RefreshCw size={12} className="spin" /> : <KeyRound size={12} />}
                        Save & Test
                      </button>
                    </div>
                  )}

                  {/* Test result feedback banner */}
                  {test && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        background: test.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${test.valid ? 'var(--green-glow)' : 'var(--red-glow)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {test.valid ? (
                        <CheckCircle size={14} style={{ color: 'var(--green-glow)', flexShrink: 0 }} />
                      ) : (
                        <ShieldAlert size={14} style={{ color: 'var(--amber-glow)', flexShrink: 0 }} />
                      )}
                      <div>
                        <div>{test.message}</div>
                        {test.requiresPermission && (
                          <div style={{ marginTop: 4, fontSize: 10, color: 'var(--amber-glow)' }}>
                            👉 To fix: In your <strong>ElevenLabs Dashboard → API Keys</strong>, ensure the key has the <strong>Text to Speech</strong> permission enabled, or generate a Full Access key.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {prov.localOption && (
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      Install via: <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4, color: 'var(--cyan-glow)' }}>pip install faster-whisper</code>
                    </div>
                  )}
                </div>

                <a
                  href={prov.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, flexShrink: 0 }}
                >
                  Docs <ExternalLink size={11} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Local-first note */}
      <div style={{ marginTop: 20, padding: 14, background: '#0d1320', border: '1px solid var(--border-dim)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>Privacy & Security Guarantee</div>
        <p className="hint">
          API keys are stored in your private local <code>backend/.env</code> file on your computer and never sent to external third parties.
          Media files and video assets are processed locally in your workspace.
        </p>
      </div>
    </div>
  );
}

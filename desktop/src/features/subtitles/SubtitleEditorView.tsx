// ============================================================
// Subtitle Editor & Exporter
// Khmer Unicode SRT / VTT with Styling & Preview
// ============================================================
import { useState, useMemo } from 'react';
import { Captions, Download, Copy, Check, FileText, Sliders } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

function toSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function SubtitleEditorView() {
  const { segments, setStatusMessage, project } = useAppStore((s) => ({
    segments: s.segments,
    setStatusMessage: s.setStatusMessage,
    project: s.project,
  }));

  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('rgba(0, 0, 0, 0.75)');
  const [subFormat, setSubFormat] = useState<'srt' | 'vtt'>('srt');

  // Generate SRT content
  const srtContent = useMemo(() => {
    return segments
      .map((seg, i) => {
        const start = toSrtTimestamp(seg.startSec);
        const end = toSrtTimestamp(seg.endSec);
        return `${i + 1}\n${start} --> ${end}\n${seg.khmText || seg.originalText}\n`;
      })
      .join('\n');
  }, [segments]);

  // Generate VTT content
  const vttContent = useMemo(() => {
    const body = segments
      .map((seg, i) => {
        const start = toSrtTimestamp(seg.startSec).replace(',', '.');
        const end = toSrtTimestamp(seg.endSec).replace(',', '.');
        return `${i + 1}\n${start} --> ${end}\n${seg.khmText || seg.originalText}\n`;
      })
      .join('\n');
    return `WEBVTT\n\n${body}`;
  }, [segments]);

  const activeContent = subFormat === 'srt' ? srtContent : vttContent;

  function handleCopy() {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setStatusMessage(`Copied ${subFormat.toUpperCase()} subtitles to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'cheatz_dub'}_khmer_subtitles.${subFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported ${subFormat.toUpperCase()} file with Khmer Unicode encoding`);
  }

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }} className="animate-fade-in">
      <div className="page-header" style={{ padding: 0, paddingBottom: 20 }}>
        <div className="page-header-left">
          <div className="page-eyebrow">Subtitles & Caption Studio</div>
          <h1>
            Subtitle Editor <Captions size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
          </h1>
          <div className="page-subtitle">Export, preview, and format Khmer Unicode subtitles (SRT / VTT)</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost sm" onClick={handleCopy}>
            {copied ? <Check size={14} style={{ color: 'var(--green-glow)' }} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="btn primary sm" onClick={handleDownload}>
            <Download size={14} /> Export {subFormat.toUpperCase()}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Editor / Raw Subtitles */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
          <div className="panel-head" style={{ borderBottom: '1px solid var(--border-mid)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <FileText size={14} style={{ color: 'var(--cyan-glow)' }} />
              <strong style={{ fontSize: 12 }}>Generated Subtitle Stream</strong>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn sm ${subFormat === 'srt' ? 'primary' : 'ghost'}`}
                onClick={() => setSubFormat('srt')}
              >
                SRT
              </button>
              <button
                className={`btn sm ${subFormat === 'vtt' ? 'primary' : 'ghost'}`}
                onClick={() => setSubFormat('vtt')}
              >
                VTT
              </button>
            </div>
          </div>

          <textarea
            value={activeContent}
            readOnly
            style={{
              flex: 1,
              background: 'transparent',
              color: 'var(--text-bright)',
              border: 'none',
              padding: 16,
              fontSize: 12,
              fontFamily: "'Kantumruy Pro', 'Kantumruy', 'Consolas', monospace",
              lineHeight: 1.7,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Styling Controls & Video Overlay Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sliders size={16} style={{ color: 'var(--cyan-glow)' }} />
              <strong style={{ fontSize: 12 }}>Overlay Appearance</strong>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="14"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-glow)' }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                Text Color
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#ffffff', '#fef08a', '#67e8f9', '#a7f3d0'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFontColor(c)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      background: c,
                      border: fontColor === c ? '2px solid var(--cyan-glow)' : '1px solid var(--border-mid)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                Box Background
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Dark', val: 'rgba(0, 0, 0, 0.75)' },
                  { label: 'Semi', val: 'rgba(0, 0, 0, 0.45)' },
                  { label: 'None', val: 'transparent' },
                ].map((b) => (
                  <button
                    key={b.label}
                    className={`btn sm ${bgColor === b.val ? 'primary' : 'ghost'}`}
                    onClick={() => setBgColor(b.val)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Subtitle Visual Card Preview */}
          <div className="panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
              Live Subtitle Burn-In Preview
            </div>
            <div
              style={{
                height: 120,
                background: 'linear-gradient(135deg, #090e17 0%, #172554 100%)',
                borderRadius: 8,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: `${fontSize * 0.75}px`,
                  color: fontColor,
                  background: bgColor,
                  padding: '4px 10px',
                  borderRadius: 4,
                  textAlign: 'center',
                  fontFamily: "'Kantumruy Pro', 'Kantumruy', sans-serif",
                  maxWidth: '90%',
                  lineHeight: 1.4,
                }}
              >
                {segments[0]?.khmText || 'ការបង្ហាញចំណងជើងរងជាភាសាខ្មែរ'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

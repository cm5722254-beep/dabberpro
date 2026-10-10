// ============================================================
// Right Sidebar — Project & Episode Management
// ============================================================
import { Check, Settings2, Sparkles, WandSparkles, Upload, X, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export function RightBar() {
  const {
    project, aiMode, setAiMode, sourceLanguage, setSourceLanguage,
    providers, jobs, setStatusMessage, removeJob
  } = useAppStore((s) => ({
    project: s.project,
    aiMode: s.aiMode,
    setAiMode: s.setAiMode,
    sourceLanguage: s.sourceLanguage,
    setSourceLanguage: s.setSourceLanguage,
    providers: s.providers,
    jobs: s.jobs,
    setStatusMessage: s.setStatusMessage,
    removeJob: s.removeJob,
  }));

  const activeEp = project?.episodes[0];

  // Determine workflow steps
  const steps = [
    { num: 1, label: 'Import video',       sub: 'Choose source file',     done: !!activeEp?.mediaPath },
    { num: 2, label: 'Transcribe audio',   sub: 'Speech → text',          done: false },
    { num: 3, label: 'Translate dialogue', sub: 'Into Khmer',              done: false },
    { num: 4, label: 'Generate voices',    sub: 'AI Khmer TTS',           done: false },
    { num: 5, label: 'Sync & export',      sub: 'Render final video',     done: false },
  ];
  const activeStep = steps.findIndex((s) => !s.done);

  return (
    <aside className="rightbar">
      <div className="rightbar-head">
        <span className="rightbar-head-title">Project</span>
        <Settings2 size={14} style={{ color: 'var(--text-dim)' }} />
      </div>

      {/* Project metadata */}
      <div className="rightbar-section">
        <div className="right-section-label">Project Info</div>
        <div className="right-field">
          <label>Project Name</label>
          <input value={project?.name ?? ''} readOnly style={{ color: 'var(--text-dim)' }} />
        </div>
        <div className="right-field">
          <label>Source Language</label>
          <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value as never)}>
            <option value="auto">Auto Detect</option>
            <option value="en">English</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="th">Thai</option>
            <option value="vi">Vietnamese</option>
          </select>
        </div>
        <div className="right-field">
          <label>Target Language</label>
          <select defaultValue="km" disabled>
            <option value="km">Khmer (ភាសាខ្មែរ)</option>
          </select>
        </div>
        <div className="right-field">
          <label>AI Processing Mode</label>
          <select value={aiMode} onChange={(e) => setAiMode(e.target.value as never)}>
            <option value="hybrid">Hybrid — best available</option>
            <option value="api-first">API First — cloud priority</option>
            <option value="local-first">Local First — private</option>
          </select>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="rightbar-section">
        <div className="right-section-label">Dubbing Workflow</div>
        <div className="workflow-steps">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`workflow-step ${step.done ? 'done' : i === activeStep ? 'active' : ''}`}
            >
              <div className="step-num">
                {step.done ? <Check size={12} /> : step.num}
              </div>
              <div className="step-info">
                <strong>{step.label}</strong>
                <small>{step.sub}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Providers */}
      <div className="rightbar-section">
        <div className="right-section-label">AI Providers</div>
        {providers.length === 0 ? (
          <>
            <div className="provider-card">
              <div className="provider-icon">
                <Sparkles size={14} />
              </div>
              <div className="provider-info">
                <strong>Cloud API</strong>
                <small>Translation · TTS · Transcription</small>
              </div>
              <span className="provider-badge setup">Setup</span>
            </div>
            <div className="provider-card">
              <div className="provider-icon local">
                <WandSparkles size={14} />
              </div>
              <div className="provider-info">
                <strong>Local AI</strong>
                <small>Private processing</small>
              </div>
              <span className="provider-badge local">Local</span>
            </div>
            <p className="hint" style={{ marginTop: 8 }}>
              Configure providers in Settings to enable transcription, translation, and Khmer TTS.
            </p>
          </>
        ) : (
          providers.map((p) => (
            <div key={p.id} className="provider-card">
              <div className={`provider-icon ${p.id.includes('local') ? 'local' : ''}`}>
                <Sparkles size={14} />
              </div>
              <div className="provider-info">
                <strong>{p.name}</strong>
                <small>{p.capabilities.join(' · ')}</small>
              </div>
              <span className={`provider-badge ${p.configured ? 'ok' : 'setup'}`}>
                {p.configured ? 'Ready' : 'Setup'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Processing Jobs */}
      {jobs.length > 0 && (
        <div className="rightbar-section">
          <div className="right-section-label">Processing Queue</div>
          {jobs.map((job) => (
            <div key={job.id} className="job-item">
              <div className="job-item-info">
                <strong>{job.type.replace(/-/g, ' ')}</strong>
                <div className="job-progress-bar">
                  <div className="job-progress-fill" style={{ width: `${job.progress}%` }} />
                </div>
                <small style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2, display: 'block' }}>
                  {job.message}
                </small>
              </div>
              {job.cancellable && (
                <button className="btn ghost icon" onClick={() => removeJob(job.id)} title="Cancel">
                  <X size={12} />
                </button>
              )}
              {job.status === 'failed' && (
                <button className="btn ghost icon" title="Retry" onClick={() => setStatusMessage(`Retrying job: ${job.type}`)}>
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Export Settings */}
      <div className="rightbar-section">
        <div className="right-section-label">Export Settings</div>
        <div className="right-field">
          <label>Export Format</label>
          <select defaultValue="mp4">
            <option value="mp4">MP4 Video (H.264/AAC)</option>
            <option value="wav">WAV Audio</option>
            <option value="srt">SRT Subtitles</option>
            <option value="vtt">VTT Subtitles</option>
          </select>
        </div>
        <div className="right-field">
          <label>Video Resolution</label>
          <select defaultValue="source">
            <option value="source">Match source</option>
            <option value="1080">1920 × 1080</option>
            <option value="720">1280 × 720</option>
          </select>
        </div>
        <div className="right-field">
          <label>Subtitle Style</label>
          <select defaultValue="bottom-white">
            <option value="bottom-white">Bottom · White</option>
            <option value="cinematic">Yellow cinematic</option>
            <option value="none">No subtitles</option>
          </select>
        </div>
        <button
          className="btn primary w-full"
          style={{ justifyContent: 'center', marginTop: 4 }}
          onClick={() => setStatusMessage('Export requires generated voice clips and FFmpeg rendering. Configure providers first.')}
        >
          <Upload size={14} /> Export Project
        </button>
      </div>
    </aside>
  );
}

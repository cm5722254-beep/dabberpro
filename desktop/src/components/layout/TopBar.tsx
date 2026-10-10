// ============================================================
// Top Navigation Bar
// ============================================================
import {
  WandSparkles, FolderOpen, FileVideo, Save, Undo2, Redo2,
  Upload, Settings2, Bell, ChevronDown
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export function TopBar() {
  const { health, project, updateProjectName, setStatusMessage } = useAppStore((s) => ({
    health: s.health,
    project: s.project,
    updateProjectName: s.updateProjectName,
    setStatusMessage: s.setStatusMessage,
  }));

  const online = health?.status === 'ok';

  async function importVideo() {
    try {
      const path = await window.dabber?.openVideo();
      if (path) {
        setStatusMessage(`Video imported: ${path.split(/[\\/]/).pop()} — connect a provider to transcribe`);
      }
    } catch {
      setStatusMessage('File dialog unavailable in browser preview mode');
    }
  }

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <WandSparkles size={18} />
        </div>
        <div className="brand-title">
          <strong>CHEATZ <span>DABBER PRO</span></strong>
          <small>KHMER AI DUBBING STUDIO</small>
        </div>
      </div>

      <div className="topbar-sep" />

      {/* Project name */}
      <input
        className="project-name-input"
        value={project?.name ?? 'Untitled Project'}
        onChange={(e) => updateProjectName(e.target.value)}
        aria-label="Project name"
        title="Click to rename project"
      />

      <div className="topbar-sep" />

      {/* Quick actions */}
      <div className="topbar-actions">
        <button className="btn ghost sm" onClick={importVideo} title="Import folder">
          <FolderOpen size={14} /> Import Folder
        </button>
        <button className="btn ghost sm" onClick={importVideo} title="Import video file">
          <FileVideo size={14} /> Import Video
        </button>
        <div className="topbar-sep" />
        <button className="btn ghost icon" onClick={() => setStatusMessage('Project saved (local session)')} title="Save project">
          <Save size={14} />
        </button>
        <button className="btn ghost icon" title="Undo">
          <Undo2 size={14} />
        </button>
        <button className="btn ghost icon" title="Redo">
          <Redo2 size={14} />
        </button>
      </div>

      {/* Right side */}
      <div className="topbar-right">
        <div className={`engine-pill ${online ? '' : 'offline'}`}>
          <span className="dot" />
          {online
            ? `Engine online · ${health?.mode ?? 'hybrid'}`
            : 'Engine offline · start Python backend'}
        </div>

        {health?.ffmpegAvailable === false && (
          <div className="engine-pill offline">
            <span className="dot" style={{ background: 'var(--amber-glow)' }} />
            FFmpeg not found
          </div>
        )}

        <button className="btn ghost icon" title="Notifications">
          <Bell size={15} />
        </button>

        <button className="btn ghost icon" title="Application settings">
          <Settings2 size={15} />
        </button>

        <button
          className="btn primary sm"
          onClick={() => setStatusMessage('Export requires generated voice clips and FFmpeg. Configure providers first.')}
          title="Export project"
        >
          <Upload size={14} /> Export <ChevronDown size={12} />
        </button>
      </div>
    </header>
  );
}

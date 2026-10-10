// ============================================================
// Projects View — Recent projects, create new
// ============================================================
import { Plus, FileVideo, Clock, Folder } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export function ProjectsView() {
  const { project, setStatusMessage } = useAppStore((s) => ({
    project: s.project,
    setStatusMessage: s.setStatusMessage,
  }));

  function newProject() {
    setStatusMessage('New project created — import a video to begin.');
  }

  // In Phase 2 this will load from the database
  const recentProjects = project ? [project] : [];

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }} className="animate-fade-in">
      <div className="page-header" style={{ padding: 0, paddingBottom: 20 }}>
        <div className="page-header-left">
          <div className="page-eyebrow">File Management</div>
          <h1>Projects</h1>
          <div className="page-subtitle">Manage your dubbing projects and episodes</div>
        </div>
        <button className="btn primary" onClick={newProject} id="new-project-btn">
          <Plus size={14} /> New Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {/* Create new card */}
        <div
          className="panel"
          onClick={newProject}
          style={{
            padding: 24, cursor: 'pointer', border: '1px dashed var(--border-bright)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            justifyContent: 'center', minHeight: 160, transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cyan-dim)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)', display: 'grid', placeItems: 'center', color: 'var(--cyan-mid)' }}>
            <Plus size={22} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>New Project</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Create a new dubbing project</div>
          </div>
        </div>

        {/* Existing projects */}
        {recentProjects.map((p) => (
          <div key={p.id} className="panel" style={{ padding: 16, cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0d2030', border: '1px solid var(--cyan-dim)', display: 'grid', placeItems: 'center', color: 'var(--cyan-glow)' }}>
                <FileVideo size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)' }} className="truncate">{p.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                  {p.episodes.length} episode(s) · Khmer
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="status-badge none">{p.sourceLanguage === 'auto' ? 'Auto' : p.sourceLanguage.toUpperCase()} → KM</span>
              <span className="status-badge none">{p.aiMode}</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} /> {new Date(p.updatedAt).toLocaleDateString()}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Folder size={10} /> {p.episodes.length} episode(s)
              </span>
            </div>
          </div>
        ))}
      </div>

      {recentProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-dim)', marginTop: 24 }}>
          <FileVideo size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 12 }}>No projects yet. Create your first project above.</p>
          <p style={{ fontSize: 10, marginTop: 8, color: 'var(--text-dim)' }}>Projects are stored locally on your computer.</p>
        </div>
      )}
    </div>
  );
}

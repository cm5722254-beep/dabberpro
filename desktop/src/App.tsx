// ============================================================
// CHEATZ DABBER PRO — Root App Component
// Phase 1: Full shell + modular views
// ============================================================
import { useEffect } from 'react';
import './styles.css';
import { useAppStore } from './stores/appStore';
import { useHealthCheck, useJobPolling } from './hooks';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { RightBar } from './components/layout/RightBar';
import { StatusBar } from './components/layout/StatusBar';
import { DubbingStudio } from './features/dubbing/DubbingStudio';
import { ProjectsView } from './features/projects/ProjectsView';
import { SettingsView } from './features/providers/SettingsView';
import { SubtitleEditorView } from './features/subtitles/SubtitleEditorView';
import { VoiceProfilesView } from './features/voices/VoiceProfilesView';
import { PlaceholderView } from './components/ui/PlaceholderView';
import {
  AudioLines, Layers, FolderOpen,
  FileVideo, BookTemplate, Clock, Wand2
} from 'lucide-react';
import type { SidebarView } from './types';

function ViewRouter() {
  const view = useAppStore((s) => s.sidebarView);

  const views: Record<SidebarView, JSX.Element> = {
    dubbing: <DubbingStudio />,
    projects: <ProjectsView />,
    settings: <SettingsView />,
    voices: <VoiceProfilesView />,
    subtitles: <SubtitleEditorView />,
    dashboard: (
      <PlaceholderView icon={<Layers size={28} />} title="Dashboard" description="Project statistics, recent activity, and quick-start actions. Coming in Phase 2." />
    ),
    advanced: (
      <PlaceholderView icon={<Wand2 size={28} />} title="Advanced Studio Mode" description="Frame-accurate editing, custom audio routing, and advanced export. Planned." />
    ),
    media: (
      <PlaceholderView icon={<FolderOpen size={28} />} title="Media Library" description="Browse, preview, and manage all imported video and audio files across your projects." />
    ),
    'audio-tools': (
      <PlaceholderView icon={<AudioLines size={28} />} title="Audio Tools" description="Noise reduction, normalization, background music, and audio mixing. Planned for Phase 8." />
    ),
    episodes: (
      <PlaceholderView icon={<FileVideo size={28} />} title="Episode Manager" description="Manage multiple episodes within a project. Batch processing and progress tracking. Coming in Phase 2." />
    ),
    templates: (
      <PlaceholderView icon={<BookTemplate size={28} />} title="Templates" description="Reusable project templates for common dubbing workflows. Planned." />
    ),
    'export-history': (
      <PlaceholderView icon={<Clock size={28} />} title="Export History" description="View past exports, download finished files, and recover from failed exports. Coming in Phase 8." />
    ),
  };

  return views[view] ?? views.dubbing;
}

export default function App() {
  useHealthCheck();
  useJobPolling();

  const setStatusMessage = useAppStore((s) => s.setStatusMessage);

  useEffect(() => {
    setStatusMessage('Ready — import a video to begin dubbing');
  }, [setStatusMessage]);

  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace">
        <Sidebar />
        <main className="main-content">
          <ViewRouter />
        </main>
        <RightBar />
      </div>
      <StatusBar />
    </div>
  );
}

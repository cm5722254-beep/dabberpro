// ============================================================
// Left Sidebar Navigation & Video Tools
// ============================================================
import { useState } from 'react';
import {
  Clapperboard, FileVideo, AudioLines, Mic2, Captions, Users,
  FolderOpen, Settings2, CircleHelp, MoreHorizontal,
  Wand2, BookTemplate, Clock, LayoutGrid, Crop, Maximize2,
  RotateCw, EyeOff, Type, Image, Stamp, VolumeX, Music,
  ChevronDown, ChevronRight, ImagePlus
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import type { SidebarView } from '../../types';

type NavEntry = {
  id: SidebarView;
  icon: JSX.Element;
  label: string;
  badge?: { text: string; type: 'new' | 'soon' };
};

const NAV_ENTRIES: NavEntry[] = [
  { id: 'dashboard',      icon: <LayoutGrid size={16} />,    label: 'Dashboard' },
  { id: 'projects',       icon: <FileVideo size={16} />,     label: 'Projects' },
  { id: 'dubbing',        icon: <Clapperboard size={16} />,  label: 'Dubbing Studio AI', badge: { text: 'ACTIVE', type: 'new' } },
  { id: 'voices',         icon: <Mic2 size={16} />,          label: 'Voice Profiles (ElevenLabs)', badge: { text: 'TTS', type: 'new' } },
  { id: 'subtitles',      icon: <Captions size={16} />,      label: 'Subtitle Editor' },
  { id: 'media',          icon: <FolderOpen size={16} />,    label: 'Media Library' },
  { id: 'audio-tools',    icon: <AudioLines size={16} />,    label: 'Audio Tools' },
  { id: 'episodes',       icon: <Users size={16} />,         label: 'Episode Manager' },
  { id: 'templates',      icon: <BookTemplate size={16} />,  label: 'Templates',         badge: { text: 'SOON', type: 'soon' } },
  { id: 'advanced',       icon: <Wand2 size={16} />,         label: 'Advanced Studio',   badge: { text: 'SOON', type: 'soon' } },
  { id: 'export-history', icon: <Clock size={16} />,         label: 'Export History' },
];

export function Sidebar() {
  const { sidebarView, setSidebarView, setStatusMessage } = useAppStore((s) => ({
    sidebarView: s.sidebarView,
    setSidebarView: s.setSidebarView,
    setStatusMessage: s.setStatusMessage,
  }));

  const [toolsOpen, setToolsOpen] = useState(true);

  const videoTools = [
    { name: 'Crop', icon: <Crop size={14} />, desc: 'Crop video boundaries (FFmpeg)' },
    { name: 'Resize', icon: <Maximize2 size={14} />, desc: '16:9, 9:16 Shorts/TikTok, 1:1 square' },
    { name: 'Rotate', icon: <RotateCw size={14} />, desc: '90° / 180° video flip and rotation' },
    { name: 'Blur', icon: <EyeOff size={14} />, desc: 'Sensitive content blur mask' },
    { name: 'Text Overlay', icon: <Type size={14} />, desc: 'Khmer Unicode headline overlay' },
    { name: 'Image Overlay', icon: <Image size={14} />, desc: 'PNG watermark / logo overlay' },
    { name: 'Watermark', icon: <Stamp size={14} />, desc: 'Corner branding & transparency' },
    { name: 'Audio Mute', icon: <VolumeX size={14} />, desc: 'Mute original audio track' },
    { name: 'Background Music', icon: <Music size={14} />, desc: 'Ambient soundtrack layering' },
    { name: 'Cover Studio', icon: <ImagePlus size={14} />, desc: 'Generate video cover and thumbnail' },
  ];

  return (
    <aside className="sidebar" style={{ overflowY: 'auto' }}>
      <div className="sidebar-section-label">Studio Navigation</div>

      {NAV_ENTRIES.map((entry) => (
        <button
          key={entry.id}
          className={`nav-item ${sidebarView === entry.id ? 'active' : ''}`}
          onClick={() => setSidebarView(entry.id)}
          title={entry.label}
        >
          {entry.icon}
          <span style={{ flex: 1, textAlign: 'left' }}>{entry.label}</span>
          {entry.badge && (
            <span className={`nav-badge ${entry.badge.type}`}>{entry.badge.text}</span>
          )}
        </button>
      ))}

      {/* Video Editing Tools Group */}
      <div style={{ marginTop: 14 }}>
        <button
          onClick={() => setToolsOpen(!toolsOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '6px 12px',
            color: 'var(--text-dim)',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
          }}
        >
          <span>Creative Tools</span>
          {toolsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {toolsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 4 }}>
            {videoTools.map((tool) => (
              <button
                key={tool.name}
                className="nav-item"
                style={{ fontSize: 11, padding: '6px 10px', height: 'auto' }}
                onClick={() => setStatusMessage(`${tool.name} tool: ${tool.desc}`)}
                title={tool.desc}
              >
                {tool.icon}
                <span style={{ flex: 1, textAlign: 'left' }}>{tool.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer" style={{ marginTop: 20 }}>
        <button
          className={`nav-item ${sidebarView === 'settings' ? 'active' : ''}`}
          onClick={() => setSidebarView('settings')}
        >
          <Settings2 size={16} /> Settings & Keys
        </button>
        <button
          className="nav-item"
          onClick={() => window.open?.('https://elevenlabs.io', '_blank')}
        >
          <CircleHelp size={16} /> ElevenLabs Docs
        </button>

        <div className="divider" />

        <div className="profile-card">
          <div className="avatar">C</div>
          <div className="profile-info">
            <strong>Creator Studio</strong>
            <small>Local workspace</small>
          </div>
          <MoreHorizontal size={14} style={{ color: 'var(--text-dim)' }} />
        </div>
      </div>
    </aside>
  );
}

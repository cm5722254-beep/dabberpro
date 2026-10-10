// ============================================================
// CHEATZ DABBER PRO — Core TypeScript types
// ============================================================

export type ProviderStatus = 'configured' | 'unconfigured' | 'error' | 'checking';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
export type TranslationStatus = 'none' | 'pending' | 'done' | 'failed' | 'locked';
export type AudioStatus = 'none' | 'pending' | 'generating' | 'done' | 'failed';
export type SupportedLanguage = 'auto' | 'en' | 'zh' | 'ja' | 'ko' | 'th' | 'vi' | 'km';
export type ExportFormat = 'mp4' | 'wav' | 'srt' | 'vtt';
export type AIMode = 'hybrid' | 'api-first' | 'local-first';
export type SidebarView =
  | 'dashboard'
  | 'projects'
  | 'dubbing'
  | 'advanced'
  | 'media'
  | 'audio-tools'
  | 'subtitles'
  | 'voices'
  | 'episodes'
  | 'templates'
  | 'export-history'
  | 'settings';

// ─── Project ────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: 'km';
  aiMode: AIMode;
  createdAt: string;
  updatedAt: string;
  totalDurationSec: number;
  episodes: Episode[];
  activeEpisodeId: string | null;
}

// ─── Episode ────────────────────────────────────────────────
export interface Episode {
  id: string;
  projectId: string;
  name: string;
  mediaPath: string | null;
  mediaFilename: string | null;
  durationSec: number | null;
  fps: number | null;
  width: number | null;
  height: number | null;
  segments: DialogueSegment[];
  tracks: TimelineTrack[];
  status: EpisodeStatus;
  createdAt: string;
}

export type EpisodeStatus = 'empty' | 'imported' | 'transcribed' | 'translated' | 'voiced' | 'exported';

// ─── Dialogue ───────────────────────────────────────────────
export interface DialogueSegment {
  id: string;
  episodeId: string;
  index: number;
  startSec: number;
  endSec: number;
  originalText: string;
  khmText: string;
  speakerName: string;
  voiceProfileId: string | null;
  emotion: string | null;
  translationStatus: TranslationStatus;
  audioStatus: AudioStatus;
  audioPath: string | null;
  audioDurationSec: number | null;
  locked: boolean;
  confidence: number | null;
}

// ─── Speaker / Voice Profile ─────────────────────────────────
export interface Speaker {
  id: string;
  name: string;
  defaultVoiceProfileId: string | null;
}

export interface VoiceProfile {
  id: string;
  label: string;
  providerVoiceId: string;
  provider: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  previewUrl: string | null;
  speed: number;
  pitch: number;
  style: string | null;
}

// ─── Timeline ───────────────────────────────────────────────
export type TrackType = 'video' | 'original-audio' | 'dubbed-audio' | 'speaker-audio' | 'subtitles' | 'bg-music' | 'sfx';

export interface TimelineTrack {
  id: string;
  episodeId: string;
  type: TrackType;
  label: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  clips: TimelineClip[];
}

export interface TimelineClip {
  id: string;
  trackId: string;
  startSec: number;
  durationSec: number;
  label: string;
  color: string;
  assetPath: string | null;
  locked: boolean;
}

// ─── Subtitle ───────────────────────────────────────────────
export interface SubtitleTrack {
  id: string;
  episodeId: string;
  format: 'srt' | 'vtt';
  entries: SubtitleEntry[];
}

export interface SubtitleEntry {
  id: string;
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

// ─── AI Provider ────────────────────────────────────────────
export interface ProviderConfig {
  id: string;
  category: 'transcription' | 'translation' | 'tts' | 'diarization';
  name: string;
  capabilities: string[];
  supportedLanguages: string[];
  status: ProviderStatus;
  configured: boolean;
  apiKeySet: boolean;
  localModelInstalled: boolean;
  errorMessage: string | null;
  costInfo: string | null;
}

// ─── Processing Jobs ────────────────────────────────────────
export interface ProcessingJob {
  id: string;
  type: 'transcribe' | 'translate' | 'tts' | 'export' | 'extract-audio';
  episodeId: string;
  status: JobStatus;
  progress: number;
  message: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  cancellable: boolean;
}

// ─── Export ─────────────────────────────────────────────────
export interface ExportJob {
  id: string;
  episodeId: string;
  format: ExportFormat;
  outputPath: string | null;
  status: JobStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  verified: boolean;
}

// ─── Health ─────────────────────────────────────────────────
export interface BackendHealth {
  status: 'ok' | 'error' | 'offline';
  service: string;
  mode: string;
  version: string;
  ffmpegAvailable: boolean;
  dbConnected: boolean;
}

// ─── Electron bridge ────────────────────────────────────────
export interface DabberBridge {
  openVideo: () => Promise<string | null>;
  openFolder: () => Promise<string | null>;
  saveDialog: (defaultName: string, filters: Array<{ name: string; extensions: string[] }>) => Promise<string | null>;
  getAppVersion: () => Promise<string>;
  platform: string;
}

declare global {
  interface Window {
    dabber: DabberBridge;
  }
}

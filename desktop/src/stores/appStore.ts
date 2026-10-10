// ============================================================
// CHEATZ DABBER PRO — Zustand global store
// ============================================================
import { create } from 'zustand';
import type {
  Project, Episode, DialogueSegment, ProviderConfig,
  ProcessingJob, SidebarView, BackendHealth, AIMode,
  SupportedLanguage, VoiceProfile
} from '../types';

interface AppState {
  // ── UI State ────────────────────────────────────────────
  sidebarView: SidebarView;
  setSidebarView: (v: SidebarView) => void;
  statusMessage: string;
  setStatusMessage: (m: string) => void;

  // ── Backend Health ───────────────────────────────────────
  health: BackendHealth | null;
  setHealth: (h: BackendHealth | null) => void;

  // ── Project ──────────────────────────────────────────────
  project: Project | null;
  setProject: (p: Project | null) => void;
  updateProjectName: (name: string) => void;

  // ── Active Episode ───────────────────────────────────────
  activeEpisode: Episode | null;
  setActiveEpisode: (e: Episode | null) => void;

  // ── Dialogue Segments ────────────────────────────────────
  segments: DialogueSegment[];
  setSegments: (s: DialogueSegment[]) => void;
  updateSegment: (id: string, patch: Partial<DialogueSegment>) => void;
  addSegment: (s: DialogueSegment) => void;
  removeSegment: (id: string) => void;

  // ── Voice Profiles ───────────────────────────────────────
  voiceProfiles: VoiceProfile[];
  setVoiceProfiles: (vp: VoiceProfile[]) => void;

  // ── AI Providers ─────────────────────────────────────────
  providers: ProviderConfig[];
  setProviders: (p: ProviderConfig[]) => void;
  aiMode: AIMode;
  setAiMode: (m: AIMode) => void;
  sourceLanguage: SupportedLanguage;
  setSourceLanguage: (l: SupportedLanguage) => void;

  // ── Jobs ─────────────────────────────────────────────────
  jobs: ProcessingJob[];
  upsertJob: (j: ProcessingJob) => void;
  removeJob: (id: string) => void;

  // ── Playback ─────────────────────────────────────────────
  currentTimeSec: number;
  setCurrentTimeSec: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;

  // ── Timeline zoom ────────────────────────────────────────
  timelineZoom: number;
  setTimelineZoom: (z: number) => void;
}

function makeProject(name: string): Project {
  const now = new Date().toISOString();
  const episodeId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    name,
    sourceLanguage: 'auto',
    targetLanguage: 'km',
    aiMode: 'hybrid',
    createdAt: now,
    updatedAt: now,
    totalDurationSec: 0,
    episodes: [{
      id: episodeId,
      projectId: '',
      name: 'Episode 1',
      mediaPath: null,
      mediaFilename: null,
      durationSec: null,
      fps: null,
      width: null,
      height: null,
      segments: [],
      tracks: [],
      status: 'empty',
      createdAt: now,
    }],
    activeEpisodeId: episodeId,
  };
}

const DEMO_SEGMENTS: DialogueSegment[] = [
  {
    id: '1', episodeId: 'demo', index: 0, startSec: 0.9, endSec: 6.7,
    originalText: 'Welcome to the AI Voice Dubbing Studio.',
    khmText: 'សូមស្វាគមន៍មកកាន់ស្ទូឌីយោបកប្រែសំឡេង AI ។',
    speakerName: 'Narrator', voiceProfileId: 'km-male-01', emotion: null,
    translationStatus: 'done', audioStatus: 'none', audioPath: null,
    audioDurationSec: null, locked: false, confidence: 0.97,
  },
  {
    id: '2', episodeId: 'demo', index: 1, startSec: 7.0, endSec: 9.6,
    originalText: 'Are you ready to begin?',
    khmText: 'តើអ្នកត្រៀមខ្លួនរួចរាល់ហើយឬនៅ?',
    speakerName: 'Host', voiceProfileId: 'km-female-01', emotion: null,
    translationStatus: 'done', audioStatus: 'none', audioPath: null,
    audioDurationSec: null, locked: false, confidence: 0.95,
  },
  {
    id: '3', episodeId: 'demo', index: 2, startSec: 11.1, endSec: 13.6,
    originalText: 'Start creating your Khmer voice now.',
    khmText: 'ចាប់ផ្ដើមបង្កើតសំឡេងខ្មែររបស់អ្នក។',
    speakerName: 'Narrator', voiceProfileId: 'km-male-01', emotion: null,
    translationStatus: 'done', audioStatus: 'none', audioPath: null,
    audioDurationSec: null, locked: false, confidence: 0.92,
  },
];

const DEMO_VOICES: VoiceProfile[] = [
  { id: 'eleven-george', label: 'ElevenLabs: George (Multilingual)', providerVoiceId: 'JBFqnCBsd6RMkjVDRZzb', provider: 'elevenlabs', gender: 'male', language: 'multilingual', previewUrl: null, speed: 1.0, pitch: 0, style: null },
  { id: 'eleven-rachel', label: 'ElevenLabs: Rachel (Calm)', providerVoiceId: '21m00Tcm4TlvDq8ikWAM', provider: 'elevenlabs', gender: 'female', language: 'multilingual', previewUrl: null, speed: 1.0, pitch: 0, style: null },
  { id: 'km-female-01', label: 'Google Khmer: Sreymom (Standard Female)', providerVoiceId: 'km-KH-Standard-A', provider: 'google-tts', gender: 'female', language: 'km', previewUrl: null, speed: 1.0, pitch: 0, style: null },
  { id: 'km-male-01', label: 'Google Khmer: Piseth (Standard Male)', providerVoiceId: 'km-KH-Standard-B', provider: 'google-tts', gender: 'male', language: 'km', previewUrl: null, speed: 1.0, pitch: 0, style: null },
];

export const useAppStore = create<AppState>((set) => ({
  sidebarView: 'dubbing',
  setSidebarView: (v) => set({ sidebarView: v }),
  statusMessage: 'Ready — import a video or open a project to begin',
  setStatusMessage: (m) => set({ statusMessage: m }),

  health: null,
  setHealth: (h) => set({ health: h }),

  project: makeProject('New Dubbing Project'),
  setProject: (p) => set({ project: p }),
  updateProjectName: (name) => set((s) => s.project ? { project: { ...s.project, name } } : {}),

  activeEpisode: null,
  setActiveEpisode: (e) => set({ activeEpisode: e }),

  segments: DEMO_SEGMENTS,
  setSegments: (s) => set({ segments: s }),
  updateSegment: (id, patch) =>
    set((s) => ({ segments: s.segments.map((seg) => seg.id === id ? { ...seg, ...patch } : seg) })),
  addSegment: (s) => set((state) => ({ segments: [...state.segments, s] })),
  removeSegment: (id) => set((s) => ({ segments: s.segments.filter((seg) => seg.id !== id) })),

  voiceProfiles: DEMO_VOICES,
  setVoiceProfiles: (vp) => set({ voiceProfiles: vp }),

  providers: [],
  setProviders: (p) => set({ providers: p }),
  aiMode: 'hybrid',
  setAiMode: (m) => set({ aiMode: m }),
  sourceLanguage: 'auto',
  setSourceLanguage: (l) => set({ sourceLanguage: l }),

  jobs: [],
  upsertJob: (j) =>
    set((s) => {
      const existing = s.jobs.findIndex((x) => x.id === j.id);
      if (existing >= 0) {
        const updated = [...s.jobs];
        updated[existing] = j;
        return { jobs: updated };
      }
      return { jobs: [...s.jobs, j] };
    }),
  removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

  currentTimeSec: 0,
  setCurrentTimeSec: (t) => set({ currentTimeSec: t }),
  isPlaying: false,
  setIsPlaying: (v) => set({ isPlaying: v }),

  timelineZoom: 1,
  setTimelineZoom: (z) => set({ timelineZoom: z }),
}));

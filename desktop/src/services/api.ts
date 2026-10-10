// ============================================================
// CHEATZ DABBER PRO — Backend API service
// ============================================================
import type { BackendHealth, ProviderConfig, ProcessingJob } from '../types';

const BASE = 'http://127.0.0.1:8765';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health
  health: (): Promise<BackendHealth> => request('/health'),

  // Providers
  providers: (): Promise<{ providers: ProviderConfig[] }> => request('/api/providers'),

  // Projects
  createProject: (payload: { name: string; source_language: string }) =>
    request('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),

  getProjects: () => request<{ projects: unknown[] }>('/api/projects'),

  getProject: (id: string) => request(`/api/projects/${id}`),

  // Episodes
  importMedia: (projectId: string, episodeId: string, filePath: string) =>
    request('/api/media/import', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, episode_id: episodeId, file_path: filePath }),
    }),

  getMediaInfo: (filePath: string) =>
    request('/api/media/info', {
      method: 'POST',
      body: JSON.stringify({ file_path: filePath }),
    }),

  extractAudio: (episodeId: string) =>
    request(`/api/episodes/${episodeId}/extract-audio`, { method: 'POST' }),

  // Transcription
  transcribe: (episodeId: string, provider: string = 'auto') =>
    request(`/api/episodes/${episodeId}/transcribe`, {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),

  // Translation
  translate: (payload: {
    text: string;
    source_language: string;
    target_language: string;
  }) => request('/api/translate', { method: 'POST', body: JSON.stringify(payload) }),

  translateEpisode: (episodeId: string) =>
    request(`/api/episodes/${episodeId}/translate`, { method: 'POST' }),

  // TTS
  generateVoice: (payload: {
    text: string;
    voice_id: string;
    provider: string;
    speed?: number;
    pitch?: number;
  }) => request('/api/voice', { method: 'POST', body: JSON.stringify(payload) }),

  generateEpisodeVoices: (episodeId: string) =>
    request(`/api/episodes/${episodeId}/generate-voices`, { method: 'POST' }),

  // Segments
  getSegments: (episodeId: string) =>
    request<{ segments: unknown[] }>(`/api/episodes/${episodeId}/segments`),

  updateSegment: (segId: string, patch: Record<string, unknown>) =>
    request(`/api/segments/${segId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  // Jobs
  getJobs: (): Promise<{ jobs: ProcessingJob[] }> => request('/api/jobs'),

  cancelJob: (jobId: string) =>
    request(`/api/jobs/${jobId}/cancel`, { method: 'POST' }),

  // Export
  exportProject: (episodeId: string, format: string, outputPath: string) =>
    request('/api/export', {
      method: 'POST',
      body: JSON.stringify({ episode_id: episodeId, format, output_path: outputPath }),
    }),

  // Subtitles
  exportSubtitles: (episodeId: string, format: 'srt' | 'vtt') =>
    request(`/api/episodes/${episodeId}/subtitles?format=${format}`),
};

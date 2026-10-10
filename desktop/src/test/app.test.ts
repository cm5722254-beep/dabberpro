import { describe, it, expect } from 'vitest';
import { formatTime } from '../hooks';

// ── Unit tests: formatTime ───────────────────────────────────
describe('formatTime', () => {
  it('formats 0 as 00:00.0', () => {
    expect(formatTime(0)).toBe('00:00.0');
  });

  it('formats 65.3 as 01:05.3', () => {
    expect(formatTime(65.3)).toBe('01:05.3');
  });

  it('handles non-finite as 00:00.0', () => {
    expect(formatTime(NaN)).toBe('00:00.0');
    expect(formatTime(Infinity)).toBe('00:00.0');
  });
});

// ── Integration: store state ─────────────────────────────────
import { useAppStore } from '../stores/appStore';

describe('AppStore', () => {
  it('has initial project set', () => {
    const state = useAppStore.getState();
    expect(state.project).not.toBeNull();
    expect(state.project?.targetLanguage).toBe('km');
  });

  it('has demo segments', () => {
    const state = useAppStore.getState();
    expect(state.segments.length).toBeGreaterThan(0);
    // Ensure Khmer text is present
    expect(state.segments[0].khmText).toContain('AI');
  });

  it('can update segment text', () => {
    const store = useAppStore.getState();
    const id = store.segments[0].id;
    store.updateSegment(id, { khmText: 'ពាក្យសាកល្បង' });
    const updated = useAppStore.getState().segments.find((s) => s.id === id);
    expect(updated?.khmText).toBe('ពាក្យសាកល្បង');
  });

  it('can add and remove a segment', () => {
    const store = useAppStore.getState();
    const before = store.segments.length;
    const newSeg = {
      id: 'test-001',
      episodeId: 'demo',
      index: before,
      startSec: 100,
      endSec: 103,
      originalText: 'Test segment',
      khmText: 'ផ្នែកសាកល្បង',
      speakerName: 'Test',
      voiceProfileId: null,
      emotion: null,
      translationStatus: 'done' as const,
      audioStatus: 'none' as const,
      audioPath: null,
      audioDurationSec: null,
      locked: false,
      confidence: null,
    };
    store.addSegment(newSeg);
    expect(useAppStore.getState().segments.length).toBe(before + 1);
    store.removeSegment('test-001');
    expect(useAppStore.getState().segments.length).toBe(before);
  });

  it('can set AI mode', () => {
    const store = useAppStore.getState();
    store.setAiMode('local-first');
    expect(useAppStore.getState().aiMode).toBe('local-first');
    store.setAiMode('hybrid'); // reset
  });
});

// ── Khmer unicode test ───────────────────────────────────────
describe('Khmer Unicode', () => {
  it('correctly encodes Khmer text', () => {
    const khmer = 'ភាសាខ្មែរ';
    expect(khmer.length).toBeGreaterThan(0);
    // Khmer Unicode range: U+1780–U+17FF
    const codePoint = khmer.codePointAt(0)!;
    expect(codePoint).toBeGreaterThanOrEqual(0x1780);
    expect(codePoint).toBeLessThanOrEqual(0x17FF);
  });
});

// ── Voice Profiles test ──────────────────────────────────────
describe('Voice Profiles and ElevenLabs integration', () => {
  it('has initial voice profiles with George', () => {
    const store = useAppStore.getState();
    expect(store.voiceProfiles.length).toBeGreaterThan(0);
    const george = store.voiceProfiles.find((v) => v.providerVoiceId === 'JBFqnCBsd6RMkjVDRZzb');
    expect(george).toBeDefined();
    expect(george?.provider).toBe('elevenlabs');
  });
});

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { api } from '../services/api';

/** Polls backend health every 10 seconds and updates store */
export function useHealthCheck() {
  const setHealth = useAppStore((s) => s.setHealth);

  const check = useCallback(async () => {
    try {
      const h = await api.health();
      setHealth(h);
    } catch {
      setHealth({ status: 'offline', service: 'local-engine', mode: 'unknown', version: '?', ffmpegAvailable: false, dbConnected: false });
    }
  }, [setHealth]);

  useEffect(() => {
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [check]);
}

/** Polls active jobs every 3 seconds */
export function useJobPolling() {
  const upsertJob = useAppStore((s) => s.upsertJob);

  useEffect(() => {
    const poll = async () => {
      try {
        const { jobs } = await api.getJobs();
        jobs.forEach((j) => upsertJob(j));
      } catch { /* silently skip */ }
    };
    poll();
    const id = setInterval(poll, 3_000);
    return () => clearInterval(id);
  }, [upsertJob]);
}

/** Formats seconds as MM:SS.s */
export function formatTime(sec: number): string {
  if (!isFinite(sec)) return '00:00.0';
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${String(m).padStart(2, '0')}:${s.padStart(4, '0')}`;
}

/** Returns clsx-compatible string. Use instead of importing clsx everywhere */
export function cx(...args: (string | boolean | undefined | null)[]): string {
  return args.filter(Boolean).join(' ');
}

/** Safe debounce hook */
export function useDebounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return useCallback((...args: unknown[]) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]) as T;
}

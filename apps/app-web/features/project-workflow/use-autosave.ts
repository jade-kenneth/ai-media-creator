'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useWorkflow, type SaveStatus } from './workflow-state';

const DEBOUNCE_MS = 800;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

interface AutosaveEngine<Patch> {
  pending: Partial<Patch> | null;
  inFlight: boolean;
  running: Promise<boolean> | null;
  attempt: number;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Debounced autosave for a partial update. Patches merge while waiting or
 * while a save is in flight; `flush` saves immediately (on blur). A failed
 * save keeps its patch and retries three times with backoff before the
 * screen shows “Not saved.” The status feeds the head and the leave guard.
 */
export function useAutosave<Patch extends object>({
  source,
  save,
  enabled = true,
}: {
  source: string;
  save: (patch: Patch) => Promise<unknown>;
  enabled?: boolean;
}) {
  const { reportSave } = useWorkflow();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const engine = useRef<AutosaveEngine<Patch>>({
    pending: null,
    inFlight: false,
    running: null,
    attempt: 0,
    timer: null,
  });
  const latest = useRef({ save, enabled, source, reportSave });

  useEffect(() => {
    latest.current = { save, enabled, source, reportSave };
  }, [enabled, reportSave, save, source]);

  const report = useCallback((next: SaveStatus) => {
    setStatus(next);
    latest.current.reportSave(latest.current.source, next);
  }, []);

  const run = useCallback(
    function runSave(): Promise<boolean> {
      const state = engine.current;

      if (state.inFlight) return state.running ?? Promise.resolve(true);
      if (!state.pending || !latest.current.enabled)
        return Promise.resolve(true);

      const patch = state.pending;
      state.pending = null;
      state.inFlight = true;
      report('saving');

      const running = (async () => {
        try {
          await latest.current.save(patch as Patch);
          state.attempt = 0;
          state.inFlight = false;
          state.running = null;

          if (state.pending) return runSave();

          report('saved');
          return true;
        } catch {
          state.inFlight = false;
          state.running = null;
          state.pending = { ...patch, ...(state.pending ?? {}) };
          report('failed');

          const delay = RETRY_DELAYS_MS[state.attempt];
          state.attempt += 1;

          if (delay !== undefined) {
            state.timer = setTimeout(() => void runSave(), delay);
          }

          return false;
        }
      })();

      state.running = running;
      return running;
    },
    [report],
  );

  const schedule = useCallback(
    (patch: Partial<Patch>) => {
      const state = engine.current;

      state.pending = { ...(state.pending ?? {}), ...patch };
      state.attempt = 0;
      report('saving');

      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => void run(), DEBOUNCE_MS);
    },
    [report, run],
  );

  const flush = useCallback(() => {
    const state = engine.current;

    if (state.timer) clearTimeout(state.timer);
    void run();
  }, [run]);

  /** Saves every queued patch and reports whether the immediate attempt worked. */
  const flushAndWait = useCallback(async (): Promise<boolean> => {
    const state = engine.current;

    if (state.timer) clearTimeout(state.timer);
    return run();
  }, [run]);

  useEffect(() => {
    const state = engine.current;
    const online = () => {
      if (state.pending) void run();
    };

    window.addEventListener('online', online);

    return () => {
      window.removeEventListener('online', online);
      if (state.timer) clearTimeout(state.timer);
      latest.current.reportSave(latest.current.source, 'idle');
    };
  }, [run]);

  return { schedule, flush, flushAndWait, status };
}

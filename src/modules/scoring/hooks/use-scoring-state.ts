'use client';

import { useCallback, useEffect, useState } from 'react';
import { POLL_INTERVAL_MS } from '../constants';
import type { ClassScoringState } from '../types';

/**
 * Seeds from the Server Component's initial read, then polls
 * `/api/scoring/[classId]` every 4s — legacy's own interval, so two people
 * on the same class (a judge and a scribe, or two judges) see each other's
 * marks and panel-readiness without a manual refresh. Paused while the tab
 * isn't visible, matching legacy's `document.hidden` check.
 */
export function useScoringState(classId: string, initialState: ClassScoringState) {
  const [state, setState] = useState(initialState);
  const [isSyncing, setIsSyncing] = useState(false);

  const refetch = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/scoring/${classId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const next = (await res.json()) as ClassScoringState;
      setState(next);
    } catch {
      // A missed poll just tries again next tick — see the mark-write retry
      // banner for the write-side equivalent of this same tolerance.
    } finally {
      setIsSyncing(false);
    }
  }, [classId]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      void refetch();
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [refetch]);

  /** Merge a locally-known-good change in immediately, ahead of the next poll. */
  const applyOptimistic = useCallback((updater: (prev: ClassScoringState) => ClassScoringState) => {
    setState(updater);
  }, []);

  return { state, isSyncing, refetch, applyOptimistic };
}

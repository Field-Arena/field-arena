'use client';

import { useCallback, useEffect, useState } from 'react';
import { POLL_INTERVAL_MS } from '@/modules/scoring/constants';
import type { ClassScoringState } from '@/modules/scoring/types';

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

  const applyOptimistic = useCallback((updater: (prev: ClassScoringState) => ClassScoringState) => {
    setState(updater);
  }, []);

  return { state, isSyncing, refetch, applyOptimistic };
}

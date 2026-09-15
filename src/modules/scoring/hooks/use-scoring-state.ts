'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { POLL_INTERVAL_MS } from '@/modules/scoring/constants';
import type { ClassScoringState } from '@/modules/scoring/types';

// A mark write is debounced (see use-debounced-write.ts) before it's even
// sent, then needs a network round trip on top of that. The periodic poll
// below fires every 4s regardless of that timer, and a poll's *response*
// can land after a local edit even when the *request* went out before it —
// applying a snapshot fetched from before the edit reached the server wipes
// the optimistic value back out, so the mark a judge just entered visibly
// blinks away and only reappears once the *next* poll (or the debounced
// write finally landing) catches up. Discarding a poll response fetched
// too close to a local edit — checked when the response arrives, not just
// when the request was sent — closes that race regardless of which side of
// the request it happens on.
const LOCAL_EDIT_GRACE_MS = 2500;

export function useScoringState(classId: string, initialState: ClassScoringState) {
  const [state, setState] = useState(initialState);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastLocalEditAt = useRef(0);

  const fetchState = useCallback(async (): Promise<ClassScoringState | null> => {
    const res = await fetch(`/api/scoring/${classId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ClassScoringState;
  }, [classId]);

  const refetch = useCallback(async () => {
    setIsSyncing(true);
    try {
      const next = await fetchState();
      if (next) setState(next);
    } catch {
      // A missed poll just tries again next tick — see the mark-write retry
      // banner for the write-side equivalent of this same tolerance.
    } finally {
      setIsSyncing(false);
    }
  }, [fetchState]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      const requestedAt = Date.now();
      setIsSyncing(true);
      fetchState()
        .then((next) => {
          if (!next) return;
          if (lastLocalEditAt.current > requestedAt - LOCAL_EDIT_GRACE_MS) return;
          setState(next);
        })
        .catch(() => {
          // A missed poll just tries again next tick.
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [fetchState]);

  const applyOptimistic = useCallback((updater: (prev: ClassScoringState) => ClassScoringState) => {
    lastLocalEditAt.current = Date.now();
    setState(updater);
  }, []);

  return { state, isSyncing, refetch, applyOptimistic };
}

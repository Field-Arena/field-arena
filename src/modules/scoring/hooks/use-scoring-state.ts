'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  POLL_BACKOFF_FACTOR,
  POLL_INTERVAL_MS,
  POLL_MAX_INTERVAL_MS,
} from '@/modules/scoring/constants';
import type { ClassScoringState } from '@/modules/scoring/types';

// A mark write is debounced (see use-debounced-write.ts) before it's even
// sent, then needs a network round trip on top of that. The periodic poll
// below fires every 4s (or slower when idle) regardless of that timer, and a poll's *response*
// can land after a local edit even when the *request* went out before it —
// applying a snapshot fetched from before the edit reached the server wipes
// the optimistic value back out, so the mark a judge just entered visibly
// blinks away and only reappears once the *next* poll (or the debounced
// write finally landing) catches up. Discarding a poll response fetched
// too close to a local edit — checked when the response arrives, not just
// when the request was sent — closes that race regardless of which side of
// the request it happens on.
const LOCAL_EDIT_GRACE_MS = 2500;

/* Polling cost: every open scoring screen used to hit the API every 4s even
 * when nothing was happening. The poll now
 * - runs at POLL_INTERVAL_MS while the class is changing,
 * - backs off (x1.5, up to POLL_MAX_INTERVAL_MS) while responses come back
 *   unchanged,
 * - snaps back to the base interval on any change or local edit,
 * - stops entirely while the tab is hidden and polls at once when the tab
 *   becomes visible or the window regains focus. */
export function useScoringState(classId: string, initialState: ClassScoringState) {
  const [state, setState] = useState(initialState);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastLocalEditAt = useRef(0);
  const delayRef = useRef(POLL_INTERVAL_MS);
  const lastBodyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<() => void>(() => undefined);

  const fetchState = useCallback(async (): Promise<ClassScoringState | null> => {
    const res = await fetch(`/api/scoring/${classId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.text();
    if (body === lastBodyRef.current) {
      delayRef.current = Math.min(
        Math.round(delayRef.current * POLL_BACKOFF_FACTOR),
        POLL_MAX_INTERVAL_MS,
      );
    } else {
      delayRef.current = POLL_INTERVAL_MS;
      lastBodyRef.current = body;
    }
    return JSON.parse(body) as ClassScoringState;
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
    let cancelled = false;
    let inFlight = false;

    const clearTimer = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const poll = () => {
      timerRef.current = null;
      if (cancelled || inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      const requestedAt = Date.now();
      setIsSyncing(true);
      fetchState()
        .then((next) => {
          if (!next || cancelled) return;
          if (lastLocalEditAt.current > requestedAt - LOCAL_EDIT_GRACE_MS) return;
          setState(next);
        })
        .catch(() => {
          // A missed poll just tries again next tick.
        })
        .finally(() => {
          inFlight = false;
          setIsSyncing(false);
          schedule();
        });
    };

    const schedule = () => {
      clearTimer();
      if (cancelled || inFlight || document.visibilityState !== 'visible') return;
      timerRef.current = setTimeout(poll, delayRef.current);
    };
    scheduleRef.current = schedule;

    // Back on screen: catch up immediately at the live rate.
    const resume = () => {
      if (document.visibilityState !== 'visible') {
        clearTimer();
        return;
      }
      delayRef.current = POLL_INTERVAL_MS;
      clearTimer();
      poll();
    };

    schedule();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
    };
  }, [fetchState]);

  const applyOptimistic = useCallback((updater: (prev: ClassScoringState) => ClassScoringState) => {
    lastLocalEditAt.current = Date.now();
    // Someone is actively scoring — keep the poll at the live rate.
    if (delayRef.current !== POLL_INTERVAL_MS) {
      delayRef.current = POLL_INTERVAL_MS;
      scheduleRef.current();
    }
    setState(updater);
  }, []);

  return { state, isSyncing, refetch, applyOptimistic };
}

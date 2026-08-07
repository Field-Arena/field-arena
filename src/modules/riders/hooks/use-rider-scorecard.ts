'use client';

import { useCallback, useState } from 'react';
import type { RiderScorecard } from '../types';

type ScorecardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; scorecard: RiderScorecard };

/**
 * Fetches one entry's scorecard from `/api/rider/scorecard/[entryId]` on
 * demand — the same "opened from a click, not known at page-render time
 * across every entry" reasoning as scoring module's useScoringState, minus
 * the polling: a scorecard doesn't change while the modal is open.
 */
export function useRiderScorecard() {
  const [state, setState] = useState<ScorecardState>({ status: 'idle' });

  const load = useCallback(async (entryId: string) => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`/api/rider/scorecard/${entryId}`, { cache: 'no-store' });
      if (!res.ok) {
        setState({ status: 'error' });
        return;
      }
      const scorecard = (await res.json()) as RiderScorecard;
      setState({ status: 'loaded', scorecard });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, load, reset };
}

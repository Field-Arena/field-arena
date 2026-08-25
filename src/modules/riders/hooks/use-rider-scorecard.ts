'use client';

import { useCallback, useState } from 'react';
import type { RiderScorecard } from '@/modules/riders/types';

type ScorecardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; scorecard: RiderScorecard };

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

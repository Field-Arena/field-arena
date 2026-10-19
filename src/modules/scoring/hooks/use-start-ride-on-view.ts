'use client';

import { useEffect, useRef } from 'react';
import { useStartRide } from '@/modules/scoring/hooks/use-scoring-mutations';

/**
 * Stamps a ride's start time the first time a panel member / show manager has
 * it in front of them. Replaces the old side effect in the polled GET, which
 * wrote with the admin client for any caller.
 */
export function useStartRideOnView(params: {
  classId: string;
  entryId: string | null;
  rideStartedAt: string | null;
  enabled: boolean;
  onStarted: () => void;
}) {
  const { classId, entryId, rideStartedAt, enabled, onStarted } = params;
  const startRide = useStartRide();
  const requested = useRef<string | null>(null);
  const mutate = startRide.mutate;
  const onStartedRef = useRef(onStarted);

  useEffect(() => {
    onStartedRef.current = onStarted;
  }, [onStarted]);

  useEffect(() => {
    if (!enabled || !entryId || rideStartedAt) return;
    if (requested.current === entryId) return;
    requested.current = entryId;
    mutate(
      { classId, entryId },
      {
        onSuccess: () => {
          onStartedRef.current();
        },
      },
    );
  }, [classId, entryId, rideStartedAt, enabled, mutate]);
}

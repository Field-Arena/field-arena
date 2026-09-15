'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/shared/hooks/use-online-status';
import { onSyncStateChange, startOfflineSync } from './sync-manager';
import { usePeerSync } from './webrtc/use-peer-sync';
import type { PendingWrite } from './db';

/**
 * Starts the background offline-write sync for the scoring screen and
 * reports how many marks are still waiting to reach the server, plus how
 * many other devices scoring the same class it's currently paired with over
 * WebRTC (a fallback delivery path for those marks — see
 * offline/webrtc/relay-transport.ts). Mount this once near the top of the
 * scoring screen.
 */
export function useOfflineSync(classId: string): {
  online: boolean;
  pendingCount: number;
  pairedCount: number;
} {
  const online = useOnlineStatus();
  const [pending, setPending] = useState<PendingWrite[]>([]);
  const { pairedCount } = usePeerSync(classId);

  useEffect(() => {
    const unsubscribe = onSyncStateChange(setPending);
    const stop = startOfflineSync();
    return () => {
      unsubscribe();
      stop();
    };
  }, []);

  const pendingCount = pending.filter((w) => w.classId === classId).length;
  return { online, pendingCount, pairedCount };
}

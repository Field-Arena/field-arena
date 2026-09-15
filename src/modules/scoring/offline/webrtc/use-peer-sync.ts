'use client';

import { useEffect, useState } from 'react';
import { initPeerRelay } from './relay-transport';

/** Mount once on the scoring screen — auto-pairs this device with any other
 * device scoring the same class and keeps that connection available as a
 * fallback delivery path for the offline write queue (see sync-manager.ts). */
export function usePeerSync(classId: string): { pairedCount: number } {
  const [pairedCount, setPairedCount] = useState(0);

  useEffect(() => {
    const stop = initPeerRelay(classId, setPairedCount);
    return stop;
  }, [classId]);

  return { pairedCount };
}

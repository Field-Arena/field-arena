'use client';

import { markRingPacketPrinted } from '@/modules/shows/data/print-center-mutations';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';
import type { MarkRingPacketPrintedInput } from '@/modules/shows/schemas';

export function useMarkRingPacketPrinted() {
  return useRefreshingMutation(
    (input: MarkRingPacketPrintedInput) => markRingPacketPrinted(input),
    { errorFallback: 'Could not record that the ring packet was printed' },
  );
}

import type { VenueStall } from '@/modules/organizations/types';
import { newStallId } from '@/modules/organizations/utils/new-stall-id';

export function resizeStalls(existing: VenueStall[], count: number): VenueStall[] {
  const n = Math.max(0, Math.floor(count) || 0);
  const stalls: VenueStall[] = [];
  for (let i = 0; i < n; i++) {
    const number = i + 1;
    const prior = existing[i];
    stalls.push(
      prior
        ? { ...prior, number }
        : { id: newStallId(), number, label: String(number), closed: false },
    );
  }
  return stalls;
}

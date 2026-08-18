import type { VenueStall } from '@/modules/organizations/types';
import { newStallId } from '@/modules/organizations/utils/new-stall-id';

/**
 * Rebuilds a stable's stall array to a new target count, ported verbatim from
 * legacy's `locStableSetCount`: existing stalls keep their label/closed state
 * *by position* rather than being wiped, so widening a barn never loses
 * stalls that are already named and in use. Shrinking simply drops the tail.
 */
export function resizeStalls(existing: VenueStall[], count: number): VenueStall[] {
  const n = Math.max(0, Math.floor(count) || 0);
  const stalls: VenueStall[] = [];
  for (let i = 0; i < n; i++) {
    const number = i + 1;
    const prior = existing[i];
    stalls.push(
      prior ? { ...prior, number } : { id: newStallId(), number, label: String(number), closed: false },
    );
  }
  return stalls;
}

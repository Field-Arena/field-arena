import type { VenueStall } from './types';

let stallSeq = 0;

/**
 * A locally-unique stall id, ported from legacy's `locStallIdGen` (`'vst'+Date.now()+…`).
 * A monotonic counter is appended instead of `Math.random()` so two stalls
 * created within the same millisecond (a fast double-click on "+ Add stall
 * row", or two calls in the same render) can never collide.
 */
export function newStallId(): string {
  stallSeq += 1;
  return `vst${String(Date.now())}${String(stallSeq)}`;
}

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
    stalls.push(prior ? { ...prior, number } : { id: newStallId(), number, label: String(number), closed: false });
  }
  return stalls;
}

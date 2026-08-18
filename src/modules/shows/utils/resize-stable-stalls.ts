import type { StableChartStall } from '@/modules/shows/data/stable-chart-queries';

/**
 * (Re)builds a stable's stall array to a new target count, ported verbatim
 * from showstaff.html's `generateStableStalls` (~13870): existing stalls
 * keep their label/assignment/closed state *by position*, so widening a
 * stable from 20 to 24 stalls never wipes out the 20 that are already named
 * and occupied — only the trailing stalls are dropped when shrinking.
 *
 * A close template of organizations/utils.ts's `resizeStalls` (imports
 * across module boundaries are not allowed — see that file's own doc
 * comment on why VenueStall isn't reused here either), extended with the
 * horse-occupancy fields a venue's structure-only stall never carries.
 */
export function resizeStableStalls(existing: StableChartStall[], count: number): StableChartStall[] {
  const n = Math.max(0, Math.floor(count) || 0);
  const stalls: StableChartStall[] = [];
  for (let i = 0; i < n; i++) {
    const number = i + 1;
    const prior = existing[i];
    stalls.push(
      prior
        ? { ...prior, number }
        : {
            id: crypto.randomUUID(),
            number,
            label: String(number),
            horseId: null,
            horseName: null,
            riderName: null,
            shavings: 0,
            closed: false,
            isStallion: false,
          }
    );
  }
  return stalls;
}

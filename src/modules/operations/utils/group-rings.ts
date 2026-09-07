import type { RingRow } from '@/modules/announcements/data/queries';

export interface RingBoardCard {
  ring: string;
  current: RingRow | null;
  classCount: number;
}

/* The ops board is a board of RINGS, not of classes — legacy ringState()
 * (showstaff-ops.html:552) dedupes classes down to the arenas they name and
 * shows one card per ring carrying that ring's current class.
 *
 * Listing every class instead turns a 30-class show into a 30-row wall on the
 * one screen that has to be readable at a glance from across a show office.
 *
 * "Current" resolves the same way legacy did: the class actually running,
 * else the next one upcoming, else the last of the day (so a finished ring
 * still reads as finished rather than vanishing). */
export function groupRingsForBoard(rows: RingRow[]): RingBoardCard[] {
  const byRing = new Map<string, RingRow[]>();
  for (const row of rows) {
    const ring = row.ring ?? 'Ring not set';
    byRing.set(ring, [...(byRing.get(ring) ?? []), row]);
  }

  return [...byRing.entries()].map(([ring, list]) => ({
    ring,
    current:
      list.find((r) => r.scoringOpen) ?? list.find((r) => r.position === 0) ?? list.at(-1) ?? null,
    classCount: list.length,
  }));
}

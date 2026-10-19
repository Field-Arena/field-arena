/** A ride is finished once it has been scored, scratched or disqualified. */
export function isRideFinished(ride: { status: string | null; advancedPast: boolean }): boolean {
  return ride.advancedPast || (ride.status ?? 'scheduled') !== 'scheduled';
}

/**
 * The ride in the ring is the first unfinished one in running order (holding
 * entries excluded by the caller). Deriving it from the rides themselves — not
 * from `classes.scoring_pos` as a raw index — keeps it right when ride_order
 * has gaps, starts at 0 (checkout) or 1 (draw), or a later rider was scratched
 * ahead of time. Returns `rides.length` when every ride is finished.
 */
export function resolveCurrentRideIndex(
  rides: readonly { status: string | null; advancedPast: boolean }[],
): number {
  const idx = rides.findIndex((r) => !isRideFinished(r));
  return idx === -1 ? rides.length : idx;
}

/**
 * The rider actually in the ring. During a work-in (classes.working_in_entry_id
 * set) that is the worked-in entry — which may be a holding entry — not the
 * next ride in order. Shared by the judge screen and the announcer so both
 * name the same rider. A work-in pointer to an entry that no longer exists
 * yields null rather than silently falling back to the order.
 */
export function pickRideInRing<T extends { id: string }>(params: {
  workingInEntryId: string | null;
  rides: readonly T[];
  holdingRides: readonly T[];
  pos: number;
}): T | null {
  const { workingInEntryId, rides, holdingRides, pos } = params;
  if (workingInEntryId) {
    return (
      rides.find((r) => r.id === workingInEntryId) ??
      holdingRides.find((r) => r.id === workingInEntryId) ??
      null
    );
  }
  return rides[pos] ?? null;
}

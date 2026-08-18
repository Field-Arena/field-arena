/**
 * Dressage-style shared ranking: an exact tie shares a place and the next
 * place is skipped (1st, 1st, 3rd — no 2nd), ported from
 * showstaff-ops.html's withSharedRank(). `rows` must already be sorted
 * descending by score. Non-numeric scores (SCR/ELIM) carry `finalPctNum:
 * null` and are expected to have been filtered out by the caller before
 * ranking — a null never ties with anything, including another null, so an
 * unfiltered list would rank them arbitrarily.
 */
export function withSharedRank<T extends { finalPctNum: number | null }>(
  rows: T[],
): (T & { place: number })[] {
  let rank = 1;
  let prev: number | null = null;
  return rows.map((row, i) => {
    if (i > 0 && prev !== row.finalPctNum) rank = i + 1;
    prev = row.finalPctNum;
    return { ...row, place: rank };
  });
}

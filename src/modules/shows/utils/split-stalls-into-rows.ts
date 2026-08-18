/**
 * Splits one stable's stalls into `rowCount` even-ish rows for the grid
 * display, ported verbatim from showstaff.html's `splitStallsIntoRows`
 * (~13998).
 */
export function splitStallsIntoRows<T>(stalls: T[], rowCount: number): T[][] {
  const rc = Math.max(1, Math.floor(rowCount) || 1);
  const perRow = Math.max(1, Math.ceil(stalls.length / rc));
  const out: T[][] = [];
  for (let i = 0; i < stalls.length; i += perRow) out.push(stalls.slice(i, i + perRow));
  return out;
}

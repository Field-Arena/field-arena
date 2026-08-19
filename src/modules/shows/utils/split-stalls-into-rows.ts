export function splitStallsIntoRows<T>(stalls: T[], rowCount: number): T[][] {
  const rc = Math.max(1, Math.floor(rowCount) || 1);
  const perRow = Math.max(1, Math.ceil(stalls.length / rc));
  const out: T[][] = [];
  for (let i = 0; i < stalls.length; i += perRow) out.push(stalls.slice(i, i + perRow));
  return out;
}

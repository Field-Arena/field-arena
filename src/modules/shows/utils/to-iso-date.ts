/** Local-date parts back to 'YYYY-MM-DD' — not toISOString(), which converts to UTC and lands on the wrong calendar day for any server/viewer timezone ahead of UTC (e.g. a local-midnight Sep 19 in PKT, UTC+5, is Sep 18 in UTC). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${day}`;
}

/**
 * "08:00" (24h, from the `classes.time` column) → "8:00 AM". Falls back to
 * the raw value when it doesn't match — same fallback showstaff-ops.html's
 * own fmtTimeLabel used for a time already stored in a display format.
 */
export function fmtTimeLabel(time: string | null): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const minutes = m[2] ?? '00';
  let h = Number(m[1] ?? '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h)}:${minutes} ${ampm}`;
}

/**
 * Date formatting for the ISO 'YYYY-MM-DD' text columns this schema uses.
 *
 * Ported from FA.fmtDate in the legacy public/assets/app.js, which built
 * `new Date(iso + 'T00:00:00')`. That appended-time detail is deliberate and
 * preserved: `new Date('2026-07-10')` is parsed as UTC midnight, which renders
 * as the 9th of July for any viewer west of Greenwich — so a show's start date
 * would silently display one day early for every user in the Americas.
 * Appending a bare time forces local-time interpretation instead.
 */
export function formatShowDate(iso: string | null | undefined): string {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Compact form for dense tables: "Jul 10, 2026". */
export function formatDateShort(iso: string | null | undefined): string {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * A timestamptz from the database, rendered with both date and time. Unlike the
 * date-only columns above these are real instants, so no parsing workaround is
 * needed.
 */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Whether a date-only string is in the past. Used for document expiry, where
 * "expired" must be judged against the viewer's own day rather than UTC — a
 * Coggins certificate expiring today is still valid today.
 */
export function isPast(iso: string | null | undefined): boolean {
  const date = parseIsoDate(iso);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

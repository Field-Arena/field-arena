export function formatShowDate(iso: string | null | undefined): string {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);

  if (!start) return end ? formatDateShort(endIso) : '';
  if (!end || start.getTime() === end.getTime()) return formatDateShort(startIso);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = start.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${String(start.getDate())}–${String(end.getDate())}, ${String(end.getFullYear())}`;
  }
  if (sameYear) {
    const left = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const right = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${left} – ${right}, ${String(end.getFullYear())}`;
  }
  return `${formatDateShort(startIso)} – ${formatDateShort(endIso)}`;
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

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

/** "Just now", "12 min ago", "3 hours ago", "Yesterday", "4 days ago", then a date. */
export function formatRelative(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return '';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '';
  const minutes = Math.round((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${String(minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${String(hours)} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${String(days)} days ago`;
  return formatDateShort(value.slice(0, 10));
}

/** Today's date (or `date`'s) as YYYY-MM-DD in local time — not UTC, which
 * rolls over to tomorrow during the evening in the Americas. */
export function localIsoDate(date: Date = new Date()): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

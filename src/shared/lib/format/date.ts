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

export function formatDateShort(iso: string | null | undefined): string {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
    const month = start.toLocaleDateString(undefined, { month: 'short' });
    return `${month} ${String(start.getDate())}–${String(end.getDate())}, ${String(end.getFullYear())}`;
  }
  if (sameYear) {
    const left = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const right = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${left} – ${right}, ${String(end.getFullYear())}`;
  }
  return `${formatDateShort(startIso)} – ${formatDateShort(endIso)}`;
}

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

/* Shared labels and colours for the organizer dashboard (home + show view). */

export const STAGE_LABEL: Record<string, string> = {
  setup: 'Setup',
  'sales-open': 'Entries open',
  'sales-closed': 'Entries closed',
  live: 'Live',
  complete: 'Complete',
};

export function whenLabel(daysOut: number | null): string | null {
  if (daysOut === null) return null;
  if (daysOut <= 0) return 'Running now';
  return daysOut === 1 ? 'tomorrow' : `in ${String(daysOut)} days`;
}

/* Owner's colour scale for how much of a requirement is approved:
 * 50% or less red, 51–75% yellow, 76–90% light green, over 90% dark green.
 * Text uses a darker shade of each so it stays readable on white. */
export function approvalTone(pct: number | null): { text: string; bar: string } {
  if (pct === null) return { text: 'text-[#5A6B63]', bar: 'bg-[#EDF0EE]' };
  if (pct <= 50) return { text: 'text-[#B4432F]', bar: 'bg-[#B4432F]' };
  if (pct <= 75) return { text: 'text-[#9A6B00]', bar: 'bg-[#E0A800]' };
  if (pct <= 90) return { text: 'text-[#3E8E5A]', bar: 'bg-[#6CC08B]' };
  return { text: 'text-[#1A5B3C]', bar: 'bg-[#1A5B3C]' };
}

export const percent = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 100) : null;

/* 'YYYY-MM-DD' (optionally followed by a time) → 'Oct 15'. */
export function shortDate(value: string | null): string | null {
  const iso = value?.slice(0, 10);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

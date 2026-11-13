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

export { approvalTone } from '@/shared/ui/organizer/approval-tone';

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

import { SHOW_STAGES } from '@/shared/constants/show-stages';
import { formatDateShort } from '@/shared/lib/format/date';
import { SHOW_LIST_GROUPS } from '../constants';
import type { ShowCompleteness, ShowListGroup, ShowListRow, ShowPickerSummary } from '../types';

function groupFor(show: ShowPickerSummary): ShowListGroup {
  if (show.stage === 'complete') return 'finished';
  if (show.stage === 'live') return 'live';
  if (show.published) return 'published';
  return 'setup';
}

// Live shows go straight to running them; published ones open on Run Show
// (as before); shows still in setup continue where setup left off.
function primaryFor(ref: string, group: ShowListGroup) {
  if (group === 'live') return { label: 'Run', href: `/dashboard/shows/${ref}/run-show` };
  if (group === 'setup') return { label: 'Continue', href: `/dashboard/shows/${ref}` };
  return { label: 'Open', href: `/dashboard/shows/${ref}/run-show` };
}

export function toShowListRow(
  show: ShowPickerSummary,
  completeness: ShowCompleteness,
): ShowListRow {
  const ref = show.slug ?? show.id;
  const items = completeness.sections.flatMap((s) => s.items);
  const done = items.filter((i) => i.ok).length;
  const setupPct = completeness.complete
    ? 100
    : items.length > 0
      ? Math.round((done / items.length) * 100)
      : null;
  const group = groupFor(show);

  return {
    id: show.id,
    ref,
    name: show.name,
    when: show.dateLabel ?? (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD'),
    venueName: show.venueName,
    published: show.published,
    stage: show.stage,
    stageLabel: SHOW_STAGES.find((s) => s.key === show.stage)?.label ?? 'Setup',
    group,
    setupPct,
    setupComplete: completeness.complete,
    toFinish: completeness.complete ? 0 : items.length - done,
    primary: primaryFor(ref, group),
    completeness,
  };
}

export interface ShowListSection {
  key: ShowListGroup;
  label: string;
  rows: ShowListRow[];
}

/** Rows matching `filter` ('all' or one group) and `query` (name, venue or
 * date text), split into the display groups. Empty groups are dropped; rows
 * keep the query's start-date order. */
export function buildShowListSections(
  rows: ShowListRow[],
  filter: ShowListGroup | 'all',
  query: string,
): ShowListSection[] {
  const needle = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (filter === 'all' || r.group === filter) &&
      (!needle ||
        [r.name, r.venueName ?? '', r.when].some((f) => f.toLowerCase().includes(needle))),
  );
  return SHOW_LIST_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    rows: visible.filter((r) => r.group === g.key),
  })).filter((s) => s.rows.length > 0);
}

export function countShowListGroups(rows: ShowListRow[]): Record<ShowListGroup, number> {
  const counts: Record<ShowListGroup, number> = { live: 0, published: 0, setup: 0, finished: 0 };
  for (const r of rows) counts[r.group] += 1;
  return counts;
}

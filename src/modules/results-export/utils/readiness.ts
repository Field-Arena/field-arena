import type { ExportEntry, ExportInput } from '../types';

export type ReadinessState = 'done' | 'warn' | 'todo';

export type ReadinessKey =
  'comp-id' | 'section-codes' | 'scored' | 'rider-usef' | 'horse-usef' | 'owner' | 'judge-usef';

export interface ReadinessItem {
  key: ReadinessKey;
  label: string;
  state: ReadinessState;
  /** Plain-language progress, e.g. "4 of 6 classes". */
  detail: string;
}

const has = (value: string | null | undefined) => (value ?? '').trim() !== '';

/* Counts something once per person or horse, taking the best entry we have
 * for them: if any of their rows has the value, they count as having it. */
function countDistinct(
  entries: readonly ExportEntry[],
  key: (e: ExportEntry) => string,
  ok: (e: ExportEntry) => boolean,
): { have: number; total: number } {
  const seen = new Map<string, boolean>();
  for (const e of entries) {
    const k = key(e);
    seen.set(k, (seen.get(k) ?? false) || ok(e));
  }
  let have = 0;
  for (const v of seen.values()) if (v) have += 1;
  return { have, total: seen.size };
}

function stateFor(have: number, total: number, partial: ReadinessState): ReadinessState {
  if (total === 0 || have >= total) return 'done';
  return have === 0 ? 'todo' : partial;
}

/* The "Ready to send to USEF?" checklist for the post-show report. */
export function computeUsefReadiness(input: ExportInput): ReadinessItem[] {
  const { show, classes, entries } = input;
  const items: ReadinessItem[] = [];

  items.push({
    key: 'comp-id',
    label: 'USEF competition ID entered',
    state: has(show.usefCompId) ? 'done' : 'todo',
    detail: has(show.usefCompId) ? (show.usefCompId ?? '') : 'not entered',
  });

  const withRides = new Set(entries.map((e) => e.classId));
  const rideClasses = classes.filter((c) => withRides.has(c.id));
  const coded = rideClasses.filter((c) => has(c.sectionCode)).length;
  items.push({
    key: 'section-codes',
    label: 'Section codes',
    state: stateFor(coded, rideClasses.length, 'todo'),
    detail: `${String(coded)} of ${String(rideClasses.length)} classes`,
  });

  const rides = entries.filter((e) => e.status !== 'scratched' && e.finalPct !== 'SCR');
  const scored = rides.filter(
    (e) => e.status === 'scored' || e.status === 'disqualified' || e.finalPct === 'ELIM',
  ).length;
  items.push({
    key: 'scored',
    label: 'Every ride scored',
    state: stateFor(scored, rides.length, 'warn'),
    detail: `${String(scored)} of ${String(rides.length)}`,
  });

  const riders = countDistinct(
    entries,
    (e) => e.riderKey,
    (e) => has(e.rider.usef) || has(e.rider.noUsefReason),
  );
  items.push({
    key: 'rider-usef',
    label: 'Rider USEF numbers',
    state: stateFor(riders.have, riders.total, 'warn'),
    detail: `${String(riders.have)} of ${String(riders.total)}`,
  });

  const horses = countDistinct(
    entries,
    (e) => e.horseKey,
    (e) => has(e.horse.usef),
  );
  items.push({
    key: 'horse-usef',
    label: 'Horse USEF numbers',
    state: stateFor(horses.have, horses.total, 'warn'),
    detail: `${String(horses.have)} of ${String(horses.total)}`,
  });

  const owners = countDistinct(
    entries,
    (e) => e.horseKey,
    (e) => has(e.owner.fallbackName) && (has(e.owner.usef) || has(e.owner.noUsefReason)),
  );
  items.push({
    key: 'owner',
    label: 'Owner details',
    state: stateFor(owners.have, owners.total, 'todo'),
    detail: `${String(owners.have)} of ${String(owners.total)} horses`,
  });

  const judges = new Map<string, boolean>();
  for (const cls of classes) {
    if (!withRides.has(cls.id)) continue;
    for (const j of cls.judges) {
      const k = `${j.firstName} ${j.lastName}`.trim().toLowerCase();
      judges.set(k, (judges.get(k) ?? false) || has(j.usefId));
    }
  }
  const judgesWith = [...judges.values()].filter(Boolean).length;
  items.push({
    key: 'judge-usef',
    label: 'Judge USEF IDs',
    state: stateFor(judgesWith, judges.size, 'todo'),
    detail: `${String(judgesWith)} of ${String(judges.size)} judges`,
  });

  return items;
}

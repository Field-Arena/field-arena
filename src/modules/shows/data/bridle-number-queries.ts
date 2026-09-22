import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger, reconcileShowEntries } from '@/modules/shows/data/entry-numbering';

export interface NumberRangeRow {
  id: string;
  rangeStart: number;
  rangeEnd: number;
  label: string | null;
  total: number;
  assigned: number;
  available: number;
  unavailable: number;
}

export interface UnavailableNumberRow {
  number: number;
  reason: string | null;
}

export interface WaitingHorseRow {
  showHorseId: string;
  horseName: string;
}

export interface BridleNumberChangeRow {
  id: string;
  showHorseId: string;
  horseName: string;
  oldNumber: string | null;
  newNumber: string | null;
  reason: string | null;
  changedAt: string;
}

export interface BridleNumberPoolStatus {
  showId: string;
  showName: string;
  ranges: NumberRangeRow[];
  counts: { available: number; assigned: number; unavailable: number };
  unavailableNumbers: UnavailableNumberRow[];
  waitingHorses: WaitingHorseRow[];
  recentChanges: BridleNumberChangeRow[];
}

type NumberStatus = 'available' | 'assigned' | 'unavailable';

export async function getBridleNumberPoolStatus(showId: string): Promise<BridleNumberPoolStatus | null> {
  await assertCanManageEntryLedger(showId);
  await reconcileShowEntries(showId);

  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const [
    { data: ranges, error: rangesError },
    { data: numbers, error: numbersError },
    { data: waiting, error: waitingError },
    { data: changes, error: changesError },
  ] = await Promise.all([
    supabase
      .from('show_number_ranges')
      .select('id, range_start, range_end, label')
      .eq('show_id', showId)
      .order('range_start'),
    supabase
      .from('show_bridle_numbers')
      .select('number, status, source_range_id, unavailable_reason')
      .eq('show_id', showId),
    supabase
      .from('show_horses')
      .select('id, horse_name')
      .eq('show_id', showId)
      .is('bridle_number', null)
      .order('horse_name'),
    supabase
      .from('bridle_number_changes')
      .select('id, show_horse_id, old_number, new_number, reason, changed_at')
      .eq('show_id', showId)
      .order('changed_at', { ascending: false })
      .limit(25),
  ]);
  if (rangesError) throw rangesError;
  if (numbersError) throw numbersError;
  if (waitingError) throw waitingError;
  if (changesError) throw changesError;

  const bucketByRange = new Map<
    string,
    { total: number; available: number; assigned: number; unavailable: number }
  >();
  const counts = { available: 0, assigned: 0, unavailable: 0 };
  const unavailableNumbers: UnavailableNumberRow[] = [];

  for (const n of numbers) {
    const status = n.status as NumberStatus;
    counts[status] += 1;
    if (status === 'unavailable') {
      unavailableNumbers.push({ number: n.number, reason: n.unavailable_reason });
    }
    if (n.source_range_id) {
      const bucket = bucketByRange.get(n.source_range_id) ?? {
        total: 0,
        available: 0,
        assigned: 0,
        unavailable: 0,
      };
      bucket.total += 1;
      bucket[status] += 1;
      bucketByRange.set(n.source_range_id, bucket);
    }
  }
  unavailableNumbers.sort((a, b) => a.number - b.number);

  const rangeRows: NumberRangeRow[] = ranges.map((r) => {
    const bucket = bucketByRange.get(r.id) ?? { total: 0, available: 0, assigned: 0, unavailable: 0 };
    return {
      id: r.id,
      rangeStart: r.range_start,
      rangeEnd: r.range_end,
      label: r.label,
      ...bucket,
    };
  });

  const waitingHorses: WaitingHorseRow[] = waiting.map((h) => ({
    showHorseId: h.id,
    horseName: h.horse_name,
  }));

  const changeHorseIds = [...new Set(changes.map((c) => c.show_horse_id))];
  const { data: changeHorses, error: changeHorsesError } = changeHorseIds.length
    ? await supabase.from('show_horses').select('id, horse_name').in('id', changeHorseIds)
    : { data: [] as { id: string; horse_name: string }[], error: null };
  if (changeHorsesError) throw changeHorsesError;
  const horseNameById = new Map(changeHorses.map((h) => [h.id, h.horse_name]));

  const recentChanges: BridleNumberChangeRow[] = changes.map((c) => ({
    id: c.id,
    showHorseId: c.show_horse_id,
    horseName: horseNameById.get(c.show_horse_id) ?? '—',
    oldNumber: c.old_number,
    newNumber: c.new_number,
    reason: c.reason,
    changedAt: c.changed_at,
  }));

  return {
    showId: show.id,
    showName: show.name,
    ranges: rangeRows,
    counts,
    unavailableNumbers,
    waitingHorses,
    recentChanges,
  };
}

/* Powers the manual-pick list in the assign/replace dialog — every number
 * currently available across every range, lowest first (the same order
 * auto-assign would claim from). */
export async function listAvailableBridleNumbers(showId: string): Promise<number[]> {
  await assertCanManageEntryLedger(showId);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('show_bridle_numbers')
    .select('number')
    .eq('show_id', showId)
    .eq('status', 'available')
    .order('number');
  if (error) throw error;

  return data.map((r) => r.number);
}

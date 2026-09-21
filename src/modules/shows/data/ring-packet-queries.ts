import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';

export interface RingPacketRide {
  entryId: string;
  num: string;
  riderName: string;
  horse: string | null;
  rideOrder: number | null;
}

export interface RingPacketClass {
  classId: string;
  classLabel: string;
  division: string | null;
  location: string | null;
  date: string | null;
  testName: string | null;
  testEdition: string | null;
  rides: RingPacketRide[];
  ringPacketPrintedAt: string | null;
  needsReprint: boolean;
}

export interface RingPacketPageData {
  showId: string;
  showName: string;
  classes: RingPacketClass[];
}

export async function getRingPacketData(showId: string): Promise<RingPacketPageData | null> {
  await assertCanManageEntryLedger(showId);

  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(
      'id, label, display_name, division, location, date, schedule_updated_at, ring_packet_printed_at',
    )
    .eq('show_id', showId);
  if (classesError) throw classesError;

  if (classes.length === 0) return { showId: show.id, showName: show.name, classes: [] };

  const classIds = classes.map((c) => c.id);

  const [{ data: tests, error: testsError }, { data: entries, error: entriesError }] =
    await Promise.all([
      supabase.from('class_tests').select('class_id, name, edition').in('class_id', classIds),
      supabase
        .from('class_entries')
        .select('id, class_id, num, rider, rider_id, horse, ride_order, status, updated_at')
        .in('class_id', classIds)
        .neq('status', 'scratched')
        .order('ride_order'),
    ]);
  if (testsError) throw testsError;
  if (entriesError) throw entriesError;

  const testByClass = new Map(tests.map((t) => [t.class_id, t]));

  // entry.rider is a denormalized text snapshot that can be blank for a real
  // account — same fallback chain used in getShowResults (queries.ts).
  const riderIds = [...new Set(entries.map((e) => e.rider_id).filter((id): id is string => !!id))];
  const { data: riderRows, error: ridersError } = riderIds.length
    ? await supabase.from('riders').select('id, first_name, last_name, email').in('id', riderIds)
    : { data: [], error: null };
  if (ridersError) throw ridersError;
  const riderById = new Map(riderRows.map((r) => [r.id, r]));

  function resolveRiderName(e: { rider: string | null; rider_id: string | null }): string {
    const riderRow = e.rider_id ? riderById.get(e.rider_id) : undefined;
    const fromAccount = riderRow
      ? [riderRow.first_name, riderRow.last_name].filter(Boolean).join(' ')
      : '';
    return [fromAccount, e.rider, riderRow?.email].find((v) => v?.trim()) ?? '—';
  }

  const ridesByClass = new Map<string, typeof entries>();
  const maxEntryUpdatedAtByClass = new Map<string, string>();
  for (const e of entries) {
    const list = ridesByClass.get(e.class_id) ?? [];
    list.push(e);
    ridesByClass.set(e.class_id, list);
    if (e.updated_at) {
      const cur = maxEntryUpdatedAtByClass.get(e.class_id);
      if (!cur || e.updated_at > cur) maxEntryUpdatedAtByClass.set(e.class_id, e.updated_at);
    }
  }

  const result: RingPacketClass[] = classes.map((cls) => {
    const test = testByClass.get(cls.id);
    const rides: RingPacketRide[] = (ridesByClass.get(cls.id) ?? []).map((e) => ({
      entryId: e.id,
      num: e.num,
      riderName: resolveRiderName(e),
      horse: e.horse,
      rideOrder: e.ride_order,
    }));

    const printedAt = cls.ring_packet_printed_at;
    const lastChanged =
      [cls.schedule_updated_at, maxEntryUpdatedAtByClass.get(cls.id) ?? null]
        .filter((v): v is string => !!v)
        .sort()
        .at(-1) ?? null;
    const needsReprint = !printedAt || (lastChanged !== null && lastChanged > printedAt);

    return {
      classId: cls.id,
      classLabel: cls.display_name ?? cls.label,
      division: cls.division,
      location: cls.location,
      date: cls.date,
      testName: test?.name ?? null,
      testEdition: test?.edition ?? null,
      rides,
      ringPacketPrintedAt: printedAt,
      needsReprint,
    };
  });

  result.sort((a, b) => a.classLabel.localeCompare(b.classLabel));

  return { showId: show.id, showName: show.name, classes: result };
}

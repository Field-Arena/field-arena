import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger, reconcileShowEntries } from '@/modules/shows/data/entry-numbering';
import { getHorsesPageData, type HorseRow } from '@/modules/shows/data/horses-queries';
import type { SHOW_ENTRY_STATUSES } from '@/modules/shows/constants';

export type ShowEntryStatus = (typeof SHOW_ENTRY_STATUSES)[number];

export type DocumentRollupStatus = 'complete' | 'needs_attention' | 'missing';

export interface EntryLedgerRow {
  showEntryId: string;
  showHorseId: string;
  entryNumber: string;
  bridleNumber: string;
  backNumber: string | null;
  riderName: string;
  riderId: string | null;
  horseName: string;
  horseId: string | null;
  classes: string[];
  status: ShowEntryStatus;
  fees: number;
  amountPaid: number;
  balance: number;
  documentStatus: DocumentRollupStatus;
  openIssueCount: number;
}

export interface EntryLedgerPageData {
  showId: string;
  showName: string;
  rows: EntryLedgerRow[];
}

interface OrderItemLike {
  kind?: string;
  classId?: string;
  amount?: number;
}

function horseRowKey(horseId: string | null, horseName: string): string {
  return horseId ?? `name:${horseName}`;
}

export async function getEntryLedgerPageData(showId: string): Promise<EntryLedgerPageData | null> {
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

  const [{ data: entries, error: entriesError }, horsesData] = await Promise.all([
    supabase
      .from('show_entries')
      .select('id, entry_number, back_number, status, rider_id, rider_name, show_horse_id')
      .eq('show_id', showId),
    getHorsesPageData(showId),
  ]);
  if (entriesError) throw entriesError;

  if (entries.length === 0) return { showId: show.id, showName: show.name, rows: [] };

  const showHorseIds = [...new Set(entries.map((e) => e.show_horse_id))];
  const { data: showHorses, error: horsesError } = await supabase
    .from('show_horses')
    .select('id, horse_id, horse_name, bridle_number')
    .in('id', showHorseIds);
  if (horsesError) throw horsesError;
  const showHorseById = new Map(showHorses.map((h) => [h.id, h]));

  const showEntryIds = entries.map((e) => e.id);
  const { data: classEntries, error: classEntriesError } = await supabase
    .from('class_entries')
    .select('id, class_id, order_id, show_entry_id')
    .in('show_entry_id', showEntryIds);
  if (classEntriesError) throw classEntriesError;

  const classIds = [...new Set(classEntries.map((c) => c.class_id))];
  const { data: classes, error: classesError } = classIds.length
    ? await supabase.from('classes').select('id, label, display_name, fee').in('id', classIds)
    : { data: [], error: null };
  if (classesError) throw classesError;
  const classById = new Map(classes.map((c) => [c.id, c]));

  const orderIds = [...new Set(classEntries.map((c) => c.order_id).filter((id): id is string => !!id))];
  const { data: orders, error: ordersError } = orderIds.length
    ? await supabase.from('orders').select('id, status, items').in('id', orderIds)
    : { data: [], error: null };
  if (ordersError) throw ordersError;
  const orderById = new Map(orders.map((o) => [o.id, o]));

  const { data: openIssues, error: issuesError } = await supabase
    .from('entry_issues')
    .select('show_entry_id')
    .eq('show_id', showId)
    .eq('status', 'open');
  if (issuesError) throw issuesError;
  const openIssueCountByEntry = new Map<string, number>();
  for (const row of openIssues) {
    openIssueCountByEntry.set(row.show_entry_id, (openIssueCountByEntry.get(row.show_entry_id) ?? 0) + 1);
  }

  const horseRowByKey = new Map<string, HorseRow>();
  for (const row of horsesData?.rows ?? []) {
    horseRowByKey.set(row.key, row);
  }

  const entriesByShowEntryId = new Map<string, typeof classEntries>();
  for (const ce of classEntries) {
    if (!ce.show_entry_id) continue;
    const list = entriesByShowEntryId.get(ce.show_entry_id) ?? [];
    list.push(ce);
    entriesByShowEntryId.set(ce.show_entry_id, list);
  }

  const rows: EntryLedgerRow[] = entries.map((entry) => {
    const showHorse = showHorseById.get(entry.show_horse_id);
    const horseId = showHorse?.horse_id ?? null;
    const horseName = showHorse?.horse_name ?? '—';
    const myClassEntries = entriesByShowEntryId.get(entry.id) ?? [];

    const classLabels: string[] = [];
    let fees = 0;
    let amountPaid = 0;
    for (const ce of myClassEntries) {
      const cls = classById.get(ce.class_id);
      if (cls) {
        classLabels.push(cls.display_name ?? cls.label);
        fees += cls.fee ?? 0;
      }
      if (ce.order_id) {
        const order = orderById.get(ce.order_id);
        if (order?.status === 'paid') {
          const items = (order.items ?? []) as unknown as OrderItemLike[];
          for (const item of items) {
            if (item.kind === 'class_entry' && item.classId === ce.class_id) {
              amountPaid += item.amount ?? 0;
            }
          }
        }
      }
    }

    const horseRow = horseRowByKey.get(horseRowKey(horseId, horseName));
    const documentStatus: DocumentRollupStatus = !horseRow
      ? 'missing'
      : horseRow.complete
        ? 'complete'
        : horseRow.missingLabels.length > 0
          ? 'missing'
          : 'needs_attention';

    return {
      showEntryId: entry.id,
      showHorseId: entry.show_horse_id,
      entryNumber: entry.entry_number,
      bridleNumber: showHorse?.bridle_number ?? '—',
      backNumber: entry.back_number,
      riderName: entry.rider_name,
      riderId: entry.rider_id,
      horseName,
      horseId,
      classes: classLabels.sort((a, b) => a.localeCompare(b)),
      status: entry.status as ShowEntryStatus,
      fees,
      amountPaid,
      balance: Math.max(0, fees - amountPaid),
      documentStatus,
      openIssueCount: openIssueCountByEntry.get(entry.id) ?? 0,
    };
  });

  rows.sort((a, b) => a.entryNumber.localeCompare(b.entryNumber, undefined, { numeric: true }));

  return { showId: show.id, showName: show.name, rows };
}

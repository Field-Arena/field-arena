import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger, reconcileShowEntries } from '@/modules/shows/data/entry-numbering';
import { getHorsesPageData, type HorseRow } from '@/modules/shows/data/horses-queries';
import type { SHOW_ENTRY_STATUSES } from '@/modules/shows/constants';

export type ShowEntryStatus = (typeof SHOW_ENTRY_STATUSES)[number];

export type DocumentRollupStatus = 'complete' | 'needs_attention' | 'missing';

export interface EntryDetailClassLine {
  classId: string;
  classLabel: string;
  fee: number;
}

export interface EntryDetailDocument {
  requirementId: string;
  label: string;
  status: string;
  expirationDate: string | null;
}

export interface EntryDetailIssue {
  id: string;
  kind: string;
  message: string;
  detail: string | null;
  status: string;
}

export interface EntryLedgerRow {
  showEntryId: string;
  showHorseId: string;
  entryNumber: string;
  bridleNumber: string | null;
  backNumber: string | null;
  riderName: string;
  riderId: string | null;
  horseName: string;
  horseId: string | null;
  classes: string[];
  classLines: EntryDetailClassLine[];
  status: ShowEntryStatus;
  fees: number;
  amountPaid: number;
  balance: number;
  documentStatus: DocumentRollupStatus;
  documents: EntryDetailDocument[];
  openIssueCount: number;
  issues: EntryDetailIssue[];
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

  const [
    { data: entries, error: entriesError },
    horsesData,
    { data: openIssues, error: issuesError },
  ] = await Promise.all([
    supabase
      .from('show_entries')
      .select('id, entry_number, back_number, status, rider_id, rider_name, show_horse_id')
      .eq('show_id', showId),
    getHorsesPageData(showId),
    // Filters only on show_id/status -- no dependency on entries, so it runs
    // alongside them instead of waiting for the whole chain below.
    supabase
      .from('entry_issues')
      .select('id, show_entry_id, kind, message, detail, status')
      .eq('show_id', showId)
      .eq('status', 'open'),
  ]);
  if (entriesError) throw entriesError;
  if (issuesError) throw issuesError;

  if (entries.length === 0) return { showId: show.id, showName: show.name, rows: [] };

  const showHorseIds = [...new Set(entries.map((e) => e.show_horse_id))];
  const showEntryIds = entries.map((e) => e.id);

  // show_horses and class_entries both depend only on `entries`, not on each
  // other -- fetch together instead of one after the other.
  const [
    { data: showHorses, error: horsesError },
    { data: classEntries, error: classEntriesError },
  ] = await Promise.all([
    supabase
      .from('show_horses')
      .select('id, horse_id, horse_name, bridle_number')
      .in('id', showHorseIds),
    supabase
      .from('class_entries')
      .select('id, class_id, order_id, show_entry_id')
      .in('show_entry_id', showEntryIds),
  ]);
  if (horsesError) throw horsesError;
  if (classEntriesError) throw classEntriesError;
  const showHorseById = new Map(showHorses.map((h) => [h.id, h]));

  const classIds = [...new Set(classEntries.map((c) => c.class_id))];
  const orderIds = [...new Set(classEntries.map((c) => c.order_id).filter((id): id is string => !!id))];

  // classes and orders both depend only on `classEntries`, not on each
  // other -- fetch together instead of one after the other.
  const [
    { data: classes, error: classesError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    classIds.length
      ? supabase.from('classes').select('id, label, display_name, fee').in('id', classIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length
      ? supabase.from('orders').select('id, status, items').in('id', orderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (classesError) throw classesError;
  if (ordersError) throw ordersError;
  const classById = new Map(classes.map((c) => [c.id, c]));
  const orderById = new Map(orders.map((o) => [o.id, o]));

  const openIssueCountByEntry = new Map<string, number>();
  const issuesByEntry = new Map<string, EntryDetailIssue[]>();
  for (const row of openIssues) {
    openIssueCountByEntry.set(row.show_entry_id, (openIssueCountByEntry.get(row.show_entry_id) ?? 0) + 1);
    const list = issuesByEntry.get(row.show_entry_id) ?? [];
    list.push({ id: row.id, kind: row.kind, message: row.message, detail: row.detail, status: row.status });
    issuesByEntry.set(row.show_entry_id, list);
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
    const classLines: EntryDetailClassLine[] = [];
    let fees = 0;
    let amountPaid = 0;
    for (const ce of myClassEntries) {
      const cls = classById.get(ce.class_id);
      if (cls) {
        const label = cls.display_name ?? cls.label;
        classLabels.push(label);
        classLines.push({ classId: cls.id, classLabel: label, fee: cls.fee ?? 0 });
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
      bridleNumber: showHorse?.bridle_number ?? null,
      backNumber: entry.back_number,
      riderName: entry.rider_name,
      riderId: entry.rider_id,
      horseName,
      horseId,
      classes: classLabels.sort((a, b) => a.localeCompare(b)),
      classLines: classLines.sort((a, b) => a.classLabel.localeCompare(b.classLabel)),
      status: entry.status as ShowEntryStatus,
      fees,
      amountPaid,
      balance: Math.max(0, fees - amountPaid),
      documentStatus,
      documents: (horseRow?.documents ?? []).map((d) => ({
        requirementId: d.requirementId,
        label: d.label,
        status: d.status,
        expirationDate: d.expirationDate,
      })),
      openIssueCount: openIssueCountByEntry.get(entry.id) ?? 0,
      issues: issuesByEntry.get(entry.id) ?? [],
    };
  });

  rows.sort((a, b) => a.entryNumber.localeCompare(b.entryNumber, undefined, { numeric: true }));

  return { showId: show.id, showName: show.name, rows };
}

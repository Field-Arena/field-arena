import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger, reconcileShowEntries } from '@/modules/shows/data/entry-numbering';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { REJECTION_REASON_LABELS, MEMBERSHIP_FLAG_LABELS } from '@/modules/shows/constants';
import type { ENTRY_ISSUE_KINDS } from '@/modules/shows/constants';

export type EntryIssueKind = (typeof ENTRY_ISSUE_KINDS)[number];

export interface EntryIssueRow {
  id: string;
  showEntryId: string;
  entryNumber: string;
  bridleNumber: string;
  riderName: string;
  horseName: string;
  kind: EntryIssueKind;
  message: string;
  detail: string | null;
  status: 'open' | 'resolved';
  source: 'auto' | 'manual';
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface IssuesPageData {
  showId: string;
  showName: string;
  issues: EntryIssueRow[];
  entries: { id: string; label: string }[];
}

interface Candidate {
  showEntryId: string;
  kind: EntryIssueKind;
  message: string;
  detail: string | null;
  linkKind: string;
  linkId: string;
}

/* System-computed issues are derived at read time from the same rollups the
 * Entry Ledger / Unprocessed Documents / Membership Ledger already show,
 * then upserted (keyed by show_entry_id+kind+link) so a resolved row for
 * the same underlying requirement stays resolved rather than reappearing
 * every time this page loads. */
async function upsertAutoIssues(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  showId: string,
  candidates: Candidate[],
): Promise<void> {
  if (candidates.length === 0) return;

  const { data: existing, error } = await supabase
    .from('entry_issues')
    .select('show_entry_id, kind, link_kind, link_id')
    .eq('show_id', showId)
    .eq('source', 'auto');
  if (error) throw error;

  const existingKeys = new Set(
    existing.map((r) => `${r.show_entry_id}:${r.kind}:${r.link_kind ?? ''}:${r.link_id ?? ''}`),
  );

  const toInsert = candidates
    .filter((c) => !existingKeys.has(`${c.showEntryId}:${c.kind}:${c.linkKind}:${c.linkId}`))
    .map((c) => ({
      show_id: showId,
      show_entry_id: c.showEntryId,
      kind: c.kind,
      message: c.message,
      detail: c.detail,
      link_kind: c.linkKind,
      link_id: c.linkId,
      status: 'open' as const,
      source: 'auto' as const,
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('entry_issues').insert(toInsert);
    if (insertError) throw insertError;
  }
}

export async function getIssuesPageData(
  showId: string,
  options: { includeResolved?: boolean } = {},
): Promise<IssuesPageData | null> {
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

  const [{ data: entries, error: entriesError }, horsesData, { data: checks, error: checksError }] =
    await Promise.all([
      supabase
        .from('show_entries')
        .select('id, entry_number, rider_name, show_horse_id')
        .eq('show_id', showId),
      getHorsesPageData(showId),
      supabase.from('entry_membership_checks').select('show_entry_id, flags').eq('show_id', showId),
    ]);
  if (entriesError) throw entriesError;
  if (checksError) throw checksError;

  if (entries.length === 0) return { showId: show.id, showName: show.name, issues: [], entries: [] };

  const showHorseIds = [...new Set(entries.map((e) => e.show_horse_id))];
  const { data: showHorses, error: horsesErr } = await supabase
    .from('show_horses')
    .select('id, horse_id, horse_name, bridle_number')
    .in('id', showHorseIds);
  if (horsesErr) throw horsesErr;
  const showHorseById = new Map(showHorses.map((h) => [h.id, h]));

  const horseRowByKey = new Map((horsesData?.rows ?? []).map((r) => [r.key, r]));
  const checksByEntryId = new Map(checks.map((c) => [c.show_entry_id, c]));

  const candidates: Candidate[] = [];
  for (const entry of entries) {
    const showHorse = showHorseById.get(entry.show_horse_id);
    const horseKey = showHorse?.horse_id ?? `name:${showHorse?.horse_name ?? ''}`;
    const horseRow = horseRowByKey.get(horseKey);

    for (const doc of horseRow?.documents ?? []) {
      if (!doc.uploaded) {
        candidates.push({
          showEntryId: entry.id,
          kind: 'document',
          message: `Missing: ${doc.label}`,
          detail: null,
          linkKind: 'document_requirement',
          linkId: doc.requirementId,
        });
      } else if (doc.status === 'rejected') {
        const reasonLabel = doc.rejectionReason
          ? REJECTION_REASON_LABELS[doc.rejectionReason as keyof typeof REJECTION_REASON_LABELS]
          : 'no reason given';
        candidates.push({
          showEntryId: entry.id,
          kind: 'document',
          message: `Rejected: ${doc.label} (${reasonLabel})`,
          detail: doc.rejectionNote,
          linkKind: 'document_requirement',
          linkId: doc.requirementId,
        });
      } else if (doc.status === 'replacement_requested') {
        candidates.push({
          showEntryId: entry.id,
          kind: 'document',
          message: `Replacement requested: ${doc.label}`,
          detail: null,
          linkKind: 'document_requirement',
          linkId: doc.requirementId,
        });
      }
    }

    const flags = (checksByEntryId.get(entry.id)?.flags ?? []) as string[];
    for (const flag of flags) {
      candidates.push({
        showEntryId: entry.id,
        kind: 'membership',
        message: MEMBERSHIP_FLAG_LABELS[flag as keyof typeof MEMBERSHIP_FLAG_LABELS],
        detail: null,
        linkKind: 'membership_flag',
        linkId: flag,
      });
    }
  }

  await upsertAutoIssues(supabase, showId, candidates);

  let query = supabase
    .from('entry_issues')
    .select('*')
    .eq('show_id', showId)
    .order('created_at', { ascending: false });
  if (!options.includeResolved) query = query.eq('status', 'open');
  const { data: issueRows, error: issuesReadError } = await query;
  if (issuesReadError) throw issuesReadError;

  const entryById = new Map(entries.map((e) => [e.id, e]));

  const issues: EntryIssueRow[] = issueRows.map((row) => {
    const entry = entryById.get(row.show_entry_id);
    const showHorse = entry ? showHorseById.get(entry.show_horse_id) : undefined;
    return {
      id: row.id,
      showEntryId: row.show_entry_id,
      entryNumber: entry?.entry_number ?? '—',
      bridleNumber: showHorse?.bridle_number ?? '—',
      riderName: entry?.rider_name ?? '—',
      horseName: showHorse?.horse_name ?? '—',
      kind: row.kind as EntryIssueKind,
      message: row.message,
      detail: row.detail,
      status: row.status as 'open' | 'resolved',
      source: row.source as 'auto' | 'manual',
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      resolutionNote: row.resolution_note,
    };
  });

  const entryOptions = entries
    .map((e) => {
      const showHorse = showHorseById.get(e.show_horse_id);
      return {
        id: e.id,
        label: `#${e.entry_number} — ${e.rider_name} / ${showHorse?.horse_name ?? '—'}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return { showId: show.id, showName: show.name, issues, entries: entryOptions };
}

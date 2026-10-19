import 'server-only';
import { cache } from 'react';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { UserFacingError } from '@/shared/lib/action-result';

const BACK_NUMBER_NOT_CONFIGURED = 'FA001';

/* The reconciler below runs on an admin client — it bypasses RLS so that a
 * viewer with only `canManageEntryLedger` (not `canEnterScores`, which is
 * what class_entries writes normally require) can still trigger it just by
 * loading the ledger. That means RLS is NOT the enforcement boundary for
 * this one code path — every caller of reconcileShowEntries (or anything
 * that calls the resolvers directly) MUST call this first. */
export async function assertCanManageEntryLedger(showId: string): Promise<void> {
  const supabase = await createServerClient();
  const { data: allowed } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: 'canManageEntryLedger',
  });
  if (allowed !== true) {
    throw new UserFacingError("You don't have permission to manage this show's entry ledger.");
  }
}

/* Idempotent — safe to call on every ledger page load. Entries are created
 * from checkout, manual add, CSV import, and move-entry; rather than hook
 * every one of those call sites, this catches anything left unreconciled
 * through a single code path each time the ledger is read.
 *
 * The whole show is reconciled in ONE database call
 * (reconcile_show_entry_numbering, 20261002131000_shows_followups.sql),
 * which runs resolve_show_entry_numbering for each unlinked row inside the
 * database — the per-show advisory lock there still serializes concurrent
 * callers (Next.js prefetching several filing-cabinet tabs at once). When
 * nothing is unlinked it's a single cheap query. cache() collapses repeat
 * calls within one request (several loaders on the same render). */
async function reconcileShowEntriesOnce(showId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc('reconcile_show_entry_numbering', { p_show_id: showId });
  if (error) {
    if (error.code === BACK_NUMBER_NOT_CONFIGURED) throw new UserFacingError(error.message);
    throw error;
  }
}

export const reconcileShowEntries = cache(reconcileShowEntriesOnce);

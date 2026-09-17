import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { UserFacingError } from '@/shared/lib/action-result';

type AdminClient = ReturnType<typeof createAdminClient>;

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

/* Loading the Entry Ledger renders <Link>s to every other filing-cabinet
 * tab, and Next.js prefetches all of them immediately — several routes end
 * up reconciling numbering for the same show within milliseconds of each
 * other. A client-side check-then-insert-with-retry can't close that race
 * across multiple HTTP round trips (confirmed live: it still lost against
 * 3+ concurrent callers). The whole find-or-create for one class_entries
 * row instead happens atomically in a single Postgres function
 * (resolve_show_entry_numbering, supabase/migrations/20260916120000_*),
 * serialized per-show by an advisory lock — every concurrent caller for the
 * same show queues behind the lock instead of racing. */
async function ensureShowEntryForClassEntry(admin: AdminClient, classEntryId: string): Promise<void> {
  const { error } = await admin.rpc('resolve_show_entry_numbering', {
    target_class_entry_id: classEntryId,
  });
  if (error) {
    if (error.code === BACK_NUMBER_NOT_CONFIGURED) throw new UserFacingError(error.message);
    throw error;
  }
}

/* Idempotent — safe to call on every ledger page load. Entries are created
 * from checkout, manual add, CSV import, and move-entry; rather than hook
 * every one of those call sites, this catches anything left unreconciled
 * through a single code path each time the ledger is read. */
export async function reconcileShowEntries(showId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: classIds, error: classError } = await admin
    .from('classes')
    .select('id')
    .eq('show_id', showId);
  if (classError) throw classError;
  if (classIds.length === 0) return;

  const { data: unlinked, error: unlinkedError } = await admin
    .from('class_entries')
    .select('id')
    .in(
      'class_id',
      classIds.map((c) => c.id),
    )
    .is('show_entry_id', null);
  if (unlinkedError) throw unlinkedError;

  for (const row of unlinked) {
    await ensureShowEntryForClassEntry(admin, row.id);
  }
}

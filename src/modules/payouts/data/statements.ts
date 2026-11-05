import 'server-only';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { MIN_PAYOUT_DOLLARS } from '@/modules/payouts/constants';
import { backfillPaymentEvents } from '@/modules/payouts/data/events';
import { computeStatement } from '@/modules/payouts/utils/compute-statement';
import type { Statement } from '@/modules/payouts/types';

/* One organizer's statement for a period, built from the dated ledger.
 *
 * Reads with the service role, so the caller must already have checked the
 * viewer may see this organization's money (SuperAdmin, or the organizer /
 * a show admin with the money permission for it). */
export async function getOrgStatement(
  orgId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<Statement> {
  const admin = createAdminClient();

  // Repair any paid sale whose ledger row failed to write at payment time.
  await backfillPaymentEvents(admin);

  const [org, shows, events] = await Promise.all([
    admin.from('organizations').select('holdback_percent').eq('id', orgId).maybeSingle(),
    admin.from('shows').select('id, name, end_date').eq('org_id', orgId),
    admin
      .from('sale_events')
      .select('id, org_id, show_id, sale_type, sale_id, kind, amount, fee, stripe_ref, occurred_at')
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: true }),
  ]);
  if (org.error) throw org.error;
  if (shows.error) throw shows.error;
  if (events.error) throw events.error;

  return computeStatement({
    events: events.data,
    shows: shows.data.map((s) => ({ id: s.id, name: s.name, endDate: s.end_date })),
    periodStart,
    periodEnd,
    holdbackPercent: org.data?.holdback_percent ?? null,
    // Earlier payouts are recorded once payouts exist (next phase); until
    // then nothing has been sent.
    paidBefore: 0,
    minPayoutDollars: MIN_PAYOUT_DOLLARS,
  });
}

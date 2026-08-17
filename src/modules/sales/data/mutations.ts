'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { refundSaleSchema, chargeMoreSchema } from '../schemas';

/**
 * Real money moves through this file — Stripe refunds and off-session
 * additional charges against real orders and vendor bookings, ported from
 * showstaff.html's submitRealRefund / submitChargeMore and the legacy
 * api/shows/[id]/[resource].js handlers behind them.
 *
 * Both actions read and write through the service-role client rather than
 * the caller's own, on purpose — orders/vendor_bookings carry no RLS UPDATE
 * policy (see the comment on orders_select_owner in the RLS migration:
 * "Writes never come from a client... amounts must be computed server-side
 * and reconciled against Stripe"). The permission check that would normally
 * be RLS's job happens explicitly at the top of each action instead.
 */

const TABLE_BY_TYPE = { order: 'orders', vendor_booking: 'vendor_bookings' } as const;

/** Rounds to the nearest cent — every amount stored or sent to Stripe goes through this once, so the DB and Stripe never disagree over a fraction of a cent (e.g. a typed "25.999" becoming a $26.00 Stripe charge but a 25.999 ledger entry). */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

async function assertCanRefund(showId: string): Promise<void> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  // Mirrors getOrganizerContext's canViewMoney bypass: the account owner (and
  // a SuperAdmin impersonating them) always has full authority over their own
  // show's money, regardless of the per-person canRefund grant.
  const impersonatedOrgId = await getImpersonatedOrgId();
  if (profile.platform_role === 'Organizer' || impersonatedOrgId !== null) return;

  const supabase = await createServerClient();
  const { data: allowed } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: 'canRefund',
  });
  if (allowed !== true) {
    throw new Error('You do not have permission to issue refunds for this show.');
  }
}

export async function refundSale(input: unknown): Promise<void> {
  const parsed = refundSaleSchema.parse(input);
  await assertCanRefund(parsed.showId);

  const amountCents = toCents(parsed.amount);
  const amount = amountCents / 100;

  const admin = createAdminClient();
  const table = TABLE_BY_TYPE[parsed.saleType];

  const { data: sale, error: readError } = await admin
    .from(table)
    .select('amount_total, fee_total, refunded_amount, stripe_payment_intent_id, show_id')
    .eq('id', parsed.saleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (sale.show_id !== parsed.showId) throw new Error('This sale does not belong to that show.');
  if (!sale.stripe_payment_intent_id) {
    throw new Error('This sale has no payment on file to refund.');
  }

  const amountTotal = sale.amount_total ?? 0;
  const feeTotal = sale.fee_total ?? 0;
  const refundedBefore = sale.refunded_amount ?? 0;
  const maxRefundable = Math.round((amountTotal - feeTotal - refundedBefore) * 100) / 100;
  if (amount > maxRefundable + 0.001) {
    throw new Error(`Only $${maxRefundable.toFixed(2)} can still be refunded on this sale.`);
  }

  // Atomic reservation before ever calling Stripe: the update only applies if
  // refunded_amount hasn't moved since we just read it, closing the same
  // double-refund race legacy guarded against with a conditional UPDATE. The
  // orders_refund_within_cap / vendor_bookings_refund_within_cap CHECK
  // constraints back this up at the database layer too.
  const { data: reserved, error: reserveError } = await admin
    .from(table)
    .update({ refunded_amount: refundedBefore + amount })
    .eq('id', parsed.saleId)
    .eq('refunded_amount', refundedBefore)
    .select('id')
    .maybeSingle();
  if (reserveError) throw new Error(reserveError.message);
  if (!reserved) {
    throw new Error('This sale was just refunded by someone else — reload and try again.');
  }

  try {
    const stripe = getStripeClient();
    await stripe.refunds.create(
      { payment_intent: sale.stripe_payment_intent_id, amount: amountCents },
      {
        idempotencyKey: `refund-${parsed.saleId}-${refundedBefore.toFixed(2)}-${amount.toFixed(2)}`,
      },
    );
  } catch (err) {
    // Stripe never took the money — undo the reservation.
    await admin.from(table).update({ refunded_amount: refundedBefore }).eq('id', parsed.saleId);
    throw new Error(
      err instanceof Error ? `Stripe refund failed: ${err.message}` : 'Stripe refund failed.',
    );
  }

  revalidatePath('/dashboard/event-sales');
}

/** Optimistic-concurrency attempts for recording a charge after Stripe already took the money — see chargeMore. */
const MAX_RECORD_ATTEMPTS = 5;

export async function chargeMore(input: unknown): Promise<void> {
  const parsed = chargeMoreSchema.parse(input);
  await assertCanRefund(parsed.showId);

  const amountCents = toCents(parsed.amount);
  const amount = amountCents / 100;

  const admin = createAdminClient();
  const table = TABLE_BY_TYPE[parsed.saleType];

  const { data: sale, error: readError } = await admin
    .from(table)
    .select('show_id, stripe_customer_id, stripe_payment_method_id')
    .eq('id', parsed.saleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (sale.show_id !== parsed.showId) throw new Error('This sale does not belong to that show.');
  if (!sale.stripe_customer_id || !sale.stripe_payment_method_id) {
    throw new Error('No saved card on file for this sale — an additional charge cannot be made.');
  }

  const stripe = getStripeClient();
  let paymentIntentId: string;
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        customer: sale.stripe_customer_id,
        payment_method: sale.stripe_payment_method_id,
        off_session: true,
        confirm: true,
      },
      // Time-based rather than derived from sale state, unlike refundSale's key:
      // two deliberate charges of the same amount on the same sale must both go
      // through, so the key can't be just saleId+amount (Stripe would treat the
      // second as a duplicate of the first and silently return the first's
      // result). The real gap this leaves is a client-side retry of the exact
      // same click racing the first attempt's response — narrow, since the
      // dialog disables its submit button for the duration of the request.
      { idempotencyKey: `charge-${parsed.saleId}-${Date.now().toString()}` },
    );
    paymentIntentId = paymentIntent.id;
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Stripe charge failed: ${err.message}` : 'Stripe charge failed.',
    );
  }

  // Stripe has already taken the money, so this write must never be silently
  // lost to a race with another concurrent "charge more" on the same sale —
  // unlike refundSale's reservation (made before Stripe is ever called, so a
  // conflict there can just abort), a conflict here has to retry against the
  // latest row instead, or the charge would vanish from the ledger.
  const chargeRecord = { id: paymentIntentId, amount, createdAt: new Date().toISOString() };
  for (let attempt = 0; attempt < MAX_RECORD_ATTEMPTS; attempt++) {
    const { data: current, error: currentError } = await admin
      .from(table)
      .select('additional_charges_total, additional_charges')
      .eq('id', parsed.saleId)
      .single();
    if (currentError) throw new Error(currentError.message);

    const priorTotal = current.additional_charges_total ?? 0;
    const priorCharges = Array.isArray(current.additional_charges)
      ? current.additional_charges
      : [];

    const { data: updated, error: updateError } = await admin
      .from(table)
      .update({
        additional_charges_total: priorTotal + amount,
        additional_charges: [...priorCharges, chargeRecord],
      })
      .eq('id', parsed.saleId)
      .eq('additional_charges_total', priorTotal)
      .select('id')
      .maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (updated) {
      revalidatePath('/dashboard/event-sales');
      return;
    }
  }

  throw new Error(
    `Charged $${amount.toFixed(2)} but could not record it after several attempts — check Stripe (payment ${paymentIntentId}) and reconcile this sale manually.`,
  );
}

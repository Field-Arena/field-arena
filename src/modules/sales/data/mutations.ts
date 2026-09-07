'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { ROUTES } from '@/shared/constants/routes';
import { refundSaleSchema, chargeMoreSchema } from '@/modules/sales/schemas';
import { MAX_CHARGE_RECORD_ATTEMPTS } from '@/modules/sales/constants';
import { SETTLED_ORDER_STATUS, SETTLED_BOOKING_STATUS } from '@/shared/lib/sales-math';

const TABLE_BY_TYPE = { order: 'orders', vendor_booking: 'vendor_bookings' } as const;

/* The only state each sale type may be refunded or re-charged from. Legacy
 * enforced this before touching Stripe (404 "No paid order found.") — without
 * it a pending or failed checkout could be refunded, moving money against a
 * payment that never settled.
 *
 * Legacy's vendor value was 'confirmed'; this schema uses approved → paid, so
 * that literal would match nothing and block every vendor refund. */
const REQUIRED_STATUS_BY_TYPE = {
  order: SETTLED_ORDER_STATUS,
  vendor_booking: SETTLED_BOOKING_STATUS,
} as const;

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/* Legacy ran requireShowManager(showId) on EVERY money route before the
 * canRefund check (api/shows/[id]/[resource].js:228-230), which resolved the
 * show's org and refused anyone outside it. Skipping straight to "is this
 * caller an Organizer?" drops that boundary entirely — and because the refund
 * path uses the service-role client, RLS is not there to catch it either, so
 * an Organizer could move money on another organization's sale. The org check
 * has to happen here, before any role short-circuit. */
async function assertCanRefund(showId: string): Promise<void> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  const admin = createAdminClient();
  const { data: show, error: showError } = await admin
    .from('shows')
    .select('org_id')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw new Error(showError.message);
  if (!show) throw new Error('That show no longer exists.');

  // A SuperAdmin acting as an organizer is bound to the org they entered,
  // not to every org.
  const impersonatedOrgId = await getImpersonatedOrgId();
  if (impersonatedOrgId !== null) {
    if (impersonatedOrgId !== show.org_id) {
      throw new Error('That sale belongs to a different organization.');
    }
    return;
  }

  if (profile.platform_role === 'Organizer') {
    if (profile.org_id !== show.org_id) {
      throw new Error('That sale belongs to a different organization.');
    }
    return;
  }

  // Everyone else needs a real per-show canRefund grant — deliberately
  // separate from canViewMoney, as legacy spelled out.
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
    .select('amount_total, fee_total, refunded_amount, stripe_payment_intent_id, show_id, status')
    .eq('id', parsed.saleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (sale.show_id !== parsed.showId) throw new Error('This sale does not belong to that show.');
  if (sale.status !== REQUIRED_STATUS_BY_TYPE[parsed.saleType]) {
    throw new Error('This sale has not been paid, so there is nothing to refund.');
  }
  if (!sale.stripe_payment_intent_id) {
    throw new Error('This sale has no payment on file to refund.');
  }

  const amountTotal = sale.amount_total ?? 0;
  const feeTotal = sale.fee_total ?? 0;
  const refundedBefore = sale.refunded_amount ?? 0;
  const maxRefundable = Math.round((amountTotal - feeTotal - refundedBefore) * 100) / 100;
  /* Legacy CLAMPED an over-cap request rather than refusing it —
   * `const refundAmount = Math.min(amount, maxRefundable)` — and only returned
   * an error once there was nothing left at all ("the platform fee is never
   * refundable"). Rejecting outright meant an organizer typing a round number
   * slightly above the remaining balance got an error instead of the refund
   * they meant; legacy just refunded what was actually left. */
  if (maxRefundable <= 0) {
    throw new Error(
      'Nothing left to refund on this sale — the platform fee is never refundable.',
    );
  }
  const refundAmount = Math.min(amount, maxRefundable);
  const refundAmountCents = toCents(refundAmount);

  const { data: reserved, error: reserveError } = await admin
    .from(table)
    .update({ refunded_amount: refundedBefore + refundAmount })
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
      { payment_intent: sale.stripe_payment_intent_id, amount: refundAmountCents },
      {
        idempotencyKey: `refund-${parsed.saleId}-${refundedBefore.toFixed(2)}-${refundAmount.toFixed(2)}`,
      },
    );
  } catch (err) {
    await admin.from(table).update({ refunded_amount: refundedBefore }).eq('id', parsed.saleId);
    throw new Error(
      err instanceof Error ? `Stripe refund failed: ${err.message}` : 'Stripe refund failed.',
    );
  }

  revalidatePath(ROUTES.eventSales);
}

export async function chargeMore(input: unknown): Promise<void> {
  const parsed = chargeMoreSchema.parse(input);
  await assertCanRefund(parsed.showId);

  const amountCents = toCents(parsed.amount);
  const amount = amountCents / 100;

  const admin = createAdminClient();
  const table = TABLE_BY_TYPE[parsed.saleType];

  const { data: sale, error: readError } = await admin
    .from(table)
    .select('show_id, stripe_customer_id, stripe_payment_method_id, status')
    .eq('id', parsed.saleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (sale.show_id !== parsed.showId) throw new Error('This sale does not belong to that show.');
  if (sale.status !== REQUIRED_STATUS_BY_TYPE[parsed.saleType]) {
    throw new Error('This sale has not been paid, so it cannot be charged again.');
  }
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

      { idempotencyKey: `charge-${parsed.saleId}-${Date.now().toString()}` },
    );
    paymentIntentId = paymentIntent.id;
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Stripe charge failed: ${err.message}` : 'Stripe charge failed.',
    );
  }

  const chargeRecord = { id: paymentIntentId, amount, createdAt: new Date().toISOString() };
  for (let attempt = 0; attempt < MAX_CHARGE_RECORD_ATTEMPTS; attempt++) {
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
      revalidatePath(ROUTES.eventSales);
      return;
    }
  }

  throw new Error(
    `Charged $${amount.toFixed(2)} but could not record it after several attempts — check Stripe (payment ${paymentIntentId}) and reconcile this sale manually.`,
  );
}

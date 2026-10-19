'use server';

import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { getImpersonatedOrgId } from '@/shared/lib/auth/view-as';
import { ROUTES } from '@/shared/constants/routes';
import { parseInput } from '@/shared/lib/action-result';
import {
  refundSaleSchema,
  chargeMoreSchema,
  refundAdditionalChargeSchema,
} from '@/modules/sales/schemas';
import { refundChargingOrganizer } from '@/modules/sales/data/stripe-refund';
import { updateAdditionalChargesLedger } from '@/modules/sales/data/additional-charges-ledger';
import {
  chargeMaxRefundable,
  roundCents,
  type RawAdditionalCharge,
} from '@/modules/sales/utils/additional-charges';
import type { OrganizerRefundOutcome, RefundSaleResult } from '@/modules/sales/types';
import {
  SETTLED_ORDER_STATUS,
  SETTLED_BOOKING_STATUS,
  additionalChargeRefunded,
} from '@/shared/lib/sales-math';

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

export async function refundSale(input: unknown): Promise<RefundSaleResult> {
  const parsed = parseInput(refundSaleSchema, input);
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
    throw new Error('Nothing left to refund on this sale — the platform fee is never refundable.');
  }
  const refundAmount = Math.min(amount, maxRefundable);
  const refundAmountCents = toCents(refundAmount);

  // Rounded to cents so the rollback's compare-and-swap below matches the
  // numeric(12,2) value Postgres actually stored.
  const refundedAfter = Math.round((refundedBefore + refundAmount) * 100) / 100;

  const { data: reserved, error: reserveError } = await admin
    .from(table)
    .update({ refunded_amount: refundedAfter })
    .eq('id', parsed.saleId)
    .eq('refunded_amount', refundedBefore)
    .select('id')
    .maybeSingle();
  if (reserveError) throw new Error(reserveError.message);
  if (!reserved) {
    throw new Error('This sale was just refunded by someone else — reload and try again.');
  }

  const idempotencyKey = `refund-${parsed.saleId}-${refundedBefore.toFixed(2)}-${refundAmount.toFixed(2)}`;
  let outcome: OrganizerRefundOutcome;
  try {
    outcome = await refundChargingOrganizer(getStripeClient(), {
      paymentIntentId: sale.stripe_payment_intent_id,
      amountCents: refundAmountCents,
      idempotencyKey,
      metadata: { saleId: parsed.saleId, saleType: parsed.saleType, showId: parsed.showId },
    });
  } catch (err) {
    // Compare-and-swap: only release our own reservation. If another refund
    // has landed on top since, leave the row alone rather than erase it.
    await admin
      .from(table)
      .update({ refunded_amount: refundedBefore })
      .eq('id', parsed.saleId)
      .eq('refunded_amount', refundedAfter);
    throw new Error(
      err instanceof Error ? `Stripe refund failed: ${err.message}` : 'Stripe refund failed.',
    );
  }

  /* The refund happened — from here on nothing may throw it away. The log
   * entry and the review flag are best-effort records on top of the
   * already-reserved refunded_amount. */
  const { error: logError } = await admin.rpc('append_sale_refund_log', {
    p_sale_type: parsed.saleType,
    p_sale_id: parsed.saleId,
    p_entry: {
      refundId: outcome.refundId,
      amount: refundAmount,
      createdAt: new Date().toISOString(),
      transferId: outcome.transferId,
      transferReversalId: outcome.transferReversalId,
      reversalError: outcome.reversalError,
    },
  });
  if (logError) {
    console.error('[sales] could not record refund log entry', parsed.saleId, outcome, logError);
  }
  if (outcome.reversalError) {
    const { error: flagError } = await admin
      .from(table)
      .update({
        review_reason: `Refund ${outcome.refundId} ($${refundAmount.toFixed(2)}) was paid to the customer, but reversing it from the organizer's transfer ${outcome.transferId ?? '(none)'} failed: ${outcome.reversalError}`,
      })
      .eq('id', parsed.saleId);
    if (flagError) {
      console.error('[sales] could not flag sale for review', parsed.saleId, flagError);
    }
  }

  revalidatePath(ROUTES.eventSales);
  return { transferReversalFailed: outcome.reversalError !== null };
}

/* One refund of an additional charge, kept on that charge's element of
 * `additional_charges` (no separate column): `refunded` is the running total
 * and `refunds` the per-attempt log. An attempt is `pending` from reservation
 * until Stripe answers — it already counts toward `refunded`, so two staff
 * refunding the same charge at once can never exceed it together. */
interface ChargeRefundEntry {
  requestId: string;
  amount: number;
  status: 'pending' | 'succeeded';
  createdAt: string;
  refundId?: string;
  transferId?: string | null;
  transferReversalId?: string | null;
  reversalError?: string | null;
}

function chargeRefunds(charge: RawAdditionalCharge): ChargeRefundEntry[] {
  return Array.isArray(charge.refunds)
    ? charge.refunds.filter(
        (r): r is ChargeRefundEntry =>
          typeof r === 'object' &&
          r !== null &&
          typeof (r as ChargeRefundEntry).requestId === 'string',
      )
    : [];
}

type ChargeRefundReservation =
  { kind: 'reserved'; refundAmount: number } | { kind: 'replay'; transferReversalFailed: boolean };

export async function refundAdditionalCharge(input: unknown): Promise<RefundSaleResult> {
  const parsed = parseInput(refundAdditionalChargeSchema, input);
  await assertCanRefund(parsed.showId);

  const requested = toCents(parsed.amount) / 100;
  const admin = createAdminClient();
  const table = TABLE_BY_TYPE[parsed.saleType];

  const { data: sale, error: readError } = await admin
    .from(table)
    .select('show_id, status')
    .eq('id', parsed.saleId)
    .single();
  if (readError) throw new Error(readError.message);
  if (sale.show_id !== parsed.showId) throw new Error('This sale does not belong to that show.');
  if (sale.status !== REQUIRED_STATUS_BY_TYPE[parsed.saleType]) {
    throw new Error('This sale has not been paid, so there is nothing to refund.');
  }

  // Reserve: bump the charge's `refunded` and log a pending attempt in one
  // compare-and-swap, BEFORE Stripe is called (same order as refundSale).
  const reservation = await updateAdditionalChargesLedger<ChargeRefundReservation>(
    admin,
    table,
    parsed.saleId,
    ({ charges }) => {
      const charge = charges.find((c) => c.id === parsed.chargeId);
      if (!charge) throw new Error('That additional charge is not on this sale.');

      const refunds = chargeRefunds(charge);
      const prior = refunds.find((r) => r.requestId === parsed.requestId);
      if (prior) {
        // A replayed request (double submit, dropped response).
        if (prior.status === 'pending') {
          throw new Error('This refund is already being processed — reload in a moment.');
        }
        return {
          write: false,
          result: { kind: 'replay', transferReversalFailed: !!prior.reversalError },
        };
      }

      const maxRefundable = chargeMaxRefundable(charge);
      // Clamped like refundSale: an over-cap request refunds what is left.
      if (maxRefundable <= 0) {
        throw new Error(
          'Nothing left to refund on this charge — the platform fee is never refundable.',
        );
      }
      const refundAmount = Math.min(requested, maxRefundable);
      charge.refunded = roundCents(additionalChargeRefunded(charge) + refundAmount);
      charge.refunds = [
        ...refunds,
        {
          requestId: parsed.requestId,
          amount: refundAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
        } satisfies ChargeRefundEntry,
      ];
      return { write: true, charges, result: { kind: 'reserved', refundAmount } };
    },
  );
  if (reservation.kind === 'replay') {
    return { transferReversalFailed: reservation.transferReversalFailed };
  }
  const { refundAmount } = reservation;

  let outcome: OrganizerRefundOutcome;
  try {
    // The charge's own PaymentIntent. refundChargingOrganizer reverses the
    // organizer's transfer only when that PaymentIntent was a destination
    // charge (transfer_data set) — a charge that stayed on the platform has
    // nothing to reverse.
    outcome = await refundChargingOrganizer(getStripeClient(), {
      paymentIntentId: parsed.chargeId,
      amountCents: toCents(refundAmount),
      idempotencyKey: `refund-charge-${parsed.chargeId}-${parsed.requestId}`,
      metadata: {
        saleId: parsed.saleId,
        saleType: parsed.saleType,
        showId: parsed.showId,
        additionalChargeId: parsed.chargeId,
      },
    });
  } catch (err) {
    // Release only OUR reservation — matched by requestId, so a refund that
    // landed on the same charge meanwhile is left intact.
    try {
      await updateAdditionalChargesLedger(admin, table, parsed.saleId, ({ charges }) => {
        const charge = charges.find((c) => c.id === parsed.chargeId);
        const refunds = charge ? chargeRefunds(charge) : [];
        const mine = refunds.find(
          (r) => r.requestId === parsed.requestId && r.status === 'pending',
        );
        if (!charge || !mine) return { write: false, result: undefined };
        charge.refunded = roundCents(Math.max(0, additionalChargeRefunded(charge) - mine.amount));
        charge.refunds = refunds.filter((r) => r !== mine);
        return { write: true, charges, result: undefined };
      });
    } catch (rollbackError) {
      console.error(
        '[sales] could not release additional-charge refund reservation',
        parsed.saleId,
        parsed.chargeId,
        parsed.requestId,
        rollbackError,
      );
    }
    throw new Error(
      err instanceof Error ? `Stripe refund failed: ${err.message}` : 'Stripe refund failed.',
    );
  }

  /* The refund happened — from here on nothing may throw it away. Marking the
   * attempt succeeded, the sale-level log entry and the review flag are
   * best-effort records on top of the already-reserved `refunded`. */
  try {
    await updateAdditionalChargesLedger(admin, table, parsed.saleId, ({ charges }) => {
      const charge = charges.find((c) => c.id === parsed.chargeId);
      if (!charge) return { write: false, result: undefined };
      charge.refunds = chargeRefunds(charge).map((r) =>
        r.requestId === parsed.requestId
          ? {
              ...r,
              status: 'succeeded' as const,
              refundId: outcome.refundId,
              transferId: outcome.transferId,
              transferReversalId: outcome.transferReversalId,
              reversalError: outcome.reversalError,
            }
          : r,
      );
      return { write: true, charges, result: undefined };
    });
  } catch (finalizeError) {
    console.error(
      '[sales] could not finalize additional-charge refund record',
      parsed.saleId,
      parsed.chargeId,
      outcome,
      finalizeError,
    );
  }

  const { error: logError } = await admin.rpc('append_sale_refund_log', {
    p_sale_type: parsed.saleType,
    p_sale_id: parsed.saleId,
    p_entry: {
      refundId: outcome.refundId,
      amount: refundAmount,
      additionalChargeId: parsed.chargeId,
      createdAt: new Date().toISOString(),
      transferId: outcome.transferId,
      transferReversalId: outcome.transferReversalId,
      reversalError: outcome.reversalError,
    },
  });
  if (logError) {
    console.error('[sales] could not record refund log entry', parsed.saleId, outcome, logError);
  }
  if (outcome.reversalError) {
    const { error: flagError } = await admin
      .from(table)
      .update({
        review_reason: `Refund ${outcome.refundId} ($${refundAmount.toFixed(2)}) of additional charge ${parsed.chargeId} was paid to the customer, but reversing it from the organizer's transfer ${outcome.transferId ?? '(none)'} failed: ${outcome.reversalError}`,
      })
      .eq('id', parsed.saleId);
    if (flagError) {
      console.error('[sales] could not flag sale for review', parsed.saleId, flagError);
    }
  }

  revalidatePath(ROUTES.eventSales);
  return { transferReversalFailed: outcome.reversalError !== null };
}

export async function chargeMore(input: unknown): Promise<void> {
  const parsed = parseInput(chargeMoreSchema, input);
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

  const { data: show, error: showError } = await admin
    .from('shows')
    .select('org_id')
    .eq('id', parsed.showId)
    .maybeSingle();
  if (showError) throw new Error(showError.message);
  if (!show) throw new Error('That show no longer exists.');
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('currency, stripe_connect_account_id')
    .eq('id', show.org_id)
    .maybeSingle();
  if (orgError) throw new Error(orgError.message);

  const stripe = getStripeClient();
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: amountCents,
    currency: (org?.currency ?? 'usd').toLowerCase(),
    customer: sale.stripe_customer_id,
    payment_method: sale.stripe_payment_method_id,
    off_session: true,
    confirm: true,
    metadata: {
      saleId: parsed.saleId,
      saleType: parsed.saleType,
      showId: parsed.showId,
      chargeMore: 'true',
    },
  };
  /* Same split as checkout: a destination charge to the organizer's Connect
   * account with the platform's cut as the application fee. There is no class
   * to derive a fee model from for an ad-hoc charge, so — as legacy did — the
   * flat 8% fee (the add-on/vendor rate) applies. Unfinished Connect
   * onboarding never blocks the charge; it just stays on the platform. */
  if (org?.stripe_connect_account_id) {
    let chargesEnabled = false;
    try {
      const account = await stripe.accounts.retrieve(org.stripe_connect_account_id);
      chargesEnabled = account.charges_enabled;
    } catch {
      chargesEnabled = false;
    }
    if (chargesEnabled) {
      paymentIntentParams.application_fee_amount = Math.round(calcPlatformFeeFlat8(amount) * 100);
      paymentIntentParams.transfer_data = { destination: org.stripe_connect_account_id };
    }
  }

  let paymentIntentId: string;
  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, {
      // Client-generated per attempt: a retried request (dropped response,
      // double click) replays Stripe's cached result instead of charging again.
      idempotencyKey: `charge-${parsed.saleId}-${parsed.requestId}`,
    });
    paymentIntentId = paymentIntent.id;
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Stripe charge failed: ${err.message}` : 'Stripe charge failed.',
    );
  }

  /* `fee` is the platform's cut of this charge — what a later refund of it
   * holds back, as refundSale holds back fee_total. Recorded even when the
   * charge stayed on the platform, for the same reason fee_total is. */
  const chargeRecord = {
    id: paymentIntentId,
    amount,
    fee: roundCents(calcPlatformFeeFlat8(amount)),
    createdAt: new Date().toISOString(),
    refunded: 0,
    refunds: [],
  };
  try {
    await updateAdditionalChargesLedger(admin, table, parsed.saleId, ({ charges, total }) => {
      // A replayed request gets the same PaymentIntent back from Stripe — it
      // is already on the ledger, so don't record it twice.
      if (charges.some((c) => c.id === paymentIntentId)) {
        return { write: false, result: undefined };
      }
      return {
        write: true,
        charges: [...charges, chargeRecord],
        total: roundCents(total + amount),
        result: undefined,
      };
    });
  } catch (cause) {
    console.error('[sales] could not record additional charge', parsed.saleId, cause);
    throw new Error(
      `Charged $${amount.toFixed(2)} but could not record it after several attempts — check Stripe (payment ${paymentIntentId}) and reconcile this sale manually.`,
    );
  }
  revalidatePath(ROUTES.eventSales);
}

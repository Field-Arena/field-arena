import 'server-only';
import type Stripe from 'stripe';
import type { OrganizerRefundOutcome } from '@/modules/sales/types';

function chargeTransferId(paymentIntent: Stripe.PaymentIntent): string | null {
  const charge = paymentIntent.latest_charge;
  if (!charge || typeof charge === 'string') return null;
  if (!charge.transfer) return null;
  return typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id;
}

/* H11: the organizer bears the WHOLE refund.
 *
 * On a destination charge the organizer already received (amount − platform
 * fee) by transfer. Stripe's `reverse_transfer: true` pulls back only a
 * PROPORTIONAL share of that transfer, so the platform would still fund its
 * fee's share of every refund. Instead the refund is created with no
 * reversal (the platform balance pays the customer) and then exactly the
 * refunded amount is reversed from the organizer's transfer. The refund cap
 * (amount − fee − already refunded) guarantees the reversals never exceed
 * the transfer.
 *
 * Idempotency: the refund uses the caller's key; the reversal is keyed off
 * the refund id, so a replayed request (same refund back from Stripe) can
 * never reverse twice.
 *
 * A failed reversal (e.g. the connected account's balance is short) is NOT
 * thrown: the customer has been refunded and that must not be lost or
 * rolled back. It is logged and returned so the caller can record it and flag
 * the sale for reconciliation. */
export async function refundChargingOrganizer(
  stripe: Stripe,
  params: {
    paymentIntentId: string;
    amountCents: number;
    idempotencyKey: string;
    metadata: Record<string, string>;
  },
): Promise<OrganizerRefundOutcome> {
  const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
    expand: ['latest_charge'],
  });
  const isDestinationCharge = Boolean(paymentIntent.transfer_data?.destination);

  const refund = await stripe.refunds.create(
    {
      payment_intent: params.paymentIntentId,
      amount: params.amountCents,
      metadata: params.metadata,
    },
    { idempotencyKey: params.idempotencyKey },
  );

  if (!isDestinationCharge) {
    return { refundId: refund.id, transferId: null, transferReversalId: null, reversalError: null };
  }

  const transferId = chargeTransferId(paymentIntent);
  if (!transferId) {
    const reversalError = 'No transfer found on the charge to reverse.';
    console.error('[sales] refund transfer reversal skipped', refund.id, reversalError);
    return { refundId: refund.id, transferId: null, transferReversalId: null, reversalError };
  }

  try {
    const reversal = await stripe.transfers.createReversal(
      transferId,
      { amount: params.amountCents, metadata: { ...params.metadata, refundId: refund.id } },
      { idempotencyKey: `reversal-${refund.id}` },
    );
    return {
      refundId: refund.id,
      transferId,
      transferReversalId: reversal.id,
      reversalError: null,
    };
  } catch (cause) {
    const reversalError = cause instanceof Error ? cause.message : 'Transfer reversal failed.';
    console.error('[sales] refund transfer reversal failed', refund.id, transferId, cause);
    return { refundId: refund.id, transferId, transferReversalId: null, reversalError };
  }
}

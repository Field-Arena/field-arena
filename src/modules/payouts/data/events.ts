import 'server-only';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import { SETTLED_BOOKING_STATUS, SETTLED_ORDER_STATUS } from '@/shared/lib/sales-math';
import { BACKFILL_LOOKBACK_DAYS, DEMO_REF_PREFIX } from '@/modules/payouts/constants';
import type { RecordResult, SaleEventInput, SaleType } from '@/modules/payouts/types';

type AdminClient = ReturnType<typeof createAdminClient>;

const round2 = (n: number) => Math.round(n * 100) / 100;

/* Stores one dated money event. Only real Stripe money is recorded, and the
 * unique (kind, stripe_ref) makes a repeat — a webhook retry, or the success
 * page and the webhook both firing — a harmless duplicate. */
export async function recordSaleEvent(
  admin: AdminClient,
  input: SaleEventInput,
): Promise<RecordResult> {
  const ref = input.stripeRef?.trim();
  if (!ref || ref.startsWith(DEMO_REF_PREFIX)) return 'skipped';
  const amount = round2(input.amount);
  if (!(amount > 0)) return 'skipped';

  const { data: show, error: showError } = await admin
    .from('shows')
    .select('org_id')
    .eq('id', input.showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) throw new Error(`Show ${input.showId} not found while recording a ${input.kind}.`);

  const occurredAt =
    input.occurredAt instanceof Date ? input.occurredAt.toISOString() : input.occurredAt;
  const { data, error } = await admin
    .from('sale_events')
    .upsert(
      {
        org_id: show.org_id,
        show_id: input.showId,
        sale_type: input.saleType,
        sale_id: input.saleId,
        kind: input.kind,
        amount,
        fee: round2(input.fee ?? 0),
        stripe_ref: ref,
        occurred_at: occurredAt,
      },
      { onConflict: 'kind,stripe_ref', ignoreDuplicates: true },
    )
    .select('id');
  if (error) throw error;
  return data.length > 0 ? 'recorded' : 'duplicate';
}

/* For the moment a payment, refund or charge completes. By then the customer's
 * money has already moved, so a failure to write the ledger row must never
 * undo or block the sale — it is logged loudly and the backfill below repairs
 * missing payment rows before the next statement. */
export async function recordSaleEventSafely(
  admin: AdminClient,
  input: SaleEventInput,
): Promise<RecordResult | null> {
  try {
    return await recordSaleEvent(admin, input);
  } catch (cause) {
    console.error(
      `[sale-events] FAILED to record ${input.kind} ${input.stripeRef ?? '(no ref)'} for ${input.saleType} ${input.saleId}`,
      cause,
    );
    return null;
  }
}

/* Self-heal: every paid platform-held sale must have a payment event.
 * Anything missing (a write that failed at the moment of payment) is added
 * before a statement is built. Returns how many were added. */
export async function backfillPaymentEvents(admin: AdminClient): Promise<number> {
  const since = new Date(Date.now() - BACKFILL_LOOKBACK_DAYS * 86_400_000).toISOString();

  const [orders, bookings] = await Promise.all([
    admin
      .from('orders')
      .select('id, show_id, amount_total, fee_total, stripe_payment_intent_id, paid_at')
      .eq('settlement', 'platform')
      .eq('status', SETTLED_ORDER_STATUS)
      .not('stripe_payment_intent_id', 'is', null)
      .gte('paid_at', since),
    admin
      .from('vendor_bookings')
      .select('id, show_id, amount_total, fee_total, stripe_payment_intent_id, paid_at')
      .eq('settlement', 'platform')
      .eq('status', SETTLED_BOOKING_STATUS)
      .not('stripe_payment_intent_id', 'is', null)
      .gte('paid_at', since),
  ]);
  if (orders.error) throw orders.error;
  if (bookings.error) throw bookings.error;

  const sales: {
    saleType: SaleType;
    id: string;
    showId: string;
    amount: number;
    fee: number;
    ref: string;
    paidAt: string;
  }[] = [];
  for (const row of orders.data) {
    if (row.stripe_payment_intent_id && row.paid_at) {
      sales.push({
        saleType: 'order',
        id: row.id,
        showId: row.show_id,
        amount: row.amount_total,
        fee: row.fee_total ?? 0,
        ref: row.stripe_payment_intent_id,
        paidAt: row.paid_at,
      });
    }
  }
  for (const row of bookings.data) {
    if (row.stripe_payment_intent_id && row.paid_at && row.amount_total != null) {
      sales.push({
        saleType: 'vendor_booking',
        id: row.id,
        showId: row.show_id,
        amount: row.amount_total,
        fee: row.fee_total ?? 0,
        ref: row.stripe_payment_intent_id,
        paidAt: row.paid_at,
      });
    }
  }
  if (sales.length === 0) return 0;

  const known = new Set<string>();
  const CHUNK = 200;
  for (let i = 0; i < sales.length; i += CHUNK) {
    const refs = sales.slice(i, i + CHUNK).map((s) => s.ref);
    const { data, error } = await admin
      .from('sale_events')
      .select('stripe_ref')
      .eq('kind', 'payment')
      .in('stripe_ref', refs);
    if (error) throw error;
    for (const row of data) known.add(row.stripe_ref);
  }

  let added = 0;
  for (const sale of sales) {
    if (known.has(sale.ref)) continue;
    const result = await recordSaleEvent(admin, {
      saleType: sale.saleType,
      saleId: sale.id,
      showId: sale.showId,
      kind: 'payment',
      amount: sale.amount,
      fee: sale.fee,
      stripeRef: sale.ref,
      occurredAt: sale.paidAt,
    });
    if (result === 'recorded') added += 1;
  }
  return added;
}

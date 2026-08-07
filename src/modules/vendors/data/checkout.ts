import 'server-only';
import type Stripe from 'stripe';
import { getStripeClient } from '@/shared/lib/stripe';
import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { env } from '@/shared/lib/env';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import type {
  FinalizeVendorBookingResult,
  PricedVendorBooking,
  VendorBookingDbRow,
  VendorCheckoutLineItem,
} from '../types';

/**
 * The real backend for vendor booth-fee checkout — pricing, Stripe Checkout
 * Session creation, and payment fulfillment. Mirrors
 * modules/riders/data/checkout.ts's shape and reasoning exactly (same file
 * header applies here): every exported function takes an already-resolved,
 * already-authorized `booking`/id as input — it is the CALLER's job
 * (data/mutations.ts's createVendorCheckoutSession/confirmVendorCheckoutSession,
 * and the Stripe webhook route) to resolve and authorize that first. This
 * file has no 'use server' pragma on purpose: a `'use server'` export is
 * directly callable by any client with forged arguments, and
 * finalizeVendorBookingPayment in particular trusts its `booking` parameter
 * completely — exporting it as a Server Action would let a forged request
 * mark an arbitrary booking paid.
 *
 * Everything here uses the service-role admin client, passed in by the
 * caller rather than created here — same reasoning as riders' checkout.ts:
 * vendor_bookings has no RLS policy letting a vendor write status/amount_total/
 * fee_total/stripe_* (see supabase/migrations/20260806140000_vendor_self_service.sql's
 * column-scoped grant), by design — those are only ever set here, after Stripe
 * has actually confirmed payment.
 */

type AdminClient = ReturnType<typeof createAdminClient>;

function allInFlat8(price: number | null): number {
  const base = price ?? 0;
  return base + calcPlatformFeeFlat8(base);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Recomputes a booking's line items + all-in total from vendor_booking_items
 * joined against the show's live vendor_items catalog — never trusts a
 * price the client sends, same "amount always comes from the server" stance
 * riders' priceCart takes, and the exact recompute legacy's own
 * priceVendorBooking (api/organizations/[id]/[resource].js) made. Booth
 * charges are always a flat 8%, matching that source: no $7.99-vs-8% tiering
 * the way class entry fees have.
 */
export async function priceVendorBooking(
  admin: AdminClient,
  booking: VendorBookingDbRow
): Promise<PricedVendorBooking> {
  const { data: lineRows, error: lineError } = await admin
    .from('vendor_booking_items')
    .select('vendor_item_id, qty')
    .eq('booking_id', booking.id);
  if (lineError) throw lineError;

  const itemIds = [...new Set(lineRows.map((l) => l.vendor_item_id))];
  const catalogResult = itemIds.length
    ? await admin.from('vendor_items').select('*').in('id', itemIds)
    : { data: [], error: null };
  if (catalogResult.error) throw catalogResult.error;
  const catalogById = new Map(catalogResult.data.map((c) => [c.id, c]));

  const items: VendorCheckoutLineItem[] = [];
  let feeTotal = 0;
  for (const line of lineRows) {
    const cat = catalogById.get(line.vendor_item_id);
    if (!cat) continue;
    const qty = line.qty ?? 1;
    const unitAmount = round2(allInFlat8(cat.price));
    items.push({
      label: cat.name,
      vendorItemId: cat.id,
      qty,
      unitPrice: unitAmount,
      amount: round2(unitAmount * qty),
    });
    feeTotal += calcPlatformFeeFlat8(cat.price ?? 0) * qty;
  }
  feeTotal = round2(feeTotal);
  const total = round2(items.reduce((sum, item) => sum + item.amount, 0));

  const { data: show, error: showError } = await admin
    .from('shows')
    .select('org_id')
    .eq('id', booking.show_id)
    .maybeSingle();
  if (showError) throw showError;

  let currency = 'usd';
  let stripeConnectAccountId: string | null = null;
  let chargesEnabled = false;
  if (show?.org_id) {
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('currency, stripe_connect_account_id')
      .eq('id', show.org_id)
      .maybeSingle();
    if (orgError) throw orgError;
    currency = (org?.currency ?? 'usd').toLowerCase();
    if (org?.stripe_connect_account_id) {
      try {
        const stripe = getStripeClient();
        const account = await stripe.accounts.retrieve(org.stripe_connect_account_id);
        chargesEnabled = account.charges_enabled;
      } catch {
        chargesEnabled = false;
      }
    }
    stripeConnectAccountId = chargesEnabled ? (org?.stripe_connect_account_id ?? null) : null;
  }

  return {
    bookingId: booking.id,
    showId: booking.show_id,
    currency,
    stripeConnectAccountId,
    items,
    total,
    feeTotal,
    chargesEnabled,
  };
}

/**
 * A real Stripe Customer, one per checkout — same reasoning as riders'
 * createOrderStripeCustomer: what makes charging the same card again later
 * (an organizer's "Charge additional amount", sales/data/mutations.ts's
 * chargeMore) possible.
 */
export async function createVendorBookingStripeCustomer(booking: VendorBookingDbRow): Promise<string> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: booking.contact ?? undefined,
    name: booking.name || undefined,
    metadata: { bookingId: booking.id },
  });
  return customer.id;
}

/** Builds the priced items into Stripe Checkout Session line items. */
export function buildVendorStripeLineItems(
  items: VendorCheckoutLineItem[],
  currency: string
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return items.map((item) => ({
    price_data: {
      currency,
      unit_amount: Math.round(item.unitPrice * 100),
      product_data: { name: item.label },
    },
    quantity: item.qty || 1,
  }));
}

/**
 * Persists the reusable customer+payment_method captured by
 * setup_future_usage:'off_session' once the PaymentIntent has actually
 * succeeded. Called from both confirm paths (in-page confirm and the
 * webhook) — best-effort, never throws, mirroring riders' saveOffSessionCard.
 */
export async function saveVendorOffSessionCard(
  admin: AdminClient,
  bookingId: string,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  if (!paymentIntent.customer || !paymentIntent.payment_method) return;
  const stripeCustomerId =
    typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer.id;
  const stripePaymentMethodId =
    typeof paymentIntent.payment_method === 'string'
      ? paymentIntent.payment_method
      : paymentIntent.payment_method.id;
  await admin
    .from('vendor_bookings')
    .update({ stripe_customer_id: stripeCustomerId, stripe_payment_method_id: stripePaymentMethodId })
    .eq('id', bookingId);
}

/**
 * Best-effort confirmation email, reusing the same raw-Resend-fetch pattern
 * as riders' sendOrderConfirmationEmail (this codebase's only transactional-
 * email call sites outside Supabase Auth's own SMTP flows). Never throws —
 * the booking is already paid by the time this runs, so an email failure
 * must not surface as a checkout error.
 */
async function sendVendorBookingConfirmationEmail(
  admin: AdminClient,
  booking: VendorBookingDbRow,
  priced: PricedVendorBooking
): Promise<void> {
  if (!booking.contact) return;
  const { data: show } = await admin.from('shows').select('name').eq('id', booking.show_id).maybeSingle();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Field & Arena <notifications@field-arena.com>',
        to: booking.contact,
        subject: 'Your Field & Arena vendor booking is confirmed',
        html:
          `<p>Hi ${escapeHtml(booking.name || 'there')},</p>` +
          `<p>Your booth booking for <b>${escapeHtml(show?.name ?? 'the show')}</b> is confirmed.</p>` +
          `<p>Total charged: $${priced.total.toFixed(2)}</p>`,
      }),
    });
    if (!res.ok) {
      console.error('[vendors] booking confirmation email failed', res.status, await res.text());
    }
  } catch (cause) {
    console.error('[vendors] booking confirmation email transport failure', cause);
  }
}

/**
 * Fulfillment itself — the one place "what happens when a vendor booking
 * gets paid" is implemented. Both the in-page confirm path
 * (data/mutations.ts's confirmVendorCheckoutSession) and the Stripe webhook
 * route call this same function after independently verifying payment their
 * own way, so there is only one fulfillment implementation to ever drift —
 * mirrors riders' finalizeOrder exactly, including its atomic-claim shape.
 *
 * Atomically claims the booking before writing anything: the conditional
 * `UPDATE ... WHERE status != 'paid'` lets exactly one caller win a race (a
 * double-click, the webhook and the in-page confirm landing at nearly the
 * same instant); the loser sees zero rows updated and returns the
 * already-fulfilled read instead of double-sending a confirmation email.
 *
 * `amount_total`/`fee_total` are captured here, once, at the moment of real
 * payment — a refund's cap (sales/data/mutations.ts's refundSale) must be
 * based on what was actually charged, not vendor_items' current catalog
 * price, which can change after the booking is paid. Same reasoning as the
 * column comment on vendor_bookings.amount_total.
 */
export async function finalizeVendorBookingPayment(
  admin: AdminClient,
  booking: VendorBookingDbRow,
  priced: PricedVendorBooking,
  paymentIntentId: string | null
): Promise<FinalizeVendorBookingResult> {
  const { data: claimed, error: claimError } = await admin
    .from('vendor_bookings')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_total: priced.total,
      fee_total: priced.feeTotal,
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
    })
    .eq('id', booking.id)
    .neq('status', 'paid')
    .select()
    .maybeSingle();
  if (claimError) throw claimError;

  if (!claimed) {
    return {
      ok: true,
      alreadyFulfilled: true,
      bookingId: booking.id,
      total: booking.amount_total ?? priced.total,
      items: priced.items,
    };
  }

  await sendVendorBookingConfirmationEmail(admin, claimed, priced);

  return { ok: true, bookingId: claimed.id, total: priced.total, items: priced.items };
}

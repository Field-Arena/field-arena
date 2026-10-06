import 'server-only';
import type Stripe from 'stripe';
import { getStripeClient } from '@/shared/lib/stripe';
import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { env } from '@/shared/lib/env';
import { sendEmail } from '@/shared/lib/email';
import { renderEmail } from '@/shared/lib/email-layout';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import type { Json } from '@/shared/types/database.types';
import {
  VENDOR_DASHBOARD_PATH,
  PAYABLE_BOOKING_STATUSES,
  REVIEW_BOOKING_STATUS,
  REVIEWABLE_BOOKING_STATUSES,
} from '@/modules/vendors/constants';
import type {
  ConfirmVendorCheckoutResult,
  PricedVendorBooking,
  VendorBookingDbRow,
  VendorCheckoutLineItem,
  VendorCheckoutSnapshot,
  VendorPaidPricing,
} from '@/modules/vendors/types';

type AdminClient = ReturnType<typeof createAdminClient>;

function allInFlat8(price: number | null): number {
  const base = price ?? 0;
  return base + calcPlatformFeeFlat8(base);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function priceVendorBooking(
  admin: AdminClient,
  booking: VendorBookingDbRow,
): Promise<PricedVendorBooking> {
  const { data: lineRows, error: lineError } = await admin
    .from('vendor_booking_items')
    .select('vendor_item_id, qty')
    .eq('booking_id', booking.id);
  if (lineError) throw lineError;

  const itemIds = [...new Set(lineRows.map((l) => l.vendor_item_id))];
  const catalogResult = itemIds.length
    ? await admin
        .from('vendor_items')
        .select('*')
        .in('id', itemIds)
        // Never price another show's catalog item onto this booking.
        .eq('show_id', booking.show_id)
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

export function parseCheckoutSnapshot(raw: Json | null): VendorCheckoutSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const snap = raw as unknown as Partial<VendorCheckoutSnapshot>;
  if (
    typeof snap.sessionId !== 'string' ||
    typeof snap.total !== 'number' ||
    typeof snap.feeTotal !== 'number' ||
    !Array.isArray(snap.items)
  ) {
    return null;
  }
  return {
    sessionId: snap.sessionId,
    total: snap.total,
    feeTotal: snap.feeTotal,
    currency: typeof snap.currency === 'string' ? snap.currency : 'usd',
    items: snap.items,
    pricedAt: typeof snap.pricedAt === 'string' ? snap.pricedAt : '',
  };
}

export function buildCheckoutSnapshot(priced: PricedVendorBooking, sessionId: string): Json {
  const snapshot: VendorCheckoutSnapshot = {
    sessionId,
    total: priced.total,
    feeTotal: priced.feeTotal,
    currency: priced.currency,
    items: priced.items,
    pricedAt: new Date().toISOString(),
  };
  return snapshot as unknown as Json;
}

/* H14: the price a paid session is fulfilled at is the one stored when that
 * session was created, never today's catalog. Returns null when the paid
 * session is not the booking's current checkout (a superseded session) —
 * the caller parks the booking for review rather than guessing.
 *
 * Bookings whose checkout started before snapshots existed have none; those
 * fall back to live pricing (the pre-H14 behaviour) for the few hours such a
 * session can still be paid. */
export async function resolvePaidBookingPricing(
  admin: AdminClient,
  booking: VendorBookingDbRow,
  sessionId: string,
): Promise<VendorPaidPricing | null> {
  const snapshot = parseCheckoutSnapshot(booking.checkout_snapshot);
  if (!snapshot) return priceVendorBooking(admin, booking);
  if (snapshot.sessionId !== sessionId) return null;
  return { total: snapshot.total, feeTotal: snapshot.feeTotal, items: snapshot.items };
}

// The lines a paid booking was charged for, for its confirmation screen.
export async function paidBookingItems(
  admin: AdminClient,
  booking: VendorBookingDbRow,
): Promise<VendorCheckoutLineItem[]> {
  const snapshot = parseCheckoutSnapshot(booking.checkout_snapshot);
  if (snapshot) return snapshot.items;
  return (await priceVendorBooking(admin, booking)).items;
}

/* H13: a payment that cannot be accepted as-is (amount mismatch, rejected or
 * superseded booking) parks the booking in 'review'. It is then no longer
 * payable, so the vendor cannot pay twice while the organizer reconciles. A
 * failed write throws (webhook answers 500, Stripe retries). */
export async function markVendorBookingForReview(
  admin: AdminClient,
  bookingId: string,
  reason: string,
  paymentIntentId: string | null,
): Promise<void> {
  const { error } = await admin
    .from('vendor_bookings')
    .update({
      status: REVIEW_BOOKING_STATUS,
      review_reason: reason,
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
    })
    .eq('id', bookingId)
    .in('status', REVIEWABLE_BOOKING_STATUSES);
  if (error) throw error;
}

/* Reuses the customer already stored on the booking (from an earlier
 * checkout attempt) instead of creating a new Stripe customer every time. */
export async function createVendorBookingStripeCustomer(
  booking: VendorBookingDbRow,
): Promise<string> {
  if (booking.stripe_customer_id) return booking.stripe_customer_id;
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: booking.contact ?? undefined,
    name: booking.name || undefined,
    metadata: { bookingId: booking.id },
  });
  return customer.id;
}

export function buildVendorStripeLineItems(
  items: VendorCheckoutLineItem[],
  currency: string,
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

export async function saveVendorOffSessionCard(
  admin: AdminClient,
  bookingId: string,
  paymentIntent: Stripe.PaymentIntent,
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
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
    })
    .eq('id', bookingId);
}

async function sendVendorBookingConfirmationEmail(
  admin: AdminClient,
  booking: VendorBookingDbRow,
  priced: VendorPaidPricing,
): Promise<void> {
  if (!booking.contact) return;
  const { data: show } = await admin
    .from('shows')
    .select('name')
    .eq('id', booking.show_id)
    .maybeSingle();

  const showName = show?.name ?? 'the show';

  // Never throws: the booking is paid either way, and a failed email must not
  // undo that.
  try {
    const { html, text } = renderEmail({
      preheader: `Your booth booking for ${showName} is confirmed.`,
      eyebrow: 'Booking confirmed',
      heading: 'Your vendor booking is confirmed',
      greeting: `Hi ${booking.name || 'there'},`,
      paragraphs: [['Your booth booking for ', { strong: showName }, ' is confirmed.']],
      details: [
        { label: 'Show', value: showName },
        { label: 'Vendor', value: booking.name },
      ],
      lineItems: {
        items: priced.items.map((item) => ({
          label: item.label,
          qty: item.qty,
          amount: formatMoneyExact(item.amount),
        })),
        totalLabel: 'Total charged',
        total: formatMoneyExact(priced.total),
      },
      link: {
        label: 'View your booking any time using this link:',
        url: `${env.siteUrl}${VENDOR_DASHBOARD_PATH}`,
      },
      footerNote: `you booked vendor space at ${showName} on Field & Arena.`,
    });
    const sent = await sendEmail({
      to: booking.contact,
      subject: 'Your Field & Arena vendor booking is confirmed',
      html,
      text,
    });
    if (!sent) console.error('[vendors] booking confirmation email was not delivered');
  } catch (cause) {
    console.error('[vendors] booking confirmation email failed', cause);
  }
}

export async function finalizeVendorBookingPayment(
  admin: AdminClient,
  booking: VendorBookingDbRow,
  priced: VendorPaidPricing,
  paymentIntentId: string | null,
): Promise<ConfirmVendorCheckoutResult> {
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
    // Only a live application can become paid — a booking the organizer
    // rejected (possibly after checkout started) must never flip to paid.
    .in('status', PAYABLE_BOOKING_STATUSES)
    .select()
    .maybeSingle();
  if (claimError) throw claimError;

  if (!claimed) {
    const { data: current, error: currentError } = await admin
      .from('vendor_bookings')
      .select('status')
      .eq('id', booking.id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (current?.status === REVIEW_BOOKING_STATUS) {
      return { ok: false, reason: 'review', bookingId: booking.id };
    }
    if (current?.status !== 'paid') {
      throw new Error(
        `Vendor booking ${booking.id} is ${current?.status ?? 'missing'} and cannot be marked paid.`,
      );
    }
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

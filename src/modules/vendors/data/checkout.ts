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
} from '@/modules/vendors/types';

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

export async function createVendorBookingStripeCustomer(
  booking: VendorBookingDbRow,
): Promise<string> {
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
  priced: PricedVendorBooking,
): Promise<void> {
  if (!booking.contact) return;
  const { data: show } = await admin
    .from('shows')
    .select('name')
    .eq('id', booking.show_id)
    .maybeSingle();

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

export async function finalizeVendorBookingPayment(
  admin: AdminClient,
  booking: VendorBookingDbRow,
  priced: PricedVendorBooking,
  paymentIntentId: string | null,
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

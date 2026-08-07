import 'server-only';
import type Stripe from 'stripe';
import { getStripeClient } from '@/shared/lib/stripe';
import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { env } from '@/shared/lib/env';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import type { Json } from '@/shared/types/database.types';
import { NON_CAPPED_ENTRY_STATUS } from '../constants';
import { parseTicketWindow, getTicketWindowStatus, riderCategoryToDivisionCode } from '../utils';
import type { CheckoutAddOnLine, CheckoutCartLine } from '../schemas';
import type {
  ClassEntryRow,
  FinalizeOrderResult,
  OrderLineItem,
  OrderRow,
  PricedCart,
  RiderRow,
} from '../types';

/**
 * The real backend for the rider checkout flow — cart pricing, Stripe
 * Checkout Session creation, and order fulfillment. Ported from legacy's
 * priceCart / handleCheckoutSessionCreate / finalizeOrder /
 * finalizeClaimedOrder / nextRiderNumberForShow (api/rider/[resource].js).
 *
 * Every exported function here takes an already-authenticated rider's id (or
 * full row) as a parameter — it is the CALLER's job (data/mutations.ts's
 * createCheckoutSession/confirmCheckoutSession, and the Stripe webhook route)
 * to resolve that from a real session or a verified Stripe event before
 * calling in. Nothing here is itself a Server Action or a route handler, and
 * that is deliberate: a `'use server'` export is directly callable by any
 * client with arbitrary arguments (layers.md's "every read and write must be
 * safe under the caller's role"), and finalizeOrder in particular takes a
 * pre-resolved `order` row and `rider` row as trusted input — exporting that
 * as a Server Action would let a forged request skip every check in
 * priceCart and mark an arbitrary order paid. This file has no 'use server'
 * pragma for exactly that reason; it is reachable only by other server-side
 * code that has already done its own authorization.
 *
 * Everything here uses the service-role admin client, passed in by the
 * caller rather than created here — mirrors legacy's own unrestricted
 * server-side DB access (there was no RLS at all in that codebase) and
 * matches this schema's own documented intent: orders_select_owner /
 * class_entries_write RLS (20260727120900_rls.sql) deliberately have no
 * rider insert policy, with the comment "Writes never come from a client...
 * because the amounts must be computed server-side and reconciled against
 * Stripe." This module is that reconciliation code.
 */

type AdminClient = ReturnType<typeof createAdminClient>;

function allIn(price: number | null, feeModel: string | null): number {
  const base = price ?? 0;
  return base + calcPlatformFee(base, feeModel);
}

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
 * Prices and fully validates a cart server-side. Throws a rider-facing
 * message (never a raw Postgres/Stripe error) on the first failed check,
 * matching legacy's "reject the whole quote on the first bad line" stance —
 * partially pricing a cart the client can't actually check out is worse than
 * one clear error.
 */
export async function priceCart(
  admin: AdminClient,
  riderId: string,
  showId: string,
  cart: CheckoutCartLine[],
  addOnLines: CheckoutAddOnLine[]
): Promise<PricedCart> {
  if (cart.length === 0 && addOnLines.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const { data: show, error: showError } = await admin
    .from('shows')
    .select('*')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show?.published) throw new Error('This show is not open for entries.');

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('*')
    .eq('id', show.org_id)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!org || org.suspended || org.is_demo) throw new Error('This show is not open for entries.');

  // Real enforcement of the ticket-sale window — the UI gates on this too
  // (getTicketWindowStatus, same util), but that is advisory only. This is
  // what actually stops a purchase outside the window.
  const windowStatus = getTicketWindowStatus(parseTicketWindow(show));
  if (windowStatus === 'not_open_yet') {
    throw new Error('Ticket sales for this show have not opened yet.');
  }
  if (windowStatus === 'closed') {
    throw new Error('Ticket sales for this show have closed.');
  }

  if (show.waiver_text && show.waiver_text.trim().length > 0) {
    const { data: signature, error: waiverError } = await admin
      .from('waiver_signatures')
      .select('id')
      .eq('rider_id', riderId)
      .eq('show_id', showId)
      .maybeSingle();
    if (waiverError) throw waiverError;
    if (!signature) {
      throw new Error("You must sign this show's waiver of liability before entering.");
    }
  }

  // Validate every cart line up front — each class must belong to this show,
  // each horse must belong to this rider.
  const perClassAdds = new Map<string, number>();
  for (const line of cart) {
    perClassAdds.set(line.classId, (perClassAdds.get(line.classId) ?? 0) + 1);
  }
  const classIds = [...perClassAdds.keys()];
  const classRowsResult = classIds.length
    ? await admin.from('classes').select('*').in('id', classIds)
    : { data: [], error: null };
  if (classRowsResult.error) throw classRowsResult.error;
  const classById = new Map(classRowsResult.data.map((c) => [c.id, c]));
  for (const classId of classIds) {
    if (classById.get(classId)?.show_id !== showId) {
      throw new Error('One of the selected classes was not found.');
    }
  }

  const horseIds = [...new Set(cart.map((line) => line.horseId))];
  const horseRowsResult = horseIds.length
    ? await admin.from('horses').select('*').in('id', horseIds)
    : { data: [], error: null };
  if (horseRowsResult.error) throw horseRowsResult.error;
  const horseById = new Map(horseRowsResult.data.map((h) => [h.id, h]));
  for (const horseId of horseIds) {
    if (horseById.get(horseId)?.rider_id !== riderId) {
      throw new Error('One of the selected horses is not on your account.');
    }
  }

  // Rider cap per class — 0/unset means no cap, same as legacy's classCapCheck.
  const cap = (show.schedule_extras as { maxRidersPerEvent?: number } | null)?.maxRidersPerEvent ?? 0;
  if (cap > 0) {
    for (const [classId, addingCount] of perClassAdds) {
      const { data: existingEntries, error: entriesError } = await admin
        .from('class_entries')
        .select('status')
        .eq('class_id', classId);
      if (entriesError) throw entriesError;
      const activeCount = existingEntries.filter((e) => e.status !== NON_CAPPED_ENTRY_STATUS).length;
      if (activeCount + addingCount > cap) {
        const label = classById.get(classId)?.label ?? 'This class';
        throw new Error(`"${label}" is already at its rider cap.`);
      }
    }
  }

  const qualTypeIds = [...new Set(cart.flatMap((line) => line.qualTypeIds ?? []))];
  const qualRowsResult = qualTypeIds.length
    ? await admin.from('qual_types').select('*').in('id', qualTypeIds)
    : { data: [], error: null };
  if (qualRowsResult.error) throw qualRowsResult.error;
  const qualById = new Map(qualRowsResult.data.map((q) => [q.id, q]));

  const feeModel = org.fee_model;
  const items: OrderLineItem[] = [];
  for (const line of cart) {
    const classRow = classById.get(line.classId);
    const horse = horseById.get(line.horseId);
    if (!classRow || !horse) continue; // already validated above; narrows for TS
    const amount = round2(allIn(classRow.fee, feeModel));
    items.push({
      kind: 'class_entry',
      label: `${classRow.label} — ${horse.name}`,
      classId: classRow.id,
      horseId: horse.id,
      qty: 1,
      unitPrice: amount,
      amount,
    });
    for (const qualTypeId of line.qualTypeIds ?? []) {
      const qual = qualById.get(qualTypeId);
      if (!qual) continue;
      const qualAmount = round2(allInFlat8(qual.price));
      items.push({
        kind: 'qualification',
        label: `${qual.name} — ${classRow.label}`,
        classId: classRow.id,
        horseId: horse.id,
        qty: 1,
        unitPrice: qualAmount,
        amount: qualAmount,
      });
    }
  }

  // Add-on inventory: qty null = unlimited, otherwise capped against every
  // paid order's already-sold quantity for this show.
  const addOnIds = addOnLines.map((line) => line.addOnId);
  const addOnRowsResult = addOnIds.length
    ? await admin.from('add_ons').select('*').in('id', addOnIds)
    : { data: [], error: null };
  if (addOnRowsResult.error) throw addOnRowsResult.error;
  const addOnById = new Map(addOnRowsResult.data.map((a) => [a.id, a]));

  const { data: paidOrders, error: paidOrdersError } = await admin
    .from('orders')
    .select('items')
    .eq('show_id', showId)
    .eq('status', 'paid');
  if (paidOrdersError) throw paidOrdersError;

  for (const line of addOnLines) {
    const addOn = addOnById.get(line.addOnId);
    if (addOn?.show_id !== showId) {
      throw new Error('Invalid add-on selection.');
    }
    if (addOn.qty != null) {
      const sold = paidOrders.reduce((sum, order) => {
        const orderItems = (order.items ?? []) as unknown as OrderLineItem[];
        const addOnQty = orderItems
          .filter((item) => item.kind === 'addon' && item.refId === addOn.id)
          .reduce((s, item) => s + item.qty, 0);
        return sum + addOnQty;
      }, 0);
      if (sold + line.qty > addOn.qty) {
        throw new Error(`"${addOn.name}" doesn't have enough left.`);
      }
    }
    const unitAmount = round2(allInFlat8(addOn.price));
    items.push({
      kind: 'addon',
      label: addOn.name,
      refId: addOn.id,
      qty: line.qty,
      unitPrice: unitAmount,
      amount: round2(unitAmount * line.qty),
    });
  }

  const total = round2(items.reduce((sum, item) => sum + item.amount, 0));
  if (total <= 0) throw new Error('Nothing to charge.');

  // application_fee_amount = the sum of calcPlatformFee() over each item's
  // own base price — every item's `amount` above already has that fee baked
  // in (allIn()/allInFlat8()), so this recomputes it directly from the same
  // source prices rather than reversing it back out of `amount`.
  let feeTotal = 0;
  for (const line of cart) {
    const classRow = classById.get(line.classId);
    if (classRow) feeTotal += calcPlatformFee(classRow.fee ?? 0, feeModel);
    for (const qualTypeId of line.qualTypeIds ?? []) {
      const qual = qualById.get(qualTypeId);
      if (qual) feeTotal += calcPlatformFeeFlat8(qual.price ?? 0);
    }
  }
  for (const line of addOnLines) {
    const addOn = addOnById.get(line.addOnId);
    if (addOn) feeTotal += calcPlatformFeeFlat8(addOn.price ?? 0) * line.qty;
  }
  feeTotal = round2(feeTotal);

  let chargesEnabled = false;
  if (org.stripe_connect_account_id) {
    try {
      const stripe = getStripeClient();
      const account = await stripe.accounts.retrieve(org.stripe_connect_account_id);
      chargesEnabled = account.charges_enabled;
    } catch {
      chargesEnabled = false;
    }
  }

  return {
    showId,
    currency: (org.currency ?? 'usd').toLowerCase(),
    stripeConnectAccountId: chargesEnabled ? org.stripe_connect_account_id : null,
    items,
    total,
    feeTotal,
    chargesEnabled,
  };
}

/**
 * A real Stripe Customer, one per checkout — what makes charging the same
 * card again later (an organizer's "Charge additional amount") possible,
 * since a bare PaymentIntent's setup_future_usage alone can't be reused
 * off-session without a Customer the saved payment_method is attached to.
 */
export async function createOrderStripeCustomer(rider: RiderRow): Promise<string> {
  const stripe = getStripeClient();
  const name = `${rider.first_name ?? ''} ${rider.last_name ?? ''}`.trim();
  const customer = await stripe.customers.create({
    email: rider.email,
    name: name || undefined,
    metadata: { riderId: rider.id },
  });
  return customer.id;
}

/**
 * Persists the reusable customer+payment_method captured by
 * setup_future_usage:'off_session' once the PaymentIntent has actually
 * succeeded. Called from both confirm paths (in-page confirm and the
 * webhook) — best-effort, never throws, since a lookup failure here must
 * never block a real, already-verified payment from fulfilling.
 */
export async function saveOffSessionCard(
  admin: AdminClient,
  orderId: string,
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
    .from('orders')
    .update({ stripe_customer_id: stripeCustomerId, stripe_payment_method_id: stripePaymentMethodId })
    .eq('id', orderId);
}

async function nextRiderNumberForShow(
  admin: AdminClient,
  showId: string,
  riderId: string
): Promise<string> {
  const { data: show, error: showError } = await admin
    .from('shows')
    .select('starting_rider_number')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  const base = show?.starting_rider_number ?? 101;

  const { data: classRows, error: classError } = await admin
    .from('classes')
    .select('id')
    .eq('show_id', showId);
  if (classError) throw classError;
  const classIds = classRows.map((c) => c.id);
  if (!classIds.length) return String(base).padStart(4, '0');

  const { data: mine, error: mineError } = await admin
    .from('class_entries')
    .select('num')
    .in('class_id', classIds)
    .eq('rider_id', riderId)
    .limit(1);
  if (mineError) throw mineError;
  const [firstMine] = mine;
  if (firstMine) return firstMine.num;

  const { data: distinctRows, error: distinctError } = await admin
    .from('class_entries')
    .select('rider_id')
    .in('class_id', classIds)
    .not('rider_id', 'is', null);
  if (distinctError) throw distinctError;
  const distinctRiderCount = new Set(distinctRows.map((r) => r.rider_id)).size;
  return String(base + distinctRiderCount).padStart(4, '0');
}

/**
 * Creates one class_entries row per class_entry line item, assigns a
 * show-scoped sequential rider number, and re-checks the class cap right
 * before each insert. That re-check narrows (but, without a real row lock,
 * cannot fully close) the race two simultaneous checkouts create: since
 * payment has already been captured by this point and refunding isn't wired
 * up here, an over-cap entry is still created rather than discarding a paid
 * charge — flagged via `correction` so the organizer sees it needs review.
 * Ported from legacy's finalizeClaimedOrder.
 */
async function finalizeClaimedOrder(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow
): Promise<FinalizeOrderResult> {
  const riderName = `${rider.first_name ?? ''} ${rider.last_name ?? ''}`.trim();
  const riderNum = await nextRiderNumberForShow(admin, order.show_id, rider.id);
  const divisionCode = riderCategoryToDivisionCode(rider.category);

  const items = (order.items ?? []) as unknown as OrderLineItem[];
  const horseIds = [
    ...new Set(
      items
        .map((item) => (item.kind === 'class_entry' ? item.horseId : undefined))
        .filter((horseId): horseId is string => Boolean(horseId))
    ),
  ];
  const horseRowsResult = horseIds.length
    ? await admin.from('horses').select('*').in('id', horseIds)
    : { data: [], error: null };
  if (horseRowsResult.error) throw horseRowsResult.error;
  const horseById = new Map(horseRowsResult.data.map((h) => [h.id, h]));

  const { data: show, error: showError } = await admin
    .from('shows')
    .select('schedule_extras')
    .eq('id', order.show_id)
    .maybeSingle();
  if (showError) throw showError;
  const capForShow = (show?.schedule_extras as { maxRidersPerEvent?: number } | null)?.maxRidersPerEvent ?? 0;

  const nextOrderByClass = new Map<string, number>();
  const activeCountByClass = new Map<string, number>();
  const created: ClassEntryRow[] = [];

  for (const item of items) {
    if (item.kind !== 'class_entry' || !item.classId) continue;
    const classId = item.classId;
    if (!nextOrderByClass.has(classId)) {
      const { data: existing, error: existingError } = await admin
        .from('class_entries')
        .select('ride_order, status')
        .eq('class_id', classId);
      if (existingError) throw existingError;
      const maxRideOrder = existing.reduce((max, e) => Math.max(max, e.ride_order), -1);
      nextOrderByClass.set(classId, maxRideOrder + 1);
      activeCountByClass.set(
        classId,
        existing.filter((e) => e.status !== NON_CAPPED_ENTRY_STATUS).length
      );
    }
    const activeCount = activeCountByClass.get(classId) ?? 0;
    const overCap = capForShow > 0 && activeCount + 1 > capForShow;
    const horse = item.horseId ? horseById.get(item.horseId) : undefined;

    const { data: row, error: insertError } = await admin
      .from('class_entries')
      .insert({
        class_id: classId,
        draw: null,
        num: riderNum,
        rider: riderName,
        horse: horse?.name ?? null,
        rider_id: rider.id,
        horse_id: item.horseId ?? null,
        order_id: order.id,
        ride_order: nextOrderByClass.get(classId) ?? 0,
        status: 'scheduled',
        division: divisionCode,
        correction: overCap
          ? "Created over this class's rider cap — two checkouts likely raced for the last slot. Needs organizer review."
          : null,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    nextOrderByClass.set(classId, (nextOrderByClass.get(classId) ?? 0) + 1);
    activeCountByClass.set(classId, activeCount + 1);
    created.push(row);
  }

  return {
    ok: true,
    entries: created,
    riderNumber: riderNum,
    orderId: order.id,
    total: order.amount_total,
    items,
  };
}

/**
 * Best-effort confirmation email, reusing the same raw-Resend-fetch pattern
 * as modules/staff/data/mutations.ts's sendStaffInviteNotification (this
 * codebase's one existing transactional-email call site outside Supabase
 * Auth's own SMTP flows). Never throws — the order is already paid and
 * fulfilled by the time this runs, so an email failure must not surface as a
 * checkout error.
 */
async function sendOrderConfirmationEmail(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow,
  result: FinalizeOrderResult
): Promise<void> {
  const { data: show } = await admin.from('shows').select('name').eq('id', order.show_id).maybeSingle();
  const riderName = `${rider.first_name ?? ''} ${rider.last_name ?? ''}`.trim() || rider.email;
  const rows = result.items
    .map((item) => `<li>${escapeHtml(item.label)}${item.qty > 1 ? ` × ${String(item.qty)}` : ''}</li>`)
    .join('');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Field & Arena <notifications@field-arena.com>',
        to: rider.email,
        subject: 'Your Field & Arena order is confirmed',
        html:
          `<p>Hi ${escapeHtml(riderName)},</p>` +
          `<p>Your entry for <b>${escapeHtml(show?.name ?? 'your show')}</b> is confirmed. ` +
          `Rider number: <b>${escapeHtml(result.riderNumber ?? '')}</b>.</p>` +
          `<ul>${rows}</ul>` +
          `<p>Total charged: $${result.total.toFixed(2)}</p>`,
      }),
    });
    if (!res.ok) {
      console.error('[riders] order confirmation email failed', res.status, await res.text());
    }
  } catch (cause) {
    console.error('[riders] order confirmation email transport failure', cause);
  }
}

/**
 * Fulfillment itself — the one place "what happens when an order gets paid"
 * is implemented. Both the in-page confirm path (data/mutations.ts's
 * confirmCheckoutSession) and the Stripe webhook route call this same
 * function after independently verifying payment their own way, so there is
 * only one fulfillment implementation to ever drift.
 *
 * Atomically claims the order before creating anything: the conditional
 * `UPDATE ... WHERE status = 'pending'` lets exactly one caller win a race
 * (a double-click, the webhook and the in-page confirm landing at nearly the
 * same instant); the loser sees zero rows updated and returns the
 * already-fulfilled read instead of inserting a second set of class_entries.
 */
export async function finalizeOrder(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow
): Promise<FinalizeOrderResult> {
  const { data: claimed, error: claimError } = await admin
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();
  if (claimError) throw claimError;

  if (!claimed) {
    const { data: entries, error: entriesError } = await admin
      .from('class_entries')
      .select('*')
      .eq('order_id', order.id);
    if (entriesError) throw entriesError;
    return {
      ok: true,
      alreadyFulfilled: true,
      entries,
      riderNumber: entries[0]?.num ?? null,
      orderId: order.id,
      total: order.amount_total,
      items: (order.items ?? []) as unknown as OrderLineItem[],
    };
  }

  try {
    const result = await finalizeClaimedOrder(admin, claimed, rider);
    await sendOrderConfirmationEmail(admin, claimed, rider, result);
    return result;
  } catch (fulfillError) {
    // Charged but fulfillment threw after the claim — revert to 'pending' so
    // a retry (or a support replay) can complete it, rather than stranding a
    // paid order that can never be fulfilled.
    await admin
      .from('orders')
      .update({ status: 'pending', paid_at: null })
      .eq('id', order.id)
      .then(
        () => undefined,
        () => undefined
      );
    throw fulfillError;
  }
}

/** Builds the priced items into Stripe Checkout Session line items. */
export function buildStripeLineItems(
  items: OrderLineItem[],
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

/** items -> Json for the orders.items column, isolated so the cast lives in one place. */
export function itemsToJson(items: OrderLineItem[]): Json {
  return items as unknown as Json;
}

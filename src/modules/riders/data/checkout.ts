import 'server-only';
import type Stripe from 'stripe';
import { getStripeClient } from '@/shared/lib/stripe';
import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { env } from '@/shared/lib/env';
import { UserFacingError } from '@/shared/lib/action-result';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import type { Json } from '@/shared/types/database.types';
import {
  DEFAULT_STARTING_RIDER_NUMBER,
  NON_CAPPED_ENTRY_STATUS,
  RIDER_NUMBER_PAD_WIDTH,
} from '@/modules/riders/constants';
import { parseTicketWindow } from '@/modules/riders/utils/parse-ticket-window';
import { getTicketWindowStatus } from '@/modules/riders/utils/get-ticket-window-status';
import { riderCategoryToDivisionCode } from '@/modules/riders/utils/rider-category-to-division-code';
import type { CheckoutAddOnLine, CheckoutCartLine } from '@/modules/riders/schemas';
import type {
  ClassEntryRow,
  FinalizeOrderResult,
  OrderLineItem,
  OrderRow,
  PricedCart,
  RiderRow,
} from '@/modules/riders/types';

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

export async function priceCart(
  admin: AdminClient,
  riderId: string,
  showId: string,
  cart: CheckoutCartLine[],
  addOnLines: CheckoutAddOnLine[],
): Promise<PricedCart> {
  if (cart.length === 0 && addOnLines.length === 0) {
    throw new UserFacingError('Your cart is empty.');
  }

  const { data: show, error: showError } = await admin
    .from('shows')
    .select('*')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show?.published) throw new UserFacingError('This show is not open for entries.');

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('*')
    .eq('id', show.org_id)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!org || org.suspended || org.is_demo)
    throw new UserFacingError('This show is not open for entries.');

  const windowStatus = getTicketWindowStatus(parseTicketWindow(show));
  if (windowStatus === 'not_open_yet') {
    throw new UserFacingError('Ticket sales for this show have not opened yet.');
  }
  if (windowStatus === 'closed') {
    throw new UserFacingError('Ticket sales for this show have closed.');
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
      throw new UserFacingError("You must sign this show's waiver of liability before entering.");
    }
  }

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
      throw new UserFacingError('One of the selected classes was not found.');
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
      throw new UserFacingError('One of the selected horses is not on your account.');
    }
  }

  const cap =
    (show.schedule_extras as { maxRidersPerEvent?: number } | null)?.maxRidersPerEvent ?? 0;
  if (cap > 0) {
    for (const [classId, addingCount] of perClassAdds) {
      const { data: existingEntries, error: entriesError } = await admin
        .from('class_entries')
        .select('status')
        .eq('class_id', classId);
      if (entriesError) throw entriesError;
      const activeCount = existingEntries.filter(
        (e) => e.status !== NON_CAPPED_ENTRY_STATUS,
      ).length;
      if (activeCount + addingCount > cap) {
        const label = classById.get(classId)?.label ?? 'This class';
        throw new UserFacingError(`"${label}" is already at its rider cap.`);
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
    if (!classRow || !horse) continue;
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
      throw new UserFacingError('Invalid add-on selection.');
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
        throw new UserFacingError(`"${addOn.name}" doesn't have enough left.`);
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
  if (total <= 0) throw new UserFacingError('Nothing to charge.');

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

export async function saveOffSessionCard(
  admin: AdminClient,
  orderId: string,
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
    .from('orders')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
    })
    .eq('id', orderId);
}

async function nextRiderNumberForShow(
  admin: AdminClient,
  showId: string,
  riderId: string,
): Promise<string> {
  const { data: show, error: showError } = await admin
    .from('shows')
    .select('starting_rider_number')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  const base = show?.starting_rider_number ?? DEFAULT_STARTING_RIDER_NUMBER;

  const { data: classRows, error: classError } = await admin
    .from('classes')
    .select('id')
    .eq('show_id', showId);
  if (classError) throw classError;
  const classIds = classRows.map((c) => c.id);
  if (!classIds.length) return String(base).padStart(RIDER_NUMBER_PAD_WIDTH, '0');

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
  return String(base + distinctRiderCount).padStart(RIDER_NUMBER_PAD_WIDTH, '0');
}

async function finalizeClaimedOrder(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow,
): Promise<FinalizeOrderResult> {
  const riderName = `${rider.first_name ?? ''} ${rider.last_name ?? ''}`.trim();
  const riderNum = await nextRiderNumberForShow(admin, order.show_id, rider.id);
  const divisionCode = riderCategoryToDivisionCode(rider.category);

  const items = (order.items ?? []) as unknown as OrderLineItem[];
  const horseIds = [
    ...new Set(
      items
        .map((item) => (item.kind === 'class_entry' ? item.horseId : undefined))
        .filter((horseId): horseId is string => Boolean(horseId)),
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
  const capForShow =
    (show?.schedule_extras as { maxRidersPerEvent?: number } | null)?.maxRidersPerEvent ?? 0;

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
        existing.filter((e) => e.status !== NON_CAPPED_ENTRY_STATUS).length,
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

async function sendOrderConfirmationEmail(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow,
  result: FinalizeOrderResult,
): Promise<void> {
  const { data: show } = await admin
    .from('shows')
    .select('name')
    .eq('id', order.show_id)
    .maybeSingle();
  const riderName = `${rider.first_name ?? ''} ${rider.last_name ?? ''}`.trim() || rider.email;
  const rows = result.items
    .map(
      (item) => `<li>${escapeHtml(item.label)}${item.qty > 1 ? ` × ${String(item.qty)}` : ''}</li>`,
    )
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

export async function finalizeOrder(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow,
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
    await admin
      .from('orders')
      .update({ status: 'pending', paid_at: null })
      .eq('id', order.id)
      .then(
        () => undefined,
        () => undefined,
      );
    throw fulfillError;
  }
}

export function buildStripeLineItems(
  items: OrderLineItem[],
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

export function itemsToJson(items: OrderLineItem[]): Json {
  return items as unknown as Json;
}

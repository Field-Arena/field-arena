import 'server-only';
import type Stripe from 'stripe';
import { getStripeClient } from '@/shared/lib/stripe';
import { calcPlatformFee, calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { env } from '@/shared/lib/env';
import { sendEmail } from '@/shared/lib/email';
import { renderEmail } from '@/shared/lib/email-layout';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { ROUTES } from '@/shared/constants/routes';
import { UserFacingError } from '@/shared/lib/action-result';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import type { Json } from '@/shared/types/database.types';
import {
  CHECKOUT_SESSION_TTL_SECONDS,
  CLAIMABLE_ORDER_STATUSES,
  DEFAULT_STARTING_RIDER_NUMBER,
  NON_CAPPED_ENTRY_STATUS,
  RIDER_NUMBER_PAD_WIDTH,
} from '@/modules/riders/constants';
import { parseTicketWindow } from '@/modules/riders/utils/parse-ticket-window';
import { getTicketWindowStatus } from '@/modules/riders/utils/get-ticket-window-status';
import { riderCategoryToDivisionCode } from '@/modules/riders/utils/rider-category-to-division-code';
import type {
  CheckoutAddOnLine,
  CheckoutCartLine,
  CheckoutStablingDetails,
} from '@/modules/riders/schemas';
import type {
  ClassEntryRow,
  ConfirmCheckoutResult,
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

/* Two lines for the same add-on (qty 3 + qty 3) would each pass the stock
 * check on their own while together overselling it. Collapse them into one
 * line per add-on before anything is checked or priced. */
function mergeAddOnLines(lines: CheckoutAddOnLine[]): CheckoutAddOnLine[] {
  const merged = new Map<string, CheckoutAddOnLine>();
  for (const line of lines) {
    const existing = merged.get(line.addOnId);
    merged.set(
      line.addOnId,
      existing ? { ...existing, qty: existing.qty + line.qty } : { ...line },
    );
  }
  return [...merged.values()];
}

const ORDER_PAGE_SIZE = 1000;

/* Units of each add-on already committed for a show. Paid orders always
 * count. With `holdPendingFor`, orders still pending inside a live Checkout
 * Session window count too (a soft reservation — two riders cannot both buy
 * the last stall just because neither has paid yet), except that rider's own
 * pending orders, so going back and re-starting checkout never blocks them.
 * Paged so a show past 1000 orders is still counted in full. */
async function addOnUnitsCommitted(
  admin: AdminClient,
  showId: string,
  addOnIds: string[],
  opts: { excludeOrderId?: string; holdPendingFor?: { riderId: string } } = {},
): Promise<Map<string, number>> {
  const committed = new Map<string, number>();
  if (addOnIds.length === 0) return committed;
  const wanted = new Set(addOnIds);
  const pendingSince = new Date(Date.now() - CHECKOUT_SESSION_TTL_SECONDS * 1000).toISOString();
  const statuses = opts.holdPendingFor ? ['paid', 'pending'] : ['paid'];

  for (let from = 0; ; from += ORDER_PAGE_SIZE) {
    const { data, error } = await admin
      .from('orders')
      .select('id, rider_id, status, created_at, items')
      .eq('show_id', showId)
      .in('status', statuses)
      .order('id')
      .range(from, from + ORDER_PAGE_SIZE - 1);
    if (error) throw error;
    for (const order of data) {
      if (order.id === opts.excludeOrderId) continue;
      if (order.status === 'pending') {
        if (order.rider_id === opts.holdPendingFor?.riderId) continue;
        if (order.created_at < pendingSince) continue;
      }
      for (const item of (order.items ?? []) as unknown as OrderLineItem[]) {
        if (item.kind !== 'addon' || !item.refId || !wanted.has(item.refId)) continue;
        committed.set(item.refId, (committed.get(item.refId) ?? 0) + item.qty);
      }
    }
    if (data.length < ORDER_PAGE_SIZE) break;
  }
  return committed;
}

export async function priceCart(
  admin: AdminClient,
  riderId: string,
  showId: string,
  cart: CheckoutCartLine[],
  rawAddOnLines: CheckoutAddOnLine[],
): Promise<PricedCart> {
  const addOnLines = mergeAddOnLines(rawAddOnLines);
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
    ? await admin
        .from('qual_types')
        .select('*')
        .in('id', qualTypeIds)
        .eq('show_id', showId)
        .eq('enabled', true)
    : { data: [], error: null };
  if (qualRowsResult.error) throw qualRowsResult.error;
  const qualById = new Map(qualRowsResult.data.map((q) => [q.id, q]));
  // Only this show's enabled qualifications can be bought — the same set the
  // class picker offers. Anything else is a tampered or stale cart.
  for (const qualTypeId of qualTypeIds) {
    if (!qualById.has(qualTypeId)) {
      throw new UserFacingError('One of the selected qualifications is not available.');
    }
  }

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
      ...(line.testChoice ? { testChoice: line.testChoice } : {}),
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

  const committedByAddOn = await addOnUnitsCommitted(
    admin,
    showId,
    addOnRowsResult.data.filter((a) => a.qty != null).map((a) => a.id),
    { holdPendingFor: { riderId } },
  );

  for (const line of addOnLines) {
    const addOn = addOnById.get(line.addOnId);
    if (addOn?.show_id !== showId) {
      throw new UserFacingError('Invalid add-on selection.');
    }
    if (addOn.qty != null) {
      const sold = committedByAddOn.get(addOn.id) ?? 0;
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

  const needsStablingDetails = addOnLines.some((line) => {
    const addOn = addOnById.get(line.addOnId);
    return !!addOn && ((addOn.stalls ?? 0) > 0 || (addOn.tack ?? 0) > 0);
  });

  return {
    showId,
    currency: (org.currency ?? 'usd').toLowerCase(),
    stripeConnectAccountId: chargesEnabled ? org.stripe_connect_account_id : null,
    items,
    total,
    feeTotal,
    chargesEnabled,
    needsStablingDetails,
  };
}

/* Reuses the Stripe customer from the rider's earlier orders (orders is the
 * only place a rider's customer id is stored) instead of minting a new one on
 * every checkout attempt. */
export async function createOrderStripeCustomer(
  admin: AdminClient,
  rider: RiderRow,
): Promise<string> {
  const { data: previous, error: previousError } = await admin
    .from('orders')
    .select('stripe_customer_id')
    .eq('rider_id', rider.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousError) throw previousError;
  if (previous?.stripe_customer_id) return previous.stripe_customer_id;

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

/* Test of Choice: `item.testChoice` carries whatever string the rider picked
 * from the class's `test_options` (e.g. "Training — Training Level Test 1
 * (2023)", the FM_SETS/toc-dialog format). scoring_catalog titles are plain
 * ("Training Level Test 1") — strip the level prefix and the trailing year
 * before matching so both naming conventions resolve to the same row.
 * A choice with no catalog match still gets a { name } override so ribbons
 * still group correctly by test even without the full movements/collectives
 * snapshot — degrading gracefully beats blocking checkout on a data gap. */
function normalizeTestChoice(raw: string): string {
  return raw
    .replace(/^[^—-]+[—-]\s*/, '')
    .replace(/\s*\(\d{4}\)\s*$/, '')
    .trim()
    .toLowerCase();
}

async function buildTestOverrideLookup(
  admin: AdminClient,
  items: OrderLineItem[],
): Promise<Map<string, Json>> {
  const choices = [
    ...new Set(
      items
        .filter((item) => item.kind === 'class_entry')
        .map((item) => item.testChoice)
        .filter((testChoice): testChoice is string => Boolean(testChoice)),
    ),
  ];
  const lookup = new Map<string, Json>();
  if (choices.length === 0) return lookup;

  const { data: catalog, error } = await admin
    .from('scoring_catalog')
    .select('title, def')
    .eq('family', 'movement');
  if (error) throw error;

  const byNormalizedTitle = new Map(catalog.map((row) => [row.title.toLowerCase(), row]));

  for (const choice of choices) {
    const match = byNormalizedTitle.get(normalizeTestChoice(choice));
    const def = match?.def as { movements?: unknown; collectives?: unknown } | null;
    lookup.set(choice, {
      name: match?.title ?? choice,
      movements: (def?.movements ?? []) as Json,
      collectives: (def?.collectives ?? []) as Json,
    });
  }
  return lookup;
}

/* Materializes the stabling details captured pre-payment (order.stabling_request,
 * an ephemeral jsonb staging field) into a real stabling_requests row — but
 * only for a PAID order, same guarantee class_entries already gives, since
 * this runs inside finalizeClaimedOrder right alongside them. horse_stalls/
 * tack_stalls are derived here rather than trusted from the client, by
 * summing qty * add_ons.stalls / add_ons.tack across the order's own addon
 * line items. */
async function materializeStablingRequest(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow,
  items: OrderLineItem[],
): Promise<void> {
  const details = order.stabling_request as CheckoutStablingDetails | null;
  if (!details?.trainerName) return;

  const addOnIds = [
    ...new Set(
      items
        .filter((item) => item.kind === 'addon')
        .map((item) => item.refId)
        .filter((refId): refId is string => Boolean(refId)),
    ),
  ];
  if (!addOnIds.length) return;

  const { data: addOnRows, error: addOnError } = await admin
    .from('add_ons')
    .select('id, stalls, tack')
    .in('id', addOnIds);
  if (addOnError) throw addOnError;
  const addOnById = new Map(addOnRows.map((a) => [a.id, a]));

  let horseStalls = 0;
  let tackStalls = 0;
  for (const item of items) {
    if (item.kind !== 'addon' || !item.refId) continue;
    const addOn = addOnById.get(item.refId);
    if (!addOn) continue;
    horseStalls += (addOn.stalls ?? 0) * item.qty;
    tackStalls += (addOn.tack ?? 0) * item.qty;
  }
  if (horseStalls === 0 && tackStalls === 0) return;

  // stabling_requests is unique per order: a retried fulfilment that already
  // got this far must not fail on (or duplicate) the row.
  const { data: existingRequest, error: existingError } = await admin
    .from('stabling_requests')
    .select('id')
    .eq('order_id', order.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingRequest) return;

  const { error: insertError } = await admin.from('stabling_requests').insert({
    show_id: order.show_id,
    order_id: order.id,
    rider_id: rider.id,
    trainer_name: details.trainerName,
    horse_stalls: horseStalls,
    tack_stalls: tackStalls,
    stable_with: details.stableWith ?? null,
    notes: details.notes ?? null,
  });
  if (insertError) throw insertError;
}

/* Add-on stock race. priceCart checks stock (paid + recent pending orders)
 * when checkout starts, but two checkouts can still pass that check together
 * and both get paid. Chosen approach: re-check at fulfilment against the
 * other PAID orders, and if this order pushes an add-on over its stock, still
 * fulfil it — the rider has paid, and silently dropping a paid line (or
 * failing the whole fulfilment, which Stripe would retry forever) is worse
 * than an oversell — but flag the order (review_reason) so the organizer can
 * refund or make room. Holding stock with a DB reservation table would close
 * the window completely but is far more machinery than the rare race needs.
 * Best-effort: a failure here is logged and never blocks fulfilment. */
async function flagOversoldAddOns(
  admin: AdminClient,
  order: OrderRow,
  items: OrderLineItem[],
): Promise<void> {
  try {
    const qtyByAddOn = new Map<string, number>();
    for (const item of items) {
      if (item.kind !== 'addon' || !item.refId) continue;
      qtyByAddOn.set(item.refId, (qtyByAddOn.get(item.refId) ?? 0) + item.qty);
    }
    if (qtyByAddOn.size === 0) return;

    const { data: addOns, error } = await admin
      .from('add_ons')
      .select('id, name, qty')
      .in('id', [...qtyByAddOn.keys()])
      .not('qty', 'is', null);
    if (error) throw error;
    if (addOns.length === 0) return;

    const committed = await addOnUnitsCommitted(
      admin,
      order.show_id,
      addOns.map((a) => a.id),
      { excludeOrderId: order.id },
    );
    const oversold = addOns
      .filter((a) => (committed.get(a.id) ?? 0) + (qtyByAddOn.get(a.id) ?? 0) > a.qty)
      .map(
        (a) =>
          `"${a.name}" (stock ${String(a.qty)}, sold ${String((committed.get(a.id) ?? 0) + (qtyByAddOn.get(a.id) ?? 0))} incl. this order)`,
      );
    if (oversold.length === 0) return;

    console.error('[riders] add-on oversold at fulfilment', order.id, oversold);
    const { error: flagError } = await admin
      .from('orders')
      .update({
        review_reason: `Add-on oversold at fulfilment — two checkouts raced for the last units: ${oversold.join('; ')}. The order was fulfilled; refund or make room.`,
      })
      .eq('id', order.id);
    if (flagError) throw flagError;
  } catch (cause) {
    console.error('[riders] add-on oversell check failed', order.id, cause);
  }
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

  /* Fulfilment is idempotent per order. A previous attempt may have inserted
   * some entries and then failed (the order is then put back to pending and
   * the webhook / return page retries). Every entry carries order_id, so the
   * ones already created are picked up here and skipped below rather than
   * inserted a second time. Counted per class+horse so a retry recreates
   * exactly the entries still missing. */
  const { data: alreadyCreated, error: alreadyCreatedError } = await admin
    .from('class_entries')
    .select('*')
    .eq('order_id', order.id);
  if (alreadyCreatedError) throw alreadyCreatedError;
  const entryKey = (classId: string, horseId: string | null | undefined) =>
    `${classId}:${horseId ?? ''}`;
  const unclaimedExisting = new Map<string, ClassEntryRow[]>();
  for (const row of alreadyCreated) {
    const key = entryKey(row.class_id, row.horse_id);
    unclaimedExisting.set(key, [...(unclaimedExisting.get(key) ?? []), row]);
  }

  const testOverrideByChoice = await buildTestOverrideLookup(admin, items);

  for (const item of items) {
    if (item.kind !== 'class_entry' || !item.classId) continue;
    const classId = item.classId;

    const existingForItem = unclaimedExisting.get(entryKey(classId, item.horseId));
    const reused = existingForItem?.shift();
    if (reused) {
      created.push(reused);
      continue;
    }

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
        test_override: item.testChoice
          ? (testOverrideByChoice.get(item.testChoice) ?? { name: item.testChoice })
          : null,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    nextOrderByClass.set(classId, (nextOrderByClass.get(classId) ?? 0) + 1);
    activeCountByClass.set(classId, activeCount + 1);
    created.push(row);
  }

  await materializeStablingRequest(admin, order, rider, items);
  await flagOversoldAddOns(admin, order, items);

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
  const showName = show?.name ?? 'your show';

  // Runs inside finalize's try: anything thrown here would roll a paid order
  // back, so a rendering or delivery problem is logged and swallowed.
  try {
    const { html, text } = renderEmail({
      preheader: `Your entry for ${showName} is confirmed.`,
      eyebrow: 'Order confirmed',
      heading: 'Your entry is confirmed',
      greeting: `Hi ${riderName},`,
      paragraphs: [
        ['Your entry for ', { strong: showName }, ' is confirmed. Your receipt is below.'],
      ],
      details: [
        { label: 'Show', value: showName },
        ...(result.riderNumber ? [{ label: 'Rider number', value: result.riderNumber }] : []),
      ],
      lineItems: {
        items: result.items.map((item) => ({
          label: item.label,
          qty: item.qty,
          amount: formatMoneyExact(item.amount),
        })),
        totalLabel: 'Total charged',
        total: formatMoneyExact(result.total),
      },
      link: {
        label: 'See your entries and upload documents using this link:',
        url: `${env.siteUrl}${ROUTES.rider}`,
      },
      footerNote: `you entered ${showName} on Field & Arena.`,
    });

    const sent = await sendEmail({
      to: rider.email,
      subject: 'Your Field & Arena order is confirmed',
      html,
      text,
    });
    if (!sent) console.error('[riders] order confirmation email was not delivered');
  } catch (cause) {
    console.error('[riders] order confirmation email failed', cause);
  }
}

/* N8: what to show for an order this process did not claim. Only a 'paid'
 * order whose entries all exist is "already fulfilled". 'paid' with entries
 * still missing means another process (webhook vs return page) is mid-
 * fulfilment, and any other unpaid state means that attempt rolled back —
 * both are 'processing'. 'failed' is an order set aside for review. Never
 * returns a partial (or empty) entry list as confirmed. */
export async function readFulfilledOrder(
  admin: AdminClient,
  order: OrderRow,
): Promise<ConfirmCheckoutResult> {
  if (order.status === 'failed') return { ok: false, reason: 'review', orderId: order.id };
  if (order.status !== 'paid') return { ok: false, reason: 'processing', orderId: order.id };

  const items = (order.items ?? []) as unknown as OrderLineItem[];
  const expectedEntries = items.filter(
    (item) => item.kind === 'class_entry' && item.classId,
  ).length;
  const { data: entries, error: entriesError } = await admin
    .from('class_entries')
    .select('*')
    .eq('order_id', order.id);
  if (entriesError) throw entriesError;
  if (entries.length < expectedEntries) {
    return { ok: false, reason: 'processing', orderId: order.id };
  }
  return {
    ok: true,
    alreadyFulfilled: true,
    entries,
    riderNumber: entries[0]?.num ?? null,
    orderId: order.id,
    total: order.amount_total,
    items,
  };
}

export async function finalizeOrder(
  admin: AdminClient,
  order: OrderRow,
  rider: RiderRow,
  paymentIntentId: string | null = null,
): Promise<ConfirmCheckoutResult> {
  /* The session's PaymentIntent only exists once it is paid, so it is stored
   * here (refunds and "charge more" look it up on the order).
   * 'abandoned' is claimable too: the hourly cron abandons pending orders
   * after 6h, but Stripe is the source of truth — if it says the session was
   * paid (e.g. a late async payment), the rider still gets their entries. */
  const { data: claimed, error: claimError } = await admin
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
    })
    .eq('id', order.id)
    .in('status', CLAIMABLE_ORDER_STATUSES)
    .select()
    .maybeSingle();
  if (claimError) throw claimError;

  if (!claimed) {
    if (paymentIntentId && !order.stripe_payment_intent_id) {
      await admin
        .from('orders')
        .update({ stripe_payment_intent_id: paymentIntentId })
        .eq('id', order.id)
        .is('stripe_payment_intent_id', null);
    }
    const { data: current, error: currentError } = await admin
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new Error(`Order ${order.id} disappeared during fulfilment.`);
    return readFulfilledOrder(admin, current);
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

/* Stripe reported a paid session whose amount does not match the order. The
 * order is NOT fulfilled; it is parked as 'failed' (only from an unpaid
 * state) so it drops out of the abandon cron and shows up in SuperAdmin
 * billing's failed-order count for someone to reconcile against Stripe. */
export async function markOrderForReview(admin: AdminClient, orderId: string): Promise<void> {
  const { error } = await admin
    .from('orders')
    .update({ status: 'failed' })
    .eq('id', orderId)
    .in('status', CLAIMABLE_ORDER_STATUSES);
  if (error) throw error;
}

/* checkout.session.async_payment_failed: the delayed payment method (bank
 * debit etc.) was declined, so the session will never be paid. The order is
 * closed as 'failed' (only from an unpaid state). */
export async function markOrderPaymentFailed(
  admin: AdminClient,
  orderId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await admin
    .from('orders')
    .update({
      status: 'failed',
      review_reason: `Delayed payment failed for checkout session ${sessionId} — nothing was charged.`,
    })
    .eq('id', orderId)
    .in('status', CLAIMABLE_ORDER_STATUSES);
  if (error) throw error;
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

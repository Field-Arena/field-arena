/**
 * Pure functions only — no imports of runtime code, per
 * .claude/rules/layers.md. (Type-only imports are fine — they're erased.)
 */
import type { AddOnRow, DocumentRequirement, OrderLineItem, OrderRow, StablingSummary } from './types';

/** The two `shows` columns a ticket window is parsed from. */
export interface TicketWindowSource {
  ticket_open: string | null;
  ticket_close: string | null;
}

export interface TicketWindow {
  opensAt: Date | null;
  closesAt: Date | null;
}

/**
 * Parses a show's ticket-sale window from its raw stored strings.
 *
 * Ported from legacy's parseTicketWindow (api/rider/[resource].js). Both
 * fields are free text written by the organizer side (showbuilder.html /
 * showstaff.html), in a genuinely parseable shape rather than real date/time
 * columns: `ticket_open` is a bare ISO date ('YYYY-MM-DD'); `ticket_close` is
 * '<ISO date> · <HH:MM>' (24-hour), the time defaulting to end-of-day when
 * omitted.
 */
export function parseTicketWindow(show: TicketWindowSource): TicketWindow {
  const opensAt = show.ticket_open ? new Date(`${show.ticket_open}T00:00:00`) : null;

  let closesAt: Date | null = null;
  if (show.ticket_close) {
    const [datePart, timePart] = show.ticket_close.split(' · ');
    if (datePart) closesAt = new Date(`${datePart}T${timePart ?? '23:59'}:00`);
  }

  return {
    opensAt: opensAt && !Number.isNaN(opensAt.getTime()) ? opensAt : null,
    closesAt: closesAt && !Number.isNaN(closesAt.getTime()) ? closesAt : null,
  };
}

export type TicketWindowStatus = 'not_open_yet' | 'closed' | 'open';

/**
 * Whether ticket sales are currently open, relative to `now` (defaulted to
 * the real clock, but injectable — this is what makes the function pure and
 * testable rather than reaching for `Date.now()` itself).
 *
 * Mirrors the two checks legacy's priceCart makes server-side before pricing
 * a cart ("Ticket sales for this show have not opened yet" / "...have
 * closed") — the real enforcement point is wherever checkout prices a cart
 * (Phase C), not this helper; this is the shared read both that check and any
 * UI messaging (Phase A/B) can use instead of duplicating the date math.
 */
export function getTicketWindowStatus(
  window: TicketWindow,
  now: Date = new Date()
): TicketWindowStatus {
  if (window.opensAt && now.getTime() < window.opensAt.getTime()) return 'not_open_yet';
  if (window.closesAt && now.getTime() > window.closesAt.getTime()) return 'closed';
  return 'open';
}

/**
 * Parses `shows.document_requirements` (jsonb) into a safe, typed list.
 *
 * Ported from legacy's realDocReqsForShow (rider.html): a requirement the
 * organizer hasn't finished naming yet (blank label, still being typed in
 * Setup) isn't something to prompt a rider to upload against, so it's
 * filtered out here rather than rendering an unlabeled upload block.
 */
export function parseDocumentRequirements(raw: unknown): DocumentRequirement[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is DocumentRequirement =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { label?: unknown }).label === 'string' &&
      (item as { label: string }).label.trim().length > 0
  );
}

/**
 * A class's subtitle line, wherever its name is shown — the italic note
 * under a class title in legacy's classSubtitleReal (rider.html). Two cases,
 * checked in this order:
 *  - `test_options` non-empty: always "Test of Choice — ride any one: A, B, …",
 *    regardless of whether the class was also renamed.
 *  - otherwise, a renamed class (`display_name` set and different from
 *    `label`) shows its original `label` as the subtitle, so a rider (or
 *    judge) can still see the real test name under the organizer's rename.
 * Returns null for an ordinary, unrenamed, single-test class — no subtitle
 * to render, matching legacy's `return ''`.
 */
export function classSubtitle(cls: {
  label: string;
  displayName: string | null;
  testOptions: unknown;
}): string | null {
  if (Array.isArray(cls.testOptions) && cls.testOptions.length > 0) {
    const labels = cls.testOptions
      .filter((o): o is { label: string } => typeof o === 'object' && o !== null && typeof (o as { label?: unknown }).label === 'string')
      .map((o) => o.label);
    if (labels.length > 0) return `Test of Choice — ride any one: ${labels.join(', ')}`;
  }
  const displayName = cls.displayName?.trim();
  if (displayName && displayName !== cls.label) return cls.label;
  return null;
}

export type ClassEntryDivisionCode = 'J' | 'Y' | 'A' | 'O';

/**
 * Maps a rider's chosen RIDER_CATEGORIES value to the class_entries.division
 * code the awards/placings system understands — see that column's own CHECK
 * constraint and comment in 20260804120000_awards_placings.sql.
 *
 * No legacy source defines this mapping: the awards feature's own seed data
 * assigns divisions randomly (showstaff.html's demo generator), and the real
 * rider signup category (rider.html's "Rider class category" select) was
 * never wired to it before this port — checkout is the first place a real
 * category and a real class_entries row exist at the same time. This is a
 * first, reasonable mapping, not a ported behavior, and worth a second look
 * from someone who knows how shows actually classify these for awards.
 * 'Under 25 (U25)' rides with 'Y' (Young Rider) — most governing bodies treat
 * U25 as the Young Rider division extended to age 25, not as Open. 'Senior'
 * doesn't map cleanly to any of the four codes, so it falls to 'O' — the same
 * "unknown defaults to Open" rule the column's own comment states.
 */
export function riderCategoryToDivisionCode(category: string | null): ClassEntryDivisionCode {
  switch (category) {
    case 'Junior':
    case 'Children':
      return 'J';
    case 'Young Rider':
    case 'Under 25 (U25)':
      return 'Y';
    case 'Adult Amateur':
      return 'A';
    default:
      return 'O';
  }
}

// ---------------------------------------------------------------------------
// Phase D — Purchases tab. class_entries carries no price of its own (see
// OrderLineItem's own comment in types.ts), so every money figure the
// Purchases tab shows is derived here from paid orders' line items, the same
// reduction legacy's Purchases tab did client-side (rider.html).
// ---------------------------------------------------------------------------

/** Only orders that actually collected money count toward Purchases-tab totals — mirrors legacy's realOrdersForShow filter. */
function paidLineItems(orders: OrderRow[]): OrderLineItem[] {
  return orders
    .filter((order) => order.status === 'paid')
    .flatMap((order) => (order.items ?? []) as unknown as OrderLineItem[]);
}

/**
 * A class entry's fee, looked up from paid orders rather than the entry
 * itself — mirrors legacy's feeMap (rider.html's Purchases tab), keyed by
 * classId+horseId since the same class can be entered twice on two different
 * horses. Null (rendered as "—") when no paid line item matches, same as
 * legacy.
 */
export function feeForEntry(orders: OrderRow[], classId: string, horseId: string | null): number | null {
  const item = paidLineItems(orders).find(
    (i) => i.kind === 'class_entry' && i.classId === classId && (i.horseId ?? null) === horseId
  );
  return item ? item.amount : null;
}

export interface PurchaseAddOnLine {
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface PurchasesSummary {
  classEntriesTotal: number;
  addOnLines: PurchaseAddOnLine[];
  totalPaid: number;
}

/**
 * The Purchases tab's stabling/add-ons table plus its "Class entries (N)"
 * synthesized first row — mirrors legacy's renderDashboardReal purchase-table
 * build (rider.html), including bucketing `qualification` line items into the
 * class-entries total alongside `class_entry` ones.
 *
 * The "(N)" count itself is NOT derived here — legacy's own count is
 * `mine.length`, the rider's actual class_entries rows for the show, not a
 * count of paid line items (which can diverge: a roster-added entry with no
 * matching paid item, a refunded item whose entry row still exists). Callers
 * pass `entries.length` for that instead.
 */
export function summarizePurchases(orders: OrderRow[]): PurchasesSummary {
  const items = paidLineItems(orders);

  const classItems = items.filter((i) => i.kind === 'class_entry' || i.kind === 'qualification');
  const classEntriesTotal = classItems.reduce((sum, i) => sum + i.amount, 0);

  const addOnItems = items.filter((i) => i.kind === 'addon');
  const addOnLines: PurchaseAddOnLine[] = addOnItems.map((i) => ({
    label: i.label,
    qty: i.qty,
    unitPrice: i.unitPrice,
    amount: i.amount,
  }));
  const addOnTotal = addOnItems.reduce((sum, i) => sum + i.amount, 0);

  return {
    classEntriesTotal,
    addOnLines,
    totalPaid: classEntriesTotal + addOnTotal,
  };
}

/**
 * Read-only stall/tack/shavings/night counts for the stabling form, derived
 * from paid add-on purchases joined against each add-on's own metadata
 * (`add_ons.stalls/tack/shavings/nights` — see that column's own comment in
 * 20260727120400_show_setup.sql). Stalls/tack/shavings scale with quantity
 * purchased; nights takes the max across add-ons rather than summing, since a
 * rider's length of stay isn't additive the way stall counts are — same rule
 * as legacy's saveStabling section (rider.html).
 */
export function computeStablingSummary(orders: OrderRow[], addOns: AddOnRow[]): StablingSummary {
  const addOnById = new Map(addOns.map((addOn) => [addOn.id, addOn]));
  const summary: StablingSummary = { stalls: 0, tack: 0, shavings: 0, nights: 0 };

  for (const item of paidLineItems(orders)) {
    if (item.kind !== 'addon' || !item.refId) continue;
    const addOn = addOnById.get(item.refId);
    if (!addOn) continue;
    summary.stalls += (addOn.stalls ?? 0) * item.qty;
    summary.tack += (addOn.tack ?? 0) * item.qty;
    summary.shavings += (addOn.shavings ?? 0) * item.qty;
    summary.nights = Math.max(summary.nights, addOn.nights ?? 0);
  }

  return summary;
}

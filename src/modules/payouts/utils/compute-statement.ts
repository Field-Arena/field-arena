import type {
  SaleEventKind,
  SaleEventRow,
  SaleType,
  Statement,
  StatementLine,
  StatementShow,
} from '@/modules/payouts/types';

/* Money is summed in whole cents so a week of sales never drifts by a penny. */
const cents = (dollars: number) => Math.round(dollars * 100);
const dollars = (c: number) => c / 100;

/* How an event moves what the organizer is owed, in cents. A payment adds the
 * amount the customer paid minus Field & Arena's fee; an extra charge adds in
 * full; refunds and chargebacks take away; a won chargeback gives it back. */
function effectCents(event: Pick<SaleEventRow, 'kind' | 'amount' | 'fee'>): number {
  const amount = cents(event.amount);
  switch (event.kind) {
    case 'payment':
      return amount - cents(event.fee);
    case 'additional_charge':
    case 'dispute_reversal':
      return amount;
    case 'refund':
    case 'dispute':
      return -amount;
    default:
      return 0;
  }
}

export interface ComputeStatementInput {
  events: SaleEventRow[];
  shows: StatementShow[];
  /** Period is [periodStart, periodEnd). */
  periodStart: Date;
  periodEnd: Date;
  holdbackPercent: number | null;
  /** Total already sent to the organizer in earlier statements, in dollars. */
  paidBefore: number;
  minPayoutDollars: number;
}

/* The organizer's weekly statement.
 *
 * Holdback is tracked per show from the running total, not the week: a share
 * of a show's net is held until the show's end date has passed, then released.
 * "Owed" is everything released so far minus everything already paid out, so a
 * refund that lands after a payout makes next week's figure smaller (or
 * negative, which is carried forward) with no special case. */
export function computeStatement(input: ComputeStatementInput): Statement {
  const { events, shows, periodStart, periodEnd, holdbackPercent, paidBefore } = input;
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const pct = holdbackPercent && holdbackPercent > 0 ? holdbackPercent : 0;
  const showById = new Map(shows.map((s) => [s.id, s]));

  const showEnded = (showId: string, atMs: number): boolean => {
    const end = showById.get(showId)?.endDate;
    if (!end) return false;
    return end < new Date(atMs).toISOString().slice(0, 10);
  };

  /* Running net per show up to (not including) a moment, and what is still
   * held back from it at that moment. */
  const releasedAt = (atMs: number) => {
    const net = new Map<string, number>();
    for (const e of events) {
      if (Date.parse(e.occurred_at) >= atMs) continue;
      net.set(e.show_id, (net.get(e.show_id) ?? 0) + effectCents(e));
    }
    let released = 0;
    let held = 0;
    for (const [showId, value] of net) {
      const hold =
        pct > 0 && value > 0 && !showEnded(showId, atMs) ? Math.round((value * pct) / 100) : 0;
      released += value - hold;
      held += hold;
    }
    return { released, held };
  };

  const opening = releasedAt(startMs);
  const closing = releasedAt(endMs);
  const paidBeforeCents = cents(paidBefore);
  const broughtForward = opening.released - paidBeforeCents;
  const totalOwed = closing.released - paidBeforeCents;

  const inPeriod = events
    .filter((e) => {
      const t = Date.parse(e.occurred_at);
      return t >= startMs && t < endMs;
    })
    .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));

  const lines: StatementLine[] = inPeriod.map((e) => ({
    occurredAt: e.occurred_at,
    kind: e.kind as SaleEventKind,
    showId: e.show_id,
    showName: showById.get(e.show_id)?.name ?? 'Unknown show',
    saleType: e.sale_type as SaleType,
    saleId: e.sale_id,
    stripeRef: e.stripe_ref,
    gross: e.amount,
    fee: e.kind === 'payment' ? e.fee : 0,
    effect: dollars(effectCents(e)),
  }));

  const sum = (kind: SaleEventKind, pick: (e: SaleEventRow) => number) =>
    inPeriod.filter((e) => e.kind === kind).reduce((total, e) => total + cents(pick(e)), 0);

  const payments = inPeriod
    .filter((e) => e.kind === 'payment')
    .reduce((total, e) => total + cents(e.amount) - cents(e.fee), 0);
  const platformFees = sum('payment', (e) => e.fee);
  const additionalCharges = sum('additional_charge', (e) => e.amount);
  const refunds = sum('refund', (e) => e.amount);
  const disputes = sum('dispute', (e) => e.amount);
  const disputeReversals = sum('dispute_reversal', (e) => e.amount);
  const subtotal = payments + additionalCharges - refunds - disputes + disputeReversals;

  const minPayout = cents(input.minPayoutDollars);
  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    lines,
    totals: {
      payments: dollars(payments),
      platformFees: dollars(platformFees),
      additionalCharges: dollars(additionalCharges),
      refunds: dollars(refunds),
      disputes: dollars(disputes),
      disputeReversals: dollars(disputeReversals),
      subtotal: dollars(subtotal),
    },
    holdbackPercent: pct > 0 ? pct : null,
    holdbackChange: dollars(closing.held - opening.held),
    holdbackHeld: dollars(closing.held),
    broughtForward: dollars(broughtForward),
    totalOwed: dollars(totalOwed),
    toSend: totalOwed > 0 && totalOwed >= minPayout ? dollars(totalOwed) : 0,
    paidBefore,
  };
}

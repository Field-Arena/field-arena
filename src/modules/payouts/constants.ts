/* Payment references that mark seeded demo data. A sale carrying one of these
 * never reached Stripe, so it can never become organizer money. */
export const DEMO_REF_PREFIX = 'pi_demo_';

export const SALE_EVENT_KINDS = [
  'payment',
  'additional_charge',
  'refund',
  'dispute',
  'dispute_reversal',
] as const;

/* How far back the self-healing backfill looks for paid sales that are
 * missing their payment event. */
export const BACKFILL_LOOKBACK_DAYS = 90;

/* Weeks run Monday to Sunday in this zone, so a Sunday-evening sale lands in
 * the week the organizer experienced it, not the next UTC day. */
export const PAYOUT_TIME_ZONE = 'America/New_York';

/* A statement under this amount is not sent; it stays owed and rolls into the
 * next week's balance. */
export const MIN_PAYOUT_DOLLARS = 10;

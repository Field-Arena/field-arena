export const ORDER_STATUSES = ['pending', 'paid', 'failed', 'abandoned'] as const;

/* Order statuses a confirmed Stripe payment may move to 'paid'. 'abandoned'
 * is only the 6h cron's guess that checkout was walked away from. */
export const CLAIMABLE_ORDER_STATUSES = ['pending', 'abandoned'] as const;

/* Stripe Checkout sessions expire before the 6h abandon cron
 * (abandon_stale_orders) can mark their order abandoned, so a session can
 * never be paid after its order was given up on. Stripe's minimum is 30 min. */
export const CHECKOUT_SESSION_TTL_SECONDS = 60 * 60 * 5;

export const CLASS_ENTRY_STATUSES = ['scheduled', 'scored', 'scratched', 'disqualified'] as const;

export const NON_CAPPED_ENTRY_STATUS = 'scratched' as const;

export const RIDER_CATEGORIES = [
  'Adult Amateur',
  'Open',
  'Senior',
  'Young Rider',
  'Junior',
  'Children',
  'Under 25 (U25)',
] as const;

export const ORDER_LINE_ITEM_KINDS = ['class_entry', 'qualification', 'addon'] as const;

export const HORSE_DOCUMENTS_BUCKET = 'horse-documents';

export const HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 10;

export const UNLIMITED_ADD_ON_QUANTITY_INPUT_MAX = 50;

export const DEFAULT_STARTING_RIDER_NUMBER = 101;

export const RIDER_NUMBER_PAD_WIDTH = 4;

export const SUPERADMIN_CONSOLE_ROUTE = '/dashboard/superadmin';

/** Input caps shared by the rider forms and their server schemas. */
export const RIDER_FIELD_MAX = {
  name: 100,
  street: 200,
  city: 100,
  state: 100,
  zip: 10,
  membershipNumber: 12,
  horseName: 120,
  horseText: 120,
  horseHeight: 20,
} as const;

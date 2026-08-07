/**
 * Rider-facing constants — the self-service ticket-purchase identity, kept
 * deliberately separate from staff (see db/schema comment on `public.riders`
 * in 20260727120200_identity.sql for why).
 */

/** Mirrors the `orders.status` CHECK constraint (20260727120600_rider_domain.sql). */
export const ORDER_STATUSES = ['pending', 'paid', 'failed', 'abandoned'] as const;

/** Mirrors the `class_entries.status` CHECK constraint (20260727120700_scoring.sql). */
export const CLASS_ENTRY_STATUSES = ['scheduled', 'scored', 'scratched', 'disqualified'] as const;

/**
 * The one class_entries status that does NOT occupy a rider-cap slot. Ported
 * from legacy's classCapCheck (api/rider/[resource].js), which excludes exactly
 * this status when counting a class against `scheduleExtras.maxRidersPerEvent`.
 */
export const NON_CAPPED_ENTRY_STATUS = 'scratched' as const;

/** Ported verbatim from rider.html's Step 3 "Rider class category" select. */
export const RIDER_CATEGORIES = [
  'Adult Amateur',
  'Open',
  'Senior',
  'Young Rider',
  'Junior',
  'Children',
  'Under 25 (U25)',
] as const;

/** One line item's `kind` inside `orders.items` (jsonb) — see OrderLineItem in types.ts. */
export const ORDER_LINE_ITEM_KINDS = ['class_entry', 'qualification', 'addon'] as const;

/**
 * The private Supabase Storage bucket horse documents (Coggins, vaccination
 * records, ...) live in — see 20260727121000_storage.sql's path convention
 * comment: `horse-documents/{rider_id}/{horse_id}/{filename}`.
 */
export const HORSE_DOCUMENTS_BUCKET = 'horse-documents';

/**
 * How long a generated read URL for a horse document stays valid. Short-lived
 * on purpose — these are regenerated on every page load that shows them
 * (listRiderHorses), not cached long-term.
 */
export const HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 10;

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

/**
 * Fallback rider-facing max for an add-on quantity input when the add-on has
 * no configured `qty` cap (`remaining` is null, i.e. unlimited) — the input
 * still needs SOME upper bound. Not a real inventory limit, just a sane stop
 * on the number field (see ui/addon-picker.tsx).
 */
export const UNLIMITED_ADD_ON_QUANTITY_INPUT_MAX = 50;

/** `shows.starting_rider_number`'s fallback when an organizer never set one — see data/checkout.ts's nextRiderNumberForShow. */
export const DEFAULT_STARTING_RIDER_NUMBER = 101;

/** Rider numbers are always rendered zero-padded to this width — see data/checkout.ts's nextRiderNumberForShow. */
export const RIDER_NUMBER_PAD_WIDTH = 4;

/**
 * The SuperAdmin console's own route — not in shared/constants/routes.ts's
 * ROUTES (that file has no `superadmin` entry today), so kept as a local
 * constant rather than a cross-module reach-in. Used by
 * ui/rider-demo-walkthrough.tsx's "Back to console" link, shown only when a
 * SuperAdmin reached the demo from there. Flagged for the owning team: this
 * probably belongs in ROUTES if/when another module needs it too.
 */
export const SUPERADMIN_CONSOLE_ROUTE = '/dashboard/superadmin';

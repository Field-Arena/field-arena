import type { Database } from '@/shared/types/database.types';
import type {
  CLASS_ENTRY_STATUSES,
  ORDER_LINE_ITEM_KINDS,
  ORDER_STATUSES,
  RIDER_CATEGORIES,
} from './constants';

export type RiderRow = Database['public']['Tables']['riders']['Row'];
export type HorseRow = Database['public']['Tables']['horses']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type ClassEntryRow = Database['public']['Tables']['class_entries']['Row'];
export type WaiverSignatureRow = Database['public']['Tables']['waiver_signatures']['Row'];
export type ShowRow = Database['public']['Tables']['shows']['Row'];
export type ClassRow = Database['public']['Tables']['classes']['Row'];
export type AddOnRow = Database['public']['Tables']['add_ons']['Row'];
export type QualTypeRow = Database['public']['Tables']['qual_types']['Row'];

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ClassEntryStatus = (typeof CLASS_ENTRY_STATUSES)[number];
export type RiderCategory = (typeof RIDER_CATEGORIES)[number];
export type OrderLineItemKind = (typeof ORDER_LINE_ITEM_KINDS)[number];

/**
 * One line item inside `orders.items` (jsonb) — documented on the column in
 * 20260727120600_rider_domain.sql, never its own table (a receipt's items are
 * read as a unit and never queried across orders).
 */
export interface OrderLineItem {
  kind: OrderLineItemKind;
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
  classId?: string;
  horseId?: string;
  refId?: string;
}

/**
 * A class row with the live capacity numbers a rider needs to see before
 * checking out. Mirrors legacy's `classesWithCapacity` (handleShow in
 * api/rider/[resource].js).
 */
export interface ClassWithCapacity extends ClassRow {
  entryCount: number;
  /** null = no cap configured (`scheduleExtras.maxRidersPerEvent` unset or 0). */
  cap: number | null;
}

/**
 * An add-on row with remaining inventory computed from paid orders. Mirrors
 * legacy's `addOnsWithRemaining`.
 */
export interface AddOnWithRemaining extends AddOnRow {
  /** null = unlimited (`add_ons.qty` unset). */
  remaining: number | null;
}

/**
 * The full read model for a show's public ticket page — mirrors legacy's
 * `handleShow` response shape.
 */
export interface PublicShowDetail {
  show: ShowRow;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];
  /** The venue's street address, if `show.venue_id` is set — legacy's "Address" field on the Show details card. */
  venueAddress: string | null;
}

/**
 * Outcomes for rider self-service sign-up — same shape as auth module's
 * SignUpOutcome (kept as a local copy rather than imported; modules must not
 * reach into another module's internals, see .claude/rules/folder-structure.md),
 * returned rather than thrown for the same reason: a Server Action that throws
 * loses its message in a production build.
 */
export type RiderSignUpOutcome =
  | { status: 'verify'; email: string }
  | { status: 'done'; redirectTo: string }
  | { status: 'exists' }
  | { status: 'error'; message: string };

export type RiderVerifyOutcome =
  | { status: 'done'; redirectTo: string }
  | { status: 'error'; message: string };

export type RiderResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

/** Which panel the rider sign-up form is showing. */
export type RiderSignUpStep = 'account' | 'verify';

/**
 * One entry in `horses.document_uploads` (jsonb) — shape documented on that
 * column in 20260727120600_rider_domain.sql.
 */
export interface HorseDocumentUpload {
  requirementId: string;
  label: string;
  /** Supabase Storage object path in the `horse-documents` bucket. */
  path: string;
  expirationDate: string | null;
  verified: boolean;
}

/** A document_uploads entry with a freshly-generated signed read URL attached. */
export interface HorseDocumentUploadWithUrl extends HorseDocumentUpload {
  url: string | null;
}

/**
 * A horse row with its document uploads resolved to signed, viewable URLs —
 * spelled out explicitly (rather than `Omit<HorseRow, 'document_uploads'>`)
 * so the read side (data/queries.ts's listRiderHorses) can build one without
 * an unused-variable destructure to drop the raw jsonb column.
 */
export interface HorseWithDocumentUrls {
  id: string;
  rider_id: string;
  name: string;
  stable: string | null;
  trainer: string | null;
  trainer_phone: string | null;
  is_stallion: boolean | null;
  created_at: string;
  documentUploads: HorseDocumentUploadWithUrl[];
}

/**
 * One entry in `shows.document_requirements` (jsonb) — the organizer-defined
 * list a rider's horse documents are uploaded against. Shape ported from
 * legacy's showstaff.html document-requirements editor (docReqId()).
 */
export interface DocumentRequirement {
  id: string;
  label: string;
  requiresExpiration?: boolean;
  requiresApproval?: boolean;
}

/**
 * One line of the entry cart: a selected class, which horse(s) are entered on
 * it, and which qualification types apply. `horseIds` supports the same class
 * entered twice on two different horses — one array slot per entry, `null`
 * while a slot is unassigned. Mirrors legacy's realSelectedClasses /
 * realClassHorse / realQualSelections (rider.html).
 */
export interface EntryCartLine {
  classId: string;
  horseIds: (string | null)[];
  qualTypeIds: string[];
}

/**
 * A cart, fully priced and validated server-side — the internal return of
 * data/checkout.ts's priceCart, mirroring legacy's priceCart return shape.
 * Never sent to the client as-is (createCheckoutSession only returns the
 * subset a receipt needs); this is the shape passed between checkout.ts's
 * own functions.
 */
export interface PricedCart {
  showId: string;
  /** Lowercased ISO currency code, from `organizations.currency`. */
  currency: string;
  /** Only set (and only trusted) when `chargesEnabled` is also true. */
  stripeConnectAccountId: string | null;
  items: OrderLineItem[];
  total: number;
  feeTotal: number;
  chargesEnabled: boolean;
}

/** What a client gets back after creating a Checkout Session — enough to redirect and show a summary. */
export interface CheckoutSessionResult {
  orderId: string;
  sessionId: string;
  url: string;
  total: number;
  items: OrderLineItem[];
  feeTotal: number;
}

/**
 * What "an order got paid" produces — returned by both the in-page
 * confirm path (data/mutations.ts's confirmCheckoutSession) and, shaped
 * identically, by the webhook's internal call to the same finalizeOrder.
 */
export interface FinalizeOrderResult {
  ok: true;
  /** True when this call found the order already paid rather than just having paid it. */
  alreadyFulfilled?: boolean;
  entries: ClassEntryRow[];
  riderNumber: string | null;
  orderId: string;
  total: number;
  items: OrderLineItem[];
}

// ---------------------------------------------------------------------------
// Phase D — post-purchase dashboard (Schedule / Profile / Horse / Purchases /
// Results). Horse reuses HorseWithDocumentUrls above; Profile reuses RiderRow
// + riderProfileUpdateSchema. The types below are new to this phase.
// ---------------------------------------------------------------------------

/**
 * One of the rider's own class_entries, joined with just the class fields
 * "your rides" and the receipt-style Purchases table need. Mirrors legacy's
 * handleEntries response shape (api/rider/[resource].js), built the same
 * separate-queries-then-merge way as scoring module's getScoringState rather
 * than a Postgres nested select.
 */
export interface RiderEntryDetail {
  id: string;
  classId: string;
  horseId: string | null;
  num: string;
  status: ClassEntryStatus;
  finalPct: string | null;
  reason: string | null;
  rideOrder: number;
  class: {
    id: string;
    label: string;
    displayName: string | null;
    division: string | null;
    date: string | null;
    time: string | null;
    arena: string | null;
    resultsPublished: boolean;
    /** Raw `classes.test_options` jsonb — see utils.ts's classSubtitle. */
    testOptions: unknown;
  } | null;
}

/**
 * Read-only stall/tack/shavings/night counts derived from a show's paid
 * orders, for the Purchases tab's stabling form. Mirrors legacy's client-side
 * reduction over `add_ons` metadata (rider.html's saveStabling section) —
 * `nights` is a max across add-ons, not a sum, since a rider's length of stay
 * isn't additive the way stall counts are.
 */
export interface StablingSummary {
  stalls: number;
  tack: number;
  shavings: number;
  nights: number;
}

/** One movement mark on a signed judge's scorecard. */
export interface RiderScorecardMovement {
  num: number;
  text: string;
  coef: number;
  value: number | null;
  remark: string;
}

/** One collective mark on a signed judge's scorecard. */
export interface RiderScorecardCollective {
  key: string;
  label: string;
  coef: number;
  value: number | null;
}

/** One judge's signed sheet for an entry — a scorecard has one of these per panel seat that has signed. */
export interface RiderScorecardCard {
  judgeName: string | null;
  position: string | null;
  movements: RiderScorecardMovement[];
  collectives: RiderScorecardCollective[];
  finalRemarks: string;
  errors: number;
  signedBy: string | null;
  signedAt: string | null;
}

/**
 * The rider-facing scorecard drill-in — mirrors legacy's handleScorecard
 * response (api/rider/[resource].js). `cards` only ever contains judges who
 * have actually signed (see data/queries.ts's getRiderScorecard); an empty
 * array means "not ready yet", identically for "hasn't ridden" and "ridden
 * but not yet signed" — the caller distinguishes those via the entry's own
 * status/finalPct, exactly as legacy's rider.html does.
 */
export interface RiderScorecard {
  showName: string;
  className: string;
  testName: string;
  num: string;
  rider: string | null;
  horse: string | null;
  finalPct: string | null;
  cards: RiderScorecardCard[];
}

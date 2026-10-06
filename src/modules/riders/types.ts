import type { Database } from '@/shared/types/database.types';
import type {
  CLASS_ENTRY_STATUSES,
  ORDER_LINE_ITEM_KINDS,
  ORDER_STATUSES,
  RIDER_CATEGORIES,
} from '@/modules/riders/constants';
import type { ScheduleStatus } from '@/shared/lib/schedule-delta';

export type RiderRow = Database['public']['Tables']['riders']['Row'];
export type HorseRow = Database['public']['Tables']['horses']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];

/* What a rider's OWN session is allowed to read back from `orders`.
 *
 * 20260907120000_fix_money_column_privileges revoked table-level SELECT and
 * re-granted column by column, deliberately holding back the two saved-card
 * columns. A rider-session `select('*')` therefore fails outright with 42501,
 * so rider-side reads must name their columns — and the row they get back
 * genuinely does not carry these two fields. Typing that honestly keeps the
 * grant and the type in step: adding a column here that the migration does not
 * grant will fail at the database, not silently return null. */
export type RiderVisibleOrderRow = Omit<
  OrderRow,
  | 'stripe_customer_id'
  | 'stripe_payment_method_id'
  | 'stabling_request'
  // Server-only (20261002130000): not granted to authenticated.
  | 'refund_log'
  | 'review_reason'
>;
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

export interface OrderLineItem {
  kind: OrderLineItemKind;
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
  classId?: string;
  horseId?: string;
  refId?: string;
  // Test of Choice: the scoring_catalog title this rider picked for this
  // class entry. Only ever set on a `class_entry` item.
  testChoice?: string;
}

export interface ClassWithCapacity extends ClassRow {
  entryCount: number;

  cap: number | null;
}

export interface AddOnWithRemaining extends AddOnRow {
  remaining: number | null;
}

export interface PublicShowDetail {
  show: ShowRow;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  qualTypes: QualTypeRow[];

  venueAddress: string | null;

  /* The organizing org's platform-fee model. Needed so the cart total a rider
   * is shown is computed with the same rule the server will charge them under
   * — a GMO org bills 18% on class entries, and quoting the default 8%/$7.99
   * rule understates the real price. Riders cannot read `organizations` under
   * RLS, so this is resolved server-side. */
  feeModel: string | null;
  orgName: string | null;
  waiverDocumentUrl: string | null;
}

export type RiderSignUpOutcome =
  | { status: 'verify'; email: string }
  | { status: 'done'; redirectTo: string }
  | { status: 'exists' }
  | { status: 'error'; message: string };

export type RiderVerifyOutcome =
  { status: 'done'; redirectTo: string } | { status: 'error'; message: string };

export type RiderResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

export type RiderSignUpStep = 'account' | 'verify';

export interface HorseDocumentUpload {
  requirementId: string;
  label: string;

  path: string;
  expirationDate: string | null;
  verified: boolean;
}

export interface HorseDocumentUploadWithUrl extends HorseDocumentUpload {
  url: string | null;
}

export interface HorseWithDocumentUrls {
  id: string;
  rider_id: string;
  name: string;
  stable: string | null;
  trainer: string | null;
  trainer_phone: string | null;
  height: string | null;
  farrier: string | null;
  is_stallion: boolean | null;
  created_at: string;
  documentUploads: HorseDocumentUploadWithUrl[];
}

export interface DocumentRequirement {
  id: string;
  label: string;
  requiresExpiration?: boolean;
  requiresApproval?: boolean;
}

export interface EntryCartLine {
  classId: string;
  horseIds: (string | null)[];
  qualTypeIds: string[];
}

export interface PricedCart {
  showId: string;

  currency: string;

  stripeConnectAccountId: string | null;
  items: OrderLineItem[];
  total: number;
  feeTotal: number;
  chargesEnabled: boolean;

  // True when the cart includes an add-on that grants horse stalls or tack
  // stalls — createCheckoutSession requires stabling details in that case.
  needsStablingDetails: boolean;
}

export interface CheckoutSessionResult {
  orderId: string;
  sessionId: string;
  url: string;
  total: number;
  items: OrderLineItem[];
  feeTotal: number;
}

export interface FinalizeOrderResult {
  ok: true;

  alreadyFulfilled?: boolean;
  entries: ClassEntryRow[];
  riderNumber: string | null;
  orderId: string;
  total: number;
  items: OrderLineItem[];
}

/* The rider came back from Stripe before the payment settled ('processing'),
 * or Stripe's amount did not match the order and it was set aside for staff
 * ('review'). Neither fulfils the order, and neither is an error to crash the
 * return page on. */
export interface CheckoutPendingResult {
  ok: false;
  reason: 'processing' | 'review';
  orderId: string;
}

export type ConfirmCheckoutResult = FinalizeOrderResult | CheckoutPendingResult;

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

    testOptions: unknown;
  } | null;
}

export interface StablingSummary {
  stalls: number;
  tack: number;
  shavings: number;
  nights: number;
}

export interface RiderScorecardMovement {
  num: number;
  text: string;
  coef: number;
  value: number | null;
  remark: string;
}

export interface RiderScorecardCollective {
  key: string;
  label: string;
  coef: number;
  value: number | null;
}

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

export interface RiderShowLink {
  showId: string;
  showSlug: string | null;
  showName: string;
  /* The rider's assigned number for this show (class_entries.num, assigned
   * once per checkout by nextRiderNumberForShow in checkout.ts — same value
   * across every entry the rider has for that show). Null only if every
   * entry is somehow missing it. */
  riderNumber: string | null;
}

export interface RingScheduleStatus {
  ring: string;
  label: string;
  status: ScheduleStatus;
}

import type { Database } from '@/shared/types/database.types';
import type {
  CLASS_ENTRY_STATUSES,
  ORDER_LINE_ITEM_KINDS,
  ORDER_STATUSES,
  RIDER_CATEGORIES,
} from '@/modules/riders/constants';

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

import type { Database } from '@/shared/types/database.types';

export type VendorBookingDbRow = Database['public']['Tables']['vendor_bookings']['Row'];

export interface VendorCheckoutLineItem {
  label: string;
  vendorItemId: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface PricedVendorBooking {
  bookingId: string;
  showId: string;

  currency: string;

  stripeConnectAccountId: string | null;
  items: VendorCheckoutLineItem[];
  total: number;
  feeTotal: number;
  chargesEnabled: boolean;
}

/* What a booking was priced at when its Checkout Session was created
 * (vendor_bookings.checkout_snapshot). Payment is matched and recorded against
 * this — not against the catalog at payment time — so an organizer editing a
 * price after checkout neither blocks nor re-prices the payment (H14). */
export interface VendorCheckoutSnapshot {
  sessionId: string;
  total: number;
  feeTotal: number;
  currency: string;
  items: VendorCheckoutLineItem[];
  pricedAt: string;
}

// The parts of a pricing that are recorded when a booking is marked paid.
export type VendorPaidPricing = Pick<PricedVendorBooking, 'total' | 'feeTotal' | 'items'>;

export interface VendorCheckoutSessionResult {
  bookingId: string;
  sessionId: string;
  url: string;
  total: number;
  items: VendorCheckoutLineItem[];
  feeTotal: number;
}

export interface FinalizeVendorBookingResult {
  ok: true;

  alreadyFulfilled?: boolean;
  bookingId: string;
  total: number;
  items: VendorCheckoutLineItem[];
}

/* The vendor came back from Stripe before the payment settled
 * ('processing'), or the amount Stripe charged no longer matches the
 * booking's price ('review'). Neither marks the booking paid. */
export interface VendorCheckoutPendingResult {
  ok: false;
  reason: 'processing' | 'review';
  bookingId: string;
}

export type ConfirmVendorCheckoutResult = FinalizeVendorBookingResult | VendorCheckoutPendingResult;

export interface PublicVendorApplyShow {
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  vendorMapUrl: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    qty: number | null;
    remaining: number | null;
  }[];
}

export type VendorSignUpOutcome =
  | { status: 'verify'; email: string }
  | { status: 'done'; redirectTo: string }
  | { status: 'exists' }
  | { status: 'error'; message: string };

export type VendorVerifyOutcome =
  { status: 'done'; redirectTo: string } | { status: 'error'; message: string };

export type VendorResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

export interface VendorDocumentRequirement {
  id: string;
  label: string;
}

export interface VendorDocumentUpload {
  requirementId: string;
  label: string;
  path: string;
  expirationDate: string | null;
  verified: boolean;
}

export interface BookableShow {
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  vendorMapUrl: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    qty: number | null;
    remaining: number | null;
  }[];
}

export interface VendorBookingRow {
  id: string;
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  status: string;
  amountTotal: number | null;
  paidAt: string | null;
  agreementSignedAt: string | null;

  agreementSignedText: string | null;

  vendorAgreementText: string | null;
  items: { name: string; qty: number; price: number }[];
  vendorDocumentRequirements: VendorDocumentRequirement[];
  documentUploads: VendorDocumentUpload[];
}

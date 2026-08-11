import type { Database } from '@/shared/types/database.types';

export type VendorBookingDbRow = Database['public']['Tables']['vendor_bookings']['Row'];

/** One priced line of a booth-fee checkout — the vendor equivalent of riders' OrderLineItem. */
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
  /** Lowercased ISO currency code, from `organizations.currency`. */
  currency: string;
  /** Only set (and only trusted) when `chargesEnabled` is also true. */
  stripeConnectAccountId: string | null;
  items: VendorCheckoutLineItem[];
  total: number;
  feeTotal: number;
  chargesEnabled: boolean;
}

/** What a client gets back after creating a Checkout Session — enough to redirect and show a summary. */
export interface VendorCheckoutSessionResult {
  bookingId: string;
  sessionId: string;
  url: string;
  total: number;
  items: VendorCheckoutLineItem[];
  feeTotal: number;
}

/**
 * What "a vendor booking got paid" produces — returned by both the in-page
 * confirm path (data/mutations.ts's confirmVendorCheckoutSession) and,
 * shaped identically, by the Stripe webhook's own internal call (it discards
 * the result — see app/api/webhooks/stripe/route.ts).
 */
export interface FinalizeVendorBookingResult {
  ok: true;
  /** True when this call found the booking already paid rather than just having paid it. */
  alreadyFulfilled?: boolean;
  bookingId: string;
  total: number;
  items: VendorCheckoutLineItem[];
}

/** A public show's vendor-apply catalog — legacy's GET half of handleVendorApply, ported for an anonymous visitor. */
export interface PublicVendorApplyShow {
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  items: { id: string; name: string; price: number; qty: number | null; remaining: number | null }[];
}

/**
 * Outcomes for vendor self-service sign-up — same shape as riders/types.ts's
 * RiderSignUpOutcome (kept as a local copy, not imported — modules must not
 * reach into another module's internals), returned rather than thrown: a
 * Server Action that throws loses its message in a production build.
 */
export type VendorSignUpOutcome =
  | { status: 'verify'; email: string }
  | { status: 'done'; redirectTo: string }
  | { status: 'exists' }
  | { status: 'error'; message: string };

export type VendorVerifyOutcome =
  | { status: 'done'; redirectTo: string }
  | { status: 'error'; message: string };

export type VendorResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

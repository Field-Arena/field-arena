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

export interface PublicVendorApplyShow {
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
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
  items: {
    id: string;
    name: string;
    price: number;
    qty: number | null;
    remaining: number | null;
  }[];
}

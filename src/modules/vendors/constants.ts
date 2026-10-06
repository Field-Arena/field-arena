export const VENDOR_DASHBOARD_PATH = '/dashboard/vendor';
export const VENDOR_DISCOVER_PATH = '/dashboard/vendor/discover';
export const VENDOR_DOCUMENTS_PATH = '/dashboard/vendor/documents';

export const VENDOR_DOCS_BUCKET = 'vendor-docs';

export const VENDOR_MAPS_BUCKET = 'vendor-maps';

export const VENDOR_DOCUMENT_SIGNED_URL_TTL_SECONDS = 3600;

/* Booking statuses a confirmed Stripe payment may move to 'paid'. 'pending' is
 * kept because legacy let a vendor pay the moment they applied (see
 * createVendorCheckoutSession); 'rejected' is never payable. */
export const PAYABLE_BOOKING_STATUSES = ['pending', 'approved'] as const;

/* A payment arrived that does not match what the booking was priced at (or
 * landed on a rejected / superseded checkout). Not payable again until the
 * organizer reconciles it. */
export const REVIEW_BOOKING_STATUS = 'review' as const;

// Statuses a booking can be moved into 'review' from.
export const REVIEWABLE_BOOKING_STATUSES = ['pending', 'approved', 'rejected'] as const;

/* Stripe Checkout session lifetime for booth payments — matches the rider
 * checkout (under the 6h order-abandon window). Stripe's minimum is 30 min. */
export const VENDOR_CHECKOUT_SESSION_TTL_SECONDS = 60 * 60 * 5;

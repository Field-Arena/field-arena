export const SALE_TYPES = ['Rider', 'Vendor'] as const;

export const SALE_STATUSES = ['paid', 'partial', 'refunded'] as const;

export const SALES_PAGE_SIZE = 20;

export const REFUND_AMOUNT_EPSILON = 0.001;

export const MAX_CHARGE_RECORD_ATTEMPTS = 5;

/* Upper bound on a single "Charge more" against a saved card. An off-session
 * charge needs no cardholder present, so a typo (an extra zero) would move
 * real money with nothing to stop it — cap it at a sane per-charge ceiling. */
export const MAX_CHARGE_MORE_AMOUNT = 10000;

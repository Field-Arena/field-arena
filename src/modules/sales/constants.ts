export const SALE_TYPES = ['Rider', 'Vendor'] as const;

export const SALE_STATUSES = ['paid', 'partial', 'refunded'] as const;

export const STATUS_LABEL: Record<(typeof SALE_STATUSES)[number], string> = {
  paid: 'Paid',
  partial: 'Partially refunded',
  refunded: 'Refunded',
};

export const SALES_PAGE_SIZE = 20;

export const REFUND_AMOUNT_EPSILON = 0.001;

export const MAX_CHARGE_RECORD_ATTEMPTS = 5;

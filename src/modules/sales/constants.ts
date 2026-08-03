/**
 * Event Sales — the transactions ledger for one show's paid rider entries
 * and vendor bookings, ported from showstaff.html's renderEventSales /
 * allSalesRecords / updateSalesTable.
 */

export const SALE_TYPES = ['Rider', 'Vendor'] as const;

export const SALE_STATUSES = ['paid', 'partial', 'refunded'] as const;

export const SALES_PAGE_SIZE = 20;

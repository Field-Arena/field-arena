import type { SaleRow } from './data/queries';

export interface SalesStats {
  totalSales: number;
  refundedExcluded: number;
  transactions: number;
  riderCount: number;
  riderTotal: number;
  vendorCount: number;
  vendorTotal: number;
}

/**
 * The four Event Sales KPI tiles, ported from showstaff.html's
 * updateSalesTable (6893-6903): total sales is the sum of `amount_total`
 * over every row that isn't fully refunded — a fully refunded sale is
 * excluded outright, not netted to zero, matching the legacy note
 * "N refunded, excluded". Rider/vendor totals are a plain sum of
 * amount_total for that type, whatever its status.
 */
export function computeSalesStats(rows: SaleRow[]): SalesStats {
  const notRefunded = rows.filter((r) => r.status !== 'refunded');
  const riders = rows.filter((r) => r.type === 'Rider');
  const vendors = rows.filter((r) => r.type === 'Vendor');

  return {
    totalSales: notRefunded.reduce((sum, r) => sum + r.amountTotal, 0),
    refundedExcluded: rows.length - notRefunded.length,
    transactions: rows.length,
    riderCount: riders.length,
    riderTotal: riders.reduce((sum, r) => sum + r.amountTotal, 0),
    vendorCount: vendors.length,
    vendorTotal: vendors.reduce((sum, r) => sum + r.amountTotal, 0),
  };
}

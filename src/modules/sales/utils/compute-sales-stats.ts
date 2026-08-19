import type { SaleRow, SalesStats } from '@/modules/sales/types';

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

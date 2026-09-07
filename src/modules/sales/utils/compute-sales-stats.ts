import { netCollected } from '@/shared/lib/sales-math';
import type { SaleRow, SalesStats } from '@/modules/sales/types';

/* Totals here and the P&L's revenue now come from the same netCollected()
 * definition, so the two screens can no longer disagree about the same show.
 *
 * Previously this dropped a fully refunded sale but counted a PARTIALLY
 * refunded one at its full value, while the P&L counted both in full. Netting
 * each sale is right in both cases: a $5 refund on a $500 sale reduces revenue
 * by $5, not by $500 (legacy) and not by nothing (previous behaviour). */
export function computeSalesStats(rows: SaleRow[]): SalesStats {
  const riders = rows.filter((r) => r.type === 'Rider');
  const vendors = rows.filter((r) => r.type === 'Vendor');
  const sum = (list: SaleRow[]) => list.reduce((total, r) => total + netCollected(r), 0);

  return {
    totalSales: sum(rows),
    // Still surfaced so the screen can say how many sales carry a refund —
    // they are no longer excluded wholesale, just netted.
    refundedExcluded: rows.filter((r) => r.refundedAmount > 0).length,
    transactions: rows.length,
    riderCount: riders.length,
    riderTotal: sum(riders),
    vendorCount: vendors.length,
    vendorTotal: sum(vendors),
  };
}

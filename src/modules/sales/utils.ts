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

/** CSV field escaping — wraps in quotes (doubling any inner quote) only when the field needs it. Matches modules/staff/utils.ts's identical helper. */
function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Builds the "Export Contact List" CSV for Event Sales — every row currently
 * matching the screen's search/type filter, same columns as the visible
 * table (Customer, Type, Show, Date, Total, Status), so what downloads is
 * exactly what was on screen when the button was clicked.
 */
export function buildSalesCsv(
  rows: { customer: string; type: string; showName: string; date: string | null; amountTotal: number; statusLabel: string }[],
): string {
  const header = 'Customer,Type,Show,Date,Total,Status\n';
  const body = rows
    .map((r) =>
      [
        escapeCsvField(r.customer),
        escapeCsvField(r.type),
        escapeCsvField(r.showName),
        escapeCsvField(r.date ?? ''),
        r.amountTotal.toFixed(2),
        escapeCsvField(r.statusLabel),
      ].join(','),
    )
    .join('\n');
  return header + body + (rows.length > 0 ? '\n' : '');
}

/** Matches modules/staff/utils.ts's staffCsvFilename slugging convention. */
export function salesCsvFilename(showName: string): string {
  const slug = showName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `field-and-arena-sales-contacts-${slug || 'show'}.csv`;
}

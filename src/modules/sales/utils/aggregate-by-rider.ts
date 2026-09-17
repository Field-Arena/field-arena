import type { SaleRow } from '@/modules/sales/types';

export interface RiderAggregateRow {
  rider: string;
  items: string[];
  total: number;
}

/* One row per rider, not per order — a rider who checked out twice for the
 * same show still gets a single combined row, matching what "By Rider"
 * means to an organizer (what did this person buy, in total). */
export function aggregateByRider(rows: SaleRow[]): RiderAggregateRow[] {
  const byRider = new Map<string, RiderAggregateRow>();

  for (const row of rows) {
    if (row.type !== 'Rider') continue;
    const existing = byRider.get(row.customer) ?? { rider: row.customer, items: [], total: 0 };
    existing.items.push(...row.items.map((item) => item.label));
    existing.total += row.amountTotal;
    byRider.set(row.customer, existing);
  }

  return [...byRider.values()].sort((a, b) => a.rider.localeCompare(b.rider));
}

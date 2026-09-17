import type { SaleRow, SaleLineItemGroup } from '@/modules/sales/types';

export interface ProductAggregateRow {
  label: string;
  qty: number;
  revenue: number;
}

export interface ProductAggregateGroup {
  group: SaleLineItemGroup;
  rows: ProductAggregateRow[];
  qty: number;
  revenue: number;
}

const GROUP_ORDER: SaleLineItemGroup[] = [
  'Entry fees',
  'Qualifications',
  'Add-ons',
  'Vendor items',
];

/* Sold-only breakdown, built from the same paid sale rows already on screen
 * — a product no one has bought yet just doesn't appear, rather than pulling
 * in the show's full class/add-on/vendor-item catalog to show it at zero. */
export function aggregateByProduct(rows: SaleRow[]): ProductAggregateGroup[] {
  const byGroup = new Map<SaleLineItemGroup, Map<string, ProductAggregateRow>>();

  for (const row of rows) {
    for (const item of row.items) {
      const products = byGroup.get(item.group) ?? new Map<string, ProductAggregateRow>();
      const existing = products.get(item.label) ?? { label: item.label, qty: 0, revenue: 0 };
      existing.qty += item.qty;
      existing.revenue += item.amount;
      products.set(item.label, existing);
      byGroup.set(item.group, products);
    }
  }

  return GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => {
    const rowsForGroup = [...(byGroup.get(group)?.values() ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    return {
      group,
      rows: rowsForGroup,
      qty: rowsForGroup.reduce((sum, r) => sum + r.qty, 0),
      revenue: rowsForGroup.reduce((sum, r) => sum + r.revenue, 0),
    };
  });
}

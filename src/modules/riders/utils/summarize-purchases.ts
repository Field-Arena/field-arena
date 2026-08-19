import { paidLineItems } from '@/modules/riders/utils/paid-line-items';
import type { OrderRow } from '@/modules/riders/types';

export interface PurchaseAddOnLine {
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface PurchasesSummary {
  classEntriesTotal: number;
  addOnLines: PurchaseAddOnLine[];
  totalPaid: number;
}

/**
 * The Purchases tab's stabling/add-ons table plus its "Class entries (N)"
 * synthesized first row — mirrors legacy's renderDashboardReal purchase-table
 * build (rider.html), including bucketing `qualification` line items into the
 * class-entries total alongside `class_entry` ones.
 *
 * The "(N)" count itself is NOT derived here — legacy's own count is
 * `mine.length`, the rider's actual class_entries rows for the show, not a
 * count of paid line items (which can diverge: a roster-added entry with no
 * matching paid item, a refunded item whose entry row still exists). Callers
 * pass `entries.length` for that instead.
 */
export function summarizePurchases(orders: OrderRow[]): PurchasesSummary {
  const items = paidLineItems(orders);

  const classItems = items.filter((i) => i.kind === 'class_entry' || i.kind === 'qualification');
  const classEntriesTotal = classItems.reduce((sum, i) => sum + i.amount, 0);

  const addOnItems = items.filter((i) => i.kind === 'addon');
  const addOnLines: PurchaseAddOnLine[] = addOnItems.map((i) => ({
    label: i.label,
    qty: i.qty,
    unitPrice: i.unitPrice,
    amount: i.amount,
  }));
  const addOnTotal = addOnItems.reduce((sum, i) => sum + i.amount, 0);

  return {
    classEntriesTotal,
    addOnLines,
    totalPaid: classEntriesTotal + addOnTotal,
  };
}

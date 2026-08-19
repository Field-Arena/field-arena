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

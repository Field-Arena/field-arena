'use client';

import { useState } from 'react';

export function useVendorCart<T extends { id: string }>(items: T[]) {
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const cart = items
    .map((item) => ({ item, qty: qtyById[item.id] ?? 0 }))
    .filter(({ qty }) => qty > 0);

  function setQty(itemId: string, rawValue: string): void {
    const n = Math.max(0, Number(rawValue) || 0);
    setQtyById((prev) => ({ ...prev, [itemId]: n }));
  }

  function reset(): void {
    setQtyById({});
  }

  return { qtyById, cart, setQty, reset };
}

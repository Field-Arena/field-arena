'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { UNLIMITED_ADD_ON_QUANTITY_INPUT_MAX } from '@/modules/riders/constants';
import type { AddOnWithRemaining } from '@/modules/riders/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';

export function AddOnPicker({ addOns }: { addOns: AddOnWithRemaining[] }) {
  const addOnQuantities = useEntryCartStore((state) => state.addOnQuantities);
  const setAddOnQuantity = useEntryCartStore((state) => state.setAddOnQuantity);

  if (addOns.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stabling &amp; add-ons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {addOns.map((addOn) => {
          const max = addOn.remaining ?? UNLIMITED_ADD_ON_QUANTITY_INPUT_MAX;
          const soldOut = addOn.remaining != null && addOn.remaining <= 0;
          return (
            <div
              key={addOn.id}
              className="border-line flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div>
                <div className="text-forest text-sm font-medium">{addOn.name}</div>
                <div className="text-fa-muted text-xs">
                  {addOn.price != null ? `$${addOn.price.toFixed(2)} each` : null}
                  {addOn.remaining != null && !soldOut && ` · ${addOn.remaining.toString()} left`}
                  {soldOut && ' · Sold out'}
                </div>
              </div>
              <Input
                type="number"
                min={0}
                max={max}
                disabled={soldOut}
                value={addOnQuantities[addOn.id] ?? 0}
                onChange={(event) => {
                  const qty = Math.min(max, Math.max(0, Number(event.target.value) || 0));
                  setAddOnQuantity(addOn.id, qty);
                }}
                className="w-20 text-center"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

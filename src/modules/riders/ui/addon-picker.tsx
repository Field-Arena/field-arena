'use client';

import { useEntryCartStore } from '../store';
import type { AddOnWithRemaining } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';

/**
 * Stabling & add-ons quantity picker — mirrors rider.html's
 * realTicketAddons/setAddonReal. A sold-out add-on (`remaining === 0`)
 * disables its input rather than hiding the row, so a rider still sees it
 * listed and understands why they can't add it.
 */
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
          const max = addOn.remaining ?? 50;
          const soldOut = addOn.remaining != null && addOn.remaining <= 0;
          return (
            <div
              key={addOn.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium text-forest">{addOn.name}</div>
                <div className="text-xs text-fa-muted">
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

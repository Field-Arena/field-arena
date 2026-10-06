'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { sanitizeDecimalInput, sanitizeIntegerInput } from '@/shared/lib/format/number-input';
import {
  useUpdateVendorItem,
  useDeleteVendorItem,
} from '@/modules/shows/hooks/use-catalog-mutations';
import type { VendorSpaceItem } from '@/modules/shows/types';
import { SM_ROW_INPUT } from '@/modules/shows/ui/show-manager/tokens';

export function VendorSpaceRow({ space }: { space: VendorSpaceItem }) {
  const [name, setName] = useState(space.name);
  const [qty, setQty] = useState(space.qty === null ? '' : String(space.qty));
  const [price, setPrice] = useState(String(space.price));

  const update = useUpdateVendorItem();
  const remove = useDeleteVendorItem();

  function commit() {
    const nextName = name.trim();
    const nextPrice = Number(price) || 0;
    const originalQty = space.qty === null ? '' : String(space.qty);
    if (!nextName) return;
    if (nextName === space.name && nextPrice === space.price && qty === originalQty) return;
    update.mutate({ id: space.id, name: nextName, price: nextPrice, qty });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'min-w-[200px] flex-1')}
        value={name}
        maxLength={160}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${space.name} name`}
      />
      <span className="text-[13px] text-[#8A94A3]">Qty</span>
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'w-[86px] flex-none')}
        placeholder="∞"
        inputMode="numeric"
        value={qty}
        onChange={(e) => {
          setQty(sanitizeIntegerInput(e.target.value, { maxDigits: 6 }));
        }}
        onBlur={commit}
        aria-label={`${space.name} quantity`}
      />
      <span className="text-[13px] text-[#8A94A3]">$</span>
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'w-[110px] flex-none')}
        inputMode="decimal"
        value={price}
        onChange={(e) => {
          setPrice(sanitizeDecimalInput(e.target.value, { maxIntegerDigits: 6 }));
        }}
        onBlur={commit}
        aria-label={`${space.name} price`}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          remove.mutate(space.id);
        }}
        className="h-auto flex-none rounded-[9px] border border-[#FBCFC9] bg-[#FDF0EE] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#B42318] transition-colors hover:border-[#B42318] hover:bg-[#FDF0EE]"
      >
        Remove
      </Button>
    </div>
  );
}

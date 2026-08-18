'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { useUpdateVendorItem, useDeleteVendorItem } from '@/modules/shows/hooks/use-catalog-mutations';
import type { VendorSpaceItem } from '@/modules/shows/data/setup-queries';
import { SM_ROW_INPUT } from '@/modules/shows/ui/show-manager/tokens';

export function VendorSpaceRow({ space }: { space: VendorSpaceItem }) {
  const [name, setName] = useState(space.name);
  const [qty, setQty] = useState(space.qty === null ? '' : String(space.qty));
  const [price, setPrice] = useState(String(space.price));

  const update = useUpdateVendorItem();
  const remove = useDeleteVendorItem();

  function commit() {
    const nextName = name.trim();
    if (!nextName) return;
    update.mutate({ id: space.id, name: nextName, price: Number(price) || 0, qty });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'min-w-[200px] flex-1')}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${space.name} name`}
      />
      <span className="text-[13px] text-[#6E7C76]">Qty</span>
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'w-[86px] flex-none')}
        placeholder="∞"
        inputMode="numeric"
        value={qty}
        onChange={(e) => {
          setQty(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${space.name} quantity`}
      />
      <span className="text-[13px] text-[#6E7C76]">$</span>
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'w-[110px] flex-none')}
        inputMode="numeric"
        value={price}
        onChange={(e) => {
          setPrice(e.target.value);
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
        className="h-auto flex-none rounded-[9px] border border-[#E4B5AC] bg-[#FDF0EE] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F] hover:bg-[#FDF0EE]"
      >
        Remove
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import type { CatalogListItem } from '@/modules/shows/data/setup-queries';
import { SM_ROW_INPUT } from '@/modules/shows/ui/show-manager/tokens';

export function CatalogRow({
  item,
  onRename,
  onRemove,
  stablingFields,
}: {
  item: CatalogListItem;
  onRename: (
    item: CatalogListItem,
    name: string,
    price: number,
    stalls: number,
    tack: number,
  ) => void;
  onRemove: (id: string) => void;
  stablingFields?: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [stalls, setStalls] = useState(String(item.stalls ?? 0));
  const [tack, setTack] = useState(String(item.tack ?? 0));

  function commit() {
    const nextName = name.trim();
    const nextPrice = Number(price) || 0;
    const nextStalls = Number(stalls) || 0;
    const nextTack = Number(tack) || 0;
    if (
      !nextName ||
      (nextName === item.name &&
        nextPrice === item.price &&
        nextStalls === (item.stalls ?? 0) &&
        nextTack === (item.tack ?? 0))
    ) {
      return;
    }
    onRename(item, nextName, nextPrice, nextStalls, nextTack);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className={cn('h-auto', SM_ROW_INPUT, 'min-w-[220px] flex-1')}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${item.name} name`}
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
        aria-label={`${item.name} price`}
      />
      {stablingFields && (
        <>
          <span className="text-[12px] text-[#6E7C76]">stalls</span>
          <Input
            className={cn('h-auto', SM_ROW_INPUT, 'w-[64px] flex-none')}
            inputMode="numeric"
            value={stalls}
            onChange={(e) => {
              setStalls(e.target.value);
            }}
            onBlur={commit}
            aria-label={`${item.name} stalls granted per unit`}
          />
          <span className="text-[12px] text-[#6E7C76]">tack</span>
          <Input
            className={cn('h-auto', SM_ROW_INPUT, 'w-[64px] flex-none')}
            inputMode="numeric"
            value={tack}
            onChange={(e) => {
              setTack(e.target.value);
            }}
            onBlur={commit}
            aria-label={`${item.name} tack stalls granted per unit`}
          />
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          onRemove(item.id);
        }}
        className="h-auto flex-none rounded-[9px] border border-[#E4B5AC] bg-[#FDF0EE] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F] hover:bg-[#FDF0EE]"
      >
        Remove
      </Button>
    </div>
  );
}

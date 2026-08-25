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
}: {
  item: CatalogListItem;
  onRename: (item: CatalogListItem, name: string, price: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));

  function commit() {
    const nextName = name.trim();
    const nextPrice = Number(price) || 0;
    if (!nextName || (nextName === item.name && nextPrice === item.price)) return;
    onRename(item, nextName, nextPrice);
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

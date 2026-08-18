'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { useUpdateMerchandise } from '@/modules/shows/hooks/use-show-mutations';
import type { MerchItem } from '@/modules/shows/data/setup-queries';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_LABEL,
  SM_SELECT,
  SM_ROW_INPUT,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';

export function MerchandiseCard({
  showId,
  merchandiseEnabled,
  merchItems,
}: {
  showId: string;
  merchandiseEnabled: boolean;
  merchItems: MerchItem[];
}) {
  const [enabled, setEnabled] = useState(merchandiseEnabled);
  const [items, setItems] = useState(merchItems);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const { mutate } = useUpdateMerchandise();

  function commit(nextEnabled: boolean, nextItems: MerchItem[]) {
    setEnabled(nextEnabled);
    setItems(nextItems);
    mutate({ showId, enabled: nextEnabled, items: nextItems });
  }

  function add() {
    const name = newName.trim();
    const price = Number(newPrice);
    if (!name || Number.isNaN(price)) return;
    commit(enabled, [...items, { id: crypto.randomUUID(), name, price }]);
    setNewName('');
    setNewPrice('');
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Merchandise Sales</h2>
      <p className={SM_NOTE}>Will you have merchandise sales at this show?</p>

      <div className="mb-4 max-w-[200px]">
        <label htmlFor="sm-merch" className={SM_LABEL}>
          Merchandise sales
        </label>
        <select
          id="sm-merch"
          value={enabled ? 'yes' : 'no'}
          className={SM_SELECT}
          onChange={(e) => {
            commit(e.target.value === 'yes', items);
          }}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {enabled && (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_100px_auto] items-center gap-3">
              <Input
                value={item.name}
                className={cn('h-auto', SM_ROW_INPUT)}
                onChange={(e) => {
                  commit(
                    enabled,
                    items.map((m) => (m.id === item.id ? { ...m, name: e.target.value } : m))
                  );
                }}
              />
              <Input
                type="number"
                min={0}
                value={item.price}
                className={cn('h-auto', SM_ROW_INPUT)}
                onChange={(e) => {
                  commit(
                    enabled,
                    items.map((m) => (m.id === item.id ? { ...m, price: Number(e.target.value) } : m))
                  );
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  commit(enabled, items.filter((m) => m.id !== item.id));
                }}
                className="h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent hover:text-status-danger"
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_100px_auto] items-center gap-3">
            <Input
              value={newName}
              placeholder="Item name"
              className={cn('h-auto', SM_INPUT)}
              onChange={(e) => {
                setNewName(e.target.value);
              }}
            />
            <Input
              type="number"
              min={0}
              value={newPrice}
              placeholder="Price"
              className={cn('h-auto', SM_INPUT)}
              onChange={(e) => {
                setNewPrice(e.target.value);
              }}
            />
            <PrimaryButton className="whitespace-nowrap rounded-[9px]" onClick={add}>
              + Add item
            </PrimaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}

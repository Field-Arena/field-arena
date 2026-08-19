'use client';

import { useState, type ReactNode } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { useCreateVendorItem } from '@/modules/shows/hooks/use-catalog-mutations';
import type { RiderEntriesData } from '@/modules/shows/data/setup-queries';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_ROW_INPUT,
  SM_GREEN_BTN,
} from '@/modules/shows/ui/show-manager/tokens';
import { VendorSpaceRow } from '@/modules/shows/ui/show-manager/vendor-space-row';

export function VendorSpacesCard({
  data,
  extraAction,
}: {
  data: RiderEntriesData;
  extraAction: ReactNode;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('0');

  const create = useCreateVendorItem();

  function add() {
    if (!name.trim()) return;
    create.mutate(
      { showId: data.showId, name: name.trim(), price: Number(price) || 0, qty },
      {
        onSuccess: () => {
          setName('');
          setQty('');
          setPrice('0');
        },
      },
    );
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Vendor Spaces</h2>
      <p className={SM_NOTE}>
        Booth/table spaces vendors can book at this show. Check which ones you&apos;re offering, set
        each fee, and cap availability if you have a limited number of spots.
      </p>

      {extraAction}

      {data.vendorSpaces.length === 0 ? (
        <p className="mb-3 text-[13px] text-[#98A29D] italic">
          No vendor spaces configured — add whatever this show offers
        </p>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {data.vendorSpaces.map((space) => (
            <VendorSpaceRow key={space.id} space={space} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className={cn('h-auto', SM_ROW_INPUT, 'min-w-[200px] flex-1')}
          placeholder="e.g. 10x10 Booth"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          aria-label="New vendor space name"
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
          aria-label="New vendor space quantity"
        />
        <span className="text-[13px] text-[#6E7C76]">$</span>
        <Input
          className={cn('h-auto', SM_ROW_INPUT, 'w-[110px] flex-none')}
          inputMode="numeric"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
          }}
          aria-label="New vendor space price"
        />
        <Button
          type="button"
          variant="ghost"
          className={cn('h-auto', SM_GREEN_BTN)}
          disabled={create.isPending || !name.trim()}
          onClick={add}
        >
          {create.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}+ Add
        </Button>
      </div>
    </Card>
  );
}

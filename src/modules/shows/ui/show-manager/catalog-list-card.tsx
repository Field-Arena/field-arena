'use client';

import { useState, type ReactNode } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import type { CatalogListItem } from '@/modules/shows/data/setup-queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_ROW_INPUT, SM_GREEN_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { CatalogRow } from '@/modules/shows/ui/show-manager/catalog-row';

/**
 * The name-and-price list shared by Add-Ons and Qualifications.
 *
 * One component for both because the design draws them identically — heading,
 * explanatory note, an empty line in italics, then rows of name + $ + price with
 * a Remove, and a blank add row underneath. Only the copy and which table they
 * write to differ, and both arrive as props.
 *
 * Rows autosave on blur. There is no Save button in the design, and adding one
 * for a two-field row would be more chrome than the edit is worth.
 */
export function CatalogListCard({
  title,
  note,
  emptyNote,
  placeholder,
  items,
  onCreate,
  onRename,
  onRemove,
  creating,
  extraAction,
}: {
  title: string;
  note: string;
  emptyNote: string;
  placeholder: string;
  items: CatalogListItem[];
  onCreate: (name: string, price: number) => void;
  onRename: (item: CatalogListItem, name: string, price: number) => void;
  onRemove: (id: string) => void;
  creating: boolean;
  /** The "+ Load standard space list" button, which only Vendor Spaces has. */
  extraAction?: ReactNode;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');

  function add() {
    if (!name.trim()) return;
    onCreate(name.trim(), Number(price) || 0);
    setName('');
    setPrice('0');
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>{title}</h2>
      <p className={SM_NOTE}>{note}</p>

      {extraAction}

      {items.length === 0 ? (
        <p className="mb-3 text-[13px] italic text-[#98A29D]">{emptyNote}</p>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {items.map((item) => (
            <CatalogRow key={item.id} item={item} onRename={onRename} onRemove={onRemove} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className={cn('h-auto', SM_ROW_INPUT, 'min-w-[220px] flex-1')}
          placeholder={placeholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          aria-label={`New ${title.toLowerCase()} name`}
        />
        <span className="text-[13px] text-[#6E7C76]">$</span>
        <Input
          className={cn('h-auto', SM_ROW_INPUT, 'w-[110px] flex-none')}
          inputMode="numeric"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
          }}
          aria-label={`New ${title.toLowerCase()} price`}
        />
        <Button
          type="button"
          variant="ghost"
          className={cn('h-auto', SM_GREEN_BTN)}
          disabled={creating || !name.trim()}
          onClick={add}
        >
          {creating && <Loader2Icon className="size-4 animate-spin" aria-hidden />}+ Add
        </Button>
      </div>
    </Card>
  );
}

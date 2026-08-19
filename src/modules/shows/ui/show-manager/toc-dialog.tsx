'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { DEFAULT_CLASS_FEE, FM_SETS } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
import { useCreateTocClass } from '@/modules/shows/hooks/use-select-events-mutations';
import {
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
  SM_GREEN_BTN,
  SM_GHOST_BTN,
} from '@/modules/shows/ui/show-manager/tokens';

export function TocDialog({ data, onClose }: { data: SelectEventsData; onClose: () => void }) {
  const [name, setName] = useState('Test of Choice');
  const [division, setDivision] = useState('');
  const [fee, setFee] = useState(String(DEFAULT_CLASS_FEE));
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const create = useCreateTocClass({ onSuccess: onClose });
  const divisions = [
    ...new Set(data.classes.map((c) => c.division).filter((d): d is string => !!d)),
  ];

  const options = FM_SETS['+ USEF/USDF'].flatMap((lv) =>
    lv.tests.map((test) => `${lv.name} — ${test}`),
  );
  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Test of Choice</DialogTitle>
          <DialogDescription>
            One class, several tests. Riders choose which of them they ride when they enter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="toc-name" className={SM_LABEL}>
              Name
            </label>
            <Input
              id="toc-name"
              className={cn('h-auto', SM_INPUT)}
              placeholder="e.g. TOC — Freestyle Fun Night"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="toc-division" className={SM_LABEL}>
                Division
              </label>
              <select
                id="toc-division"
                className={SM_SELECT}
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                }}
              >
                <option value="">—</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="toc-fee" className={SM_LABEL}>
                Entry fee
              </label>
              <Input
                id="toc-fee"
                type="number"
                min={0}
                className={cn('h-auto', SM_INPUT)}
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value);
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="toc-search" className={SM_LABEL}>
              Catalog — {picked.size} selected
            </label>
            <Input
              id="toc-search"
              className={cn('h-auto', SM_INPUT, 'mb-2')}
              placeholder="Search tests…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />

            {filtered.length === 0 ? (
              <p className="py-3 text-[13px] text-[#7A8781]">No tests match that search.</p>
            ) : (
              <div className="max-h-[220px] overflow-y-auto rounded-[10px] border border-[#EDF0EE]">
                {filtered.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-[#F1F4F3] px-3 py-2 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="size-4 flex-none accent-[#1A5B3C]"
                      checked={picked.has(option)}
                      onChange={(e) => {
                        setPicked((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(option);
                          else next.delete(option);
                          return next;
                        });
                      }}
                    />
                    <span className="text-ink-deep text-[12.5px]">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-white')}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', SM_GREEN_BTN)}
            disabled={create.isPending || picked.size === 0 || name.trim().length < 2}
            onClick={() => {
              create.mutate({
                showId: data.showId,
                name,
                division,
                fee,
                testOptions: [...picked],
              });
            }}
          >
            {create.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            Create Test of Choice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { cn } from '@/shared/lib/utils';
import {
  CATALOG_DIVISIONS,
  DEFAULT_CLASS_FEE,
  FM_SETS,
  type FmSetName,
} from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
import { useAddCatalogGroup } from '@/modules/shows/hooks/use-select-events-mutations';
import { SM_GREEN_BTN, SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';

function catalogKey(levelName: string, test: string, division: string): string {
  return `${levelName}::${test}::${division}`;
}

export function FmSetDialog({
  setName,
  data,
  onClose,
}: {
  setName: FmSetName;
  data: SelectEventsData;
  onClose: () => void;
}) {
  const levels = FM_SETS[setName];
  const allKeys = () =>
    new Set(
      levels.flatMap((lv) =>
        lv.tests.flatMap((test) => CATALOG_DIVISIONS.map((d) => catalogKey(lv.name, test, d))),
      ),
    );
  const [picked, setPicked] = useState<Set<string>>(allKeys);
  const [saving, setSaving] = useState(false);
  const add = useAddCatalogGroup();

  const title =
    setName === '+ Independent'
      ? 'Include your own tests'
      : `Include ${setName.replace('+ ', '')} classes`;

  function toggle(key: string, checked: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleLevel(level: (typeof levels)[number], checked: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      for (const test of level.tests) {
        for (const division of CATALOG_DIVISIONS) {
          const key = catalogKey(level.name, test, division);
          if (checked) next.add(key);
          else next.delete(key);
        }
      }
      return next;
    });
  }

  async function save() {
    const calls = levels.flatMap((level) =>
      CATALOG_DIVISIONS.map((division) => ({
        level,
        division,
        tests: level.tests.filter((test) => picked.has(catalogKey(level.name, test, division))),
      })).filter((call) => call.tests.length > 0),
    );
    if (calls.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      for (const { level, division, tests } of calls) {
        await add
          .mutateAsync({
            showId: data.showId,
            category: setName.replace('+ ', ''),
            group: level.name,
            division,
            tests,
            fee: DEFAULT_CLASS_FEE,
            location: '',
          })
          .catch(() => undefined);
      }
    } finally {
      setSaving(false);
    }
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Tick the tests and divisions you&apos;re running, then save.
          </DialogDescription>
        </DialogHeader>

        {levels.length === 0 ? (
          <p className="py-4 text-[13.5px] text-[#7A8781]">
            No organization has built an Independent test yet.
          </p>
        ) : (
          <>
            <div className="mb-2 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-white')}
                onClick={() => {
                  setPicked(allKeys());
                }}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-white')}
                onClick={() => {
                  setPicked(new Set());
                }}
              >
                Deselect all
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {levels.map((level) => {
                const levelKeys = level.tests.flatMap((test) =>
                  CATALOG_DIVISIONS.map((d) => catalogKey(level.name, test, d)),
                );
                const allChecked = levelKeys.every((k) => picked.has(k));

                return (
                  <div
                    key={level.name}
                    className="rounded-[10px] border border-[#EDF0EE] px-3.5 py-2.5"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        className="size-4 flex-none accent-[#1A5B3C]"
                        checked={allChecked}
                        onChange={(e) => {
                          toggleLevel(level, e.target.checked);
                        }}
                      />
                      <span className="text-ink-deep text-[13.5px] font-semibold">
                        {level.name}
                      </span>
                    </label>

                    <div className="mt-2 flex flex-col gap-2 pl-7">
                      {level.tests.map((test) => (
                        <div
                          key={test}
                          className="border-t border-[#EEF2F0] pt-2 first:border-t-0 first:pt-0"
                        >
                          <div className="text-ink-deep mb-1 text-[13px] font-semibold">{test}</div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {CATALOG_DIVISIONS.map((division) => {
                              const key = catalogKey(level.name, test, division);
                              return (
                                <label
                                  key={division}
                                  className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-[#5A6B63]"
                                >
                                  <input
                                    type="checkbox"
                                    className="size-3.5 flex-none accent-[#1A5B3C]"
                                    checked={picked.has(key)}
                                    onChange={(e) => {
                                      toggle(key, e.target.checked);
                                    }}
                                  />
                                  {division}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-white')}
            onClick={onClose}
          >
            Cancel
          </Button>
          {levels.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className={cn('h-auto', SM_GREEN_BTN)}
              disabled={saving}
              onClick={() => {
                void save();
              }}
            >
              {saving && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
              Save selected
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

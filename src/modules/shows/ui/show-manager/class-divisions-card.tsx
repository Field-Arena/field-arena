'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import {
  useCreateDivision,
  useRenameDivision,
  useDeleteDivision,
} from '@/modules/shows/hooks/use-show-mutations';
import type { DivisionRow } from '@/modules/shows/data/setup-queries';
import { DIVISION_PRESETS } from '@/modules/shows/constants';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_ROW_INPUT,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';

export function ClassDivisionsCard({
  showId,
  divisions,
}: {
  showId: string;
  divisions: DivisionRow[];
}) {
  const [rows, setRows] = useState(divisions);
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { mutate: create, isPending: creating } = useCreateDivision({
    onSuccess: (id, name) => {
      setRows((r) => [...r, { id, name, position: r.length, classCount: 0 }]);
      setNewName('');
    },
  });
  const { mutate: rename } = useRenameDivision();
  const { mutate: remove } = useDeleteDivision();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function commitRename(id: string, name: string) {
    setRows((r) => r.map((d) => (d.id === id ? { ...d, name } : d)));
    rename({ divisionId: id, name });
  }

  function commitRemove(id: string) {
    setRows((r) => r.filter((d) => d.id !== id));
    remove(id);
  }

  function addName(name: string) {
    const trimmed = name.trim();
    if (!trimmed || rows.some((d) => d.name === trimmed)) return;
    create({ showId, name: trimmed });
    setOpen(false);
  }

  const existingNames = new Set(rows.map((d) => d.name));
  const presetOptions = DIVISION_PRESETS.filter((name) => !existingNames.has(name));
  const trimmedQuery = newName.trim().toLowerCase();
  const suggestions = trimmedQuery
    ? presetOptions.filter((name) => name.toLowerCase().includes(trimmedQuery))
    : presetOptions;

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Class divisions</h2>
      <p className={SM_NOTE}>
        The subcategories offered under every test. Rename, remove, or add your own.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {rows.map((d) => (
          <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5">
            <Input
              value={d.name}
              className={cn('h-auto', SM_ROW_INPUT)}
              onChange={(e) => {
                commitRename(d.id, e.target.value);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                commitRemove(d.id);
              }}
              className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div ref={rootRef} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="relative">
          <Input
            value={newName}
            placeholder="Choose a standard division, or type your own…"
            className={cn('h-auto', SM_INPUT)}
            onFocus={() => {
              setOpen(true);
            }}
            onChange={(e) => {
              setNewName(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addName(newName);
              }
            }}
          />
          {open && suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="Standard divisions"
              className="absolute top-full left-0 z-30 mt-1 max-h-[240px] w-full overflow-y-auto rounded-[10px] border border-[#D9E1DD] bg-white py-1 shadow-lg"
            >
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      addName(name);
                    }}
                    className="text-ink-deep block w-full truncate px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-[#E9EDEB]"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <PrimaryButton
          className="rounded-[9px] whitespace-nowrap"
          disabled={creating || !newName.trim()}
          onClick={() => {
            addName(newName);
          }}
        >
          + Add division
        </PrimaryButton>
      </div>
    </Card>
  );
}

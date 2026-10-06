'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { blockNonDecimalKeys } from '@/shared/lib/format/number-input';
import {
  useCreateDivision,
  useRenameDivision,
  useUpdateDivisionDefaultFee,
  useDeleteDivision,
} from '@/modules/shows/hooks/use-show-mutations';
import type { DivisionRow } from '@/modules/shows/types';
import { DIVISION_PRESETS, DEFAULT_CLASS_FEE } from '@/modules/shows/constants';
import {
  SM_CARD_PAD,
  SM_NOTE,
  SM_ROW_INPUT,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';
import { SmHead } from './sm-head';

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
  // Last values the server accepted, per division — edits save on blur and
  // roll back to these if the save fails.
  const savedRef = useRef(
    new Map(divisions.map((d) => [d.id, { name: d.name, defaultFee: d.defaultFee }])),
  );

  const { mutate: create, isPending: creating } = useCreateDivision({
    onSuccess: (id, name) => {
      savedRef.current.set(id, { name, defaultFee: null });
      setRows((r) => [...r, { id, name, position: r.length, classCount: 0, defaultFee: null }]);
      setNewName('');
    },
  });
  const { mutate: rename } = useRenameDivision();
  const { mutate: updateDefaultFee } = useUpdateDivisionDefaultFee();
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

  function editName(id: string, name: string) {
    setRows((r) => r.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  function commitRename(id: string, name: string) {
    const saved = savedRef.current.get(id);
    const trimmed = name.trim();
    if (!saved) return;
    // Show exactly what gets stored.
    if (trimmed !== name) editName(id, trimmed);
    if (!trimmed || saved.name === trimmed) {
      if (!trimmed) editName(id, saved.name);
      return;
    }
    rename(
      { divisionId: id, name: trimmed },
      {
        onSuccess: () => {
          // Read the latest saved values: a fee save may have landed meanwhile.
          const latest = savedRef.current.get(id) ?? saved;
          savedRef.current.set(id, { ...latest, name: trimmed });
        },
        onError: () => {
          editName(id, savedRef.current.get(id)?.name ?? saved.name);
        },
      },
    );
  }

  function editDefaultFee(id: string, raw: string) {
    const defaultFee = raw.trim() === '' ? null : Number(raw);
    if (defaultFee !== null && !Number.isFinite(defaultFee)) return;
    setRows((r) => r.map((d) => (d.id === id ? { ...d, defaultFee } : d)));
  }

  function commitDefaultFee(id: string, defaultFee: number | null) {
    const saved = savedRef.current.get(id);
    if (!saved || saved.defaultFee === defaultFee) return;
    updateDefaultFee(
      { divisionId: id, defaultFee },
      {
        onSuccess: () => {
          // Read the latest saved values: a rename may have landed meanwhile.
          const latest = savedRef.current.get(id) ?? saved;
          savedRef.current.set(id, { ...latest, defaultFee });
        },
        onError: () => {
          const fallback = savedRef.current.get(id)?.defaultFee ?? null;
          setRows((r) => r.map((d) => (d.id === id ? { ...d, defaultFee: fallback } : d)));
        },
      },
    );
  }

  function commitRemove(id: string) {
    const index = rows.findIndex((d) => d.id === id);
    const removed = rows[index];
    if (!removed) return;
    setRows((r) => r.filter((d) => d.id !== id));
    remove(id, {
      onError: () => {
        setRows((r) => {
          const next = [...r];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
      },
    });
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
      <SmHead
        icon="divisions"
        title="Class divisions"
        sub="Subcategories offered under every test, with default prices"
      />
      <p className={SM_NOTE}>
        The subcategories offered under every test. Rename, remove, or add your own. Set a default
        price per division — new classes under it start at that price instead of the show default.
      </p>

      <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-3.5 px-0.5">
        <span />
        <span className="text-[11px] font-semibold text-[#8A94A3]">Default price</span>
        <span />
      </div>
      <div className="mb-4 flex flex-col gap-2">
        {rows.map((d) => (
          <div
            key={d.id}
            className="grid grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-3.5"
          >
            <Input
              value={d.name}
              maxLength={120}
              className={cn('h-auto', SM_ROW_INPUT)}
              onChange={(e) => {
                editName(d.id, e.target.value);
              }}
              onBlur={(e) => {
                commitRename(d.id, e.target.value);
              }}
            />
            <Input
              type="number"
              min={0}
              max={100000}
              step="0.01"
              onKeyDown={blockNonDecimalKeys}
              placeholder={`$${String(DEFAULT_CLASS_FEE)}`}
              value={d.defaultFee ?? ''}
              className={cn('h-auto', SM_ROW_INPUT)}
              onChange={(e) => {
                editDefaultFee(d.id, e.target.value);
              }}
              onBlur={() => {
                commitDefaultFee(d.id, d.defaultFee);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                commitRemove(d.id);
              }}
              className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#475467] transition-colors hover:bg-transparent"
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
            maxLength={120}
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
              className="absolute top-full left-0 z-30 mt-1 max-h-[240px] w-full overflow-y-auto rounded-[10px] border border-[#E7EAEE] bg-white py-1 shadow-lg"
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
                    className="block w-full truncate px-3 py-2 text-left text-[13.5px] text-[#101828] transition-colors hover:bg-[#E7EAEE]"
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

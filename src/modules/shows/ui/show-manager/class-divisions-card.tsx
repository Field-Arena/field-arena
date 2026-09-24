'use client';

import { useState } from 'react';
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

const PRESET_PILL =
  'h-auto rounded-full border border-[#D9E1DD] bg-white px-[13px] py-1.5 text-[12.5px] font-semibold ' +
  'text-[#16261F] transition-colors hover:border-[#16261F] hover:bg-white disabled:opacity-60';

export function ClassDivisionsCard({
  showId,
  divisions,
}: {
  showId: string;
  divisions: DivisionRow[];
}) {
  const [rows, setRows] = useState(divisions);
  const [newName, setNewName] = useState('');

  const { mutate: create, isPending: creating } = useCreateDivision({
    onSuccess: (id, name) => {
      setRows((r) => [...r, { id, name, position: r.length, classCount: 0 }]);
      setNewName('');
    },
  });
  const { mutate: rename } = useRenameDivision();
  const { mutate: remove } = useDeleteDivision();

  function commitRename(id: string, name: string) {
    setRows((r) => r.map((d) => (d.id === id ? { ...d, name } : d)));
    rename({ divisionId: id, name });
  }

  function commitRemove(id: string) {
    setRows((r) => r.filter((d) => d.id !== id));
    remove(id);
  }

  function add() {
    const name = newName.trim();
    if (!name || rows.some((d) => d.name === name)) return;
    create({ showId, name });
  }

  const existingNames = new Set(rows.map((d) => d.name));
  const presetOptions = DIVISION_PRESETS.filter((name) => !existingNames.has(name));

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

      {presetOptions.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-[11.5px] font-semibold text-[#98A29D]">Quick add:</p>
          <div className="flex flex-wrap items-center gap-2">
            {presetOptions.map((name) => (
              <Button
                key={name}
                type="button"
                variant="ghost"
                className={PRESET_PILL}
                disabled={creating}
                onClick={() => {
                  create({ showId, name });
                }}
              >
                + {name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Input
          value={newName}
          placeholder="e.g. Vintage, Para, Masters"
          className={cn('h-auto', SM_INPUT)}
          onChange={(e) => {
            setNewName(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <PrimaryButton
          className="rounded-[9px] whitespace-nowrap"
          disabled={creating || !newName.trim()}
          onClick={add}
        >
          + Add division
        </PrimaryButton>
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import {
  useCreateDivision,
  useRenameDivision,
  useDeleteDivision,
} from '../../hooks/use-show-mutations';
import type { DivisionRow } from '../../data/setup-queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_ROW_INPUT, SM_INPUT } from './tokens';

/** "Class divisions" — createDivision already existed (used elsewhere); this card adds rename/remove and the Setup-tab UI around all three. */
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

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Class divisions</h2>
      <p className={SM_NOTE}>
        The subcategories offered under every test. Rename, remove, or add your own.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {rows.map((d) => (
          <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5">
            <input
              value={d.name}
              className={SM_ROW_INPUT}
              onChange={(e) => {
                commitRename(d.id, e.target.value);
              }}
            />
            <button
              type="button"
              onClick={() => {
                commitRemove(d.id);
              }}
              className="bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:text-status-danger"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <input
          value={newName}
          placeholder="e.g. Vintage, Para, Masters"
          className={SM_INPUT}
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
          className="whitespace-nowrap rounded-[9px]"
          disabled={creating || !newName.trim()}
          onClick={add}
        >
          + Add division
        </PrimaryButton>
      </div>
    </Card>
  );
}

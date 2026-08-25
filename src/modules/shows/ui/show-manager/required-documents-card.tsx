'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';
import { useUpdateDocumentRequirements } from '@/modules/shows/hooks/use-show-mutations';
import type { DocumentRequirement } from '@/modules/shows/data/setup-queries';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_ROW_INPUT,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';

export function RequiredDocumentsCard({
  showId,
  documentRequirements,
}: {
  showId: string;
  documentRequirements: DocumentRequirement[];
}) {
  const [rows, setRows] = useState(documentRequirements);
  const [newLabel, setNewLabel] = useState('');
  const { mutate, isPending } = useUpdateDocumentRequirements();

  function commit(next: DocumentRequirement[]) {
    setRows(next);
    mutate({ showId, requirements: next });
  }

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    commit([
      ...rows,
      { id: crypto.randomUUID(), label, requiresExpiration: false, requiresApproval: false },
    ]);
    setNewLabel('');
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Required Documents</h2>
      <p className={SM_NOTE}>
        Documentation riders need on file for this show — Coggins, vaccination records, whatever
        this show requires. This defines the list riders see when uploading.
      </p>

      {rows.length === 0 ? (
        <p className="mb-4 text-[13px] text-[#98A29D] italic">
          No requirements yet — add whatever this show needs on file
        </p>
      ) : (
        <div className="mb-4 flex flex-col gap-2.5">
          {rows.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center gap-3.5">
              <Input
                value={doc.label}
                className={cn('h-auto', SM_ROW_INPUT, 'flex-[0_1_210px]')}
                onChange={(e) => {
                  commit(rows.map((d) => (d.id === doc.id ? { ...d, label: e.target.value } : d)));
                }}
              />
              <Label className="inline-flex items-center gap-[7px] text-[13px] text-[#48574F]">
                <input
                  type="checkbox"
                  checked={!!doc.requiresExpiration}
                  className="size-3.5 accent-[#1A5B3C]"
                  onChange={(e) => {
                    commit(
                      rows.map((d) =>
                        d.id === doc.id ? { ...d, requiresExpiration: e.target.checked } : d,
                      ),
                    );
                  }}
                />
                Requires expiration date
              </Label>
              <Label className="inline-flex items-center gap-[7px] text-[13px] text-[#48574F]">
                <input
                  type="checkbox"
                  checked={!!doc.requiresApproval}
                  className="size-3.5 accent-[#1A5B3C]"
                  onChange={(e) => {
                    commit(
                      rows.map((d) =>
                        d.id === doc.id ? { ...d, requiresApproval: e.target.checked } : d,
                      ),
                    );
                  }}
                />
                Requires staff approval
              </Label>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  commit(rows.filter((d) => d.id !== doc.id));
                }}
                className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Input
          value={newLabel}
          placeholder="e.g. Coggins, Vaccination record"
          className={cn('h-auto', SM_INPUT)}
          onChange={(e) => {
            setNewLabel(e.target.value);
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
          disabled={isPending || !newLabel.trim()}
          onClick={add}
        >
          + Add requirement
        </PrimaryButton>
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import {
  useAddHoldingEntry,
  useRemoveHoldingEntry,
  useWorkInEntry,
} from '@/modules/scoring/hooks/use-scoring-mutations';
import type { RideEntry } from '@/modules/scoring/types';
import { BACK_NUMBER_MAX_LENGTH } from '@/modules/scoring/constants';
import { sanitizeBackNumber } from '@/modules/scoring/utils/sanitize-back-number';

export function HoldingQueuePanel({
  classId,
  holdingEntries,
  workingInEntryId,
  canManage,
}: {
  classId: string;
  holdingEntries: RideEntry[];
  workingInEntryId: string | null;
  canManage: boolean;
}) {
  const [num, setNum] = useState('');
  const [rider, setRider] = useState('');
  const [horse, setHorse] = useState('');

  const add = useAddHoldingEntry();
  const remove = useRemoveHoldingEntry();
  const workIn = useWorkInEntry();

  if (!canManage && holdingEntries.length === 0) return null;

  return (
    <div className="fa-card !overflow-visible p-5">
      <span className="mb-3 block text-[11px] font-semibold tracking-[.08em] text-[var(--fa-ink-3)] uppercase">
        Holding queue
      </span>

      {holdingEntries.length === 0 ? (
        <p className="text-[13px] text-[#8A94A3]">No riders waiting.</p>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {holdingEntries.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-[#E7EAEE] p-2.5"
            >
              <span className="flex-1 text-[13.5px] text-[#101828]">
                #{e.num} {e.rider ?? '—'} {e.horse ? `· ${e.horse}` : ''}
              </span>
              {canManage && (
                <>
                  {workingInEntryId === e.id ? (
                    <span className="text-[12px] font-semibold text-[#2E7D46]">Working in now</span>
                  ) : (
                    <GhostButton
                      type="button"
                      disabled={workIn.isPending}
                      onClick={() => {
                        workIn.mutate({ classId, entryId: e.id });
                      }}
                    >
                      Work in
                    </GhostButton>
                  )}
                  <GhostButton
                    type="button"
                    disabled={remove.isPending}
                    onClick={() => {
                      remove.mutate({ classId, entryId: e.id });
                    }}
                  >
                    Remove
                  </GhostButton>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!num.trim()) return;
            add.mutate(
              {
                classId,
                num: num.trim(),
                rider: rider.trim() || undefined,
                horse: horse.trim() || undefined,
              },
              {
                onSuccess: () => {
                  setNum('');
                  setRider('');
                  setHorse('');
                },
              },
            );
          }}
        >
          <Input
            placeholder="Number"
            inputMode="numeric"
            maxLength={BACK_NUMBER_MAX_LENGTH}
            value={num}
            onChange={(e) => {
              setNum(sanitizeBackNumber(e.target.value));
            }}
            className="w-24"
          />
          <Input
            placeholder="Rider"
            maxLength={120}
            value={rider}
            onChange={(e) => {
              setRider(e.target.value);
            }}
            className="w-40"
          />
          <Input
            placeholder="Horse"
            maxLength={120}
            value={horse}
            onChange={(e) => {
              setHorse(e.target.value);
            }}
            className="w-40"
          />
          <GoldButton type="submit" disabled={add.isPending}>
            Add
          </GoldButton>
        </form>
      )}
    </div>
  );
}

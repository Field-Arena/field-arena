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

/**
 * Emergency/late riders, independent of the normal draw — ported from
 * showrunner-scoring.html's holding-queue block. "Work in" doesn't touch
 * `scoringPos`, so the normal order resumes exactly where it left off once
 * the worked-in ride is scored/scratched/DQ'd.
 */
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
    <div className="rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
      <span className="mb-3 block text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
        Holding queue
      </span>

      {holdingEntries.length === 0 ? (
        <p className="text-[13px] text-[#7A8781]">No riders waiting.</p>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {holdingEntries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-lg border border-[#E9EDEB] p-2.5">
              <span className="flex-1 text-[13.5px] text-ink-deep">
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
              { classId, num: num.trim(), rider: rider.trim() || undefined, horse: horse.trim() || undefined },
              {
                onSuccess: () => {
                  setNum('');
                  setRider('');
                  setHorse('');
                },
              }
            );
          }}
        >
          <Input
            placeholder="Number"
            value={num}
            onChange={(e) => {
              setNum(e.target.value);
            }}
            className="w-24"
          />
          <Input
            placeholder="Rider"
            value={rider}
            onChange={(e) => {
              setRider(e.target.value);
            }}
            className="w-40"
          />
          <Input
            placeholder="Horse"
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

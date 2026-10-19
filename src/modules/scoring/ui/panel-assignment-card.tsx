'use client';

import { GhostButton } from '@/shared/ui/organizer/buttons';
import {
  useRemovePanelSeat,
  useUpsertPanelSeat,
} from '@/modules/scoring/hooks/use-scoring-mutations';
import type { PanelCandidate, PanelSeat } from '@/modules/scoring/types';

export function PanelAssignmentCard({
  classId,
  panel,
  candidates,
}: {
  classId: string;
  panel: PanelSeat[];
  candidates: PanelCandidate[];
}) {
  const upsert = useUpsertPanelSeat();
  const remove = useRemovePanelSeat();

  const judges = candidates.filter((c) => c.role === 'Judge');
  const scribes = candidates.filter((c) => c.role === 'Scribe');

  function nextSeatId(): string {
    const taken = new Set(panel.map((p) => p.seatId));
    let n = 1;
    while (taken.has(`J${String(n)}`)) n += 1;
    return `J${String(n)}`;
  }

  return (
    <div className="fa-card !overflow-visible p-5">
      <span className="mb-3 block text-[11px] font-semibold tracking-[.08em] text-[var(--fa-ink-3)] uppercase">
        Panel Assignment
      </span>

      <div className="flex flex-col gap-2.5">
        {panel.map((seat) => (
          <div
            key={seat.seatId}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E7EAEE] p-2.5"
          >
            <span className="w-24 flex-none text-[13px] font-semibold text-[#101828]">
              Judge at {seat.position ?? '—'}
            </span>

            <select
              className="rounded-md border border-[#E7EAEE] px-2 py-1.5 text-[13px]"
              value={seat.judgeStaffId ?? ''}
              onChange={(e) => {
                upsert.mutate({
                  classId,
                  seatId: seat.seatId,
                  judgeStaffId: e.target.value || null,
                });
              }}
            >
              <option value="">— Judge —</option>
              {judges.map((j) => (
                <option key={j.staffId} value={j.staffId}>
                  {j.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-[#E7EAEE] px-2 py-1.5 text-[13px]"
              value={seat.scribeStaffId ?? ''}
              onChange={(e) => {
                upsert.mutate({
                  classId,
                  seatId: seat.seatId,
                  scribeStaffId: e.target.value || null,
                });
              }}
            >
              <option value="">— Scribe —</option>
              {scribes.map((s) => (
                <option key={s.staffId} value={s.staffId}>
                  {s.name}
                </option>
              ))}
            </select>

            <GhostButton
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate({ classId, seatId: seat.seatId });
              }}
            >
              Remove
            </GhostButton>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <GhostButton
          type="button"
          disabled={upsert.isPending}
          onClick={() => {
            upsert.mutate({ classId, seatId: nextSeatId(), position: null });
          }}
        >
          + Add judge
        </GhostButton>
      </div>
    </div>
  );
}

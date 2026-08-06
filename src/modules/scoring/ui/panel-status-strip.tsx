import type { PanelSeat, ScoreRow } from '../types';

/** A chip per panel seat — green once that seat has submitted for the current ride, grey while waiting. */
export function PanelStatusStrip({
  panel,
  scores,
  entryId,
}: {
  panel: PanelSeat[];
  scores: ScoreRow[];
  entryId: string;
}) {
  if (panel.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {panel.map((seat) => {
        const score = scores.find((s) => s.entryId === entryId && s.seatId === seat.seatId);
        const ready = score?.submitted ?? false;
        const name = seat.judgeName ?? seat.scribeName ?? seat.seatId;
        return (
          <span
            key={seat.seatId}
            className={`inline-flex items-center gap-[7px] rounded-full border px-3 py-[5px] text-[12px] font-semibold whitespace-nowrap ${
              ready
                ? 'border-[#BFE0CB] bg-[#DCEFE1] text-[#2E7D46]'
                : 'border-[#E9EDEB] bg-[#F1F4F3] text-[#7A8781]'
            }`}
          >
            <span className={`size-[7px] rounded-full ${ready ? 'bg-[#2E7D46]' : 'bg-[#B4BFB9]'}`} />
            {name} · {seat.position ?? seat.seatId} · {ready ? 'submitted' : 'waiting'}
          </span>
        );
      })}
    </div>
  );
}

import type { PanelSeat, ScoreRow } from '@/modules/scoring/types';

/** One chip per seat on the panel for the rider in the ring — the redesign's
 * "Name (C) — scoring / waiting / submitted" row. */
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
        const submitted = score?.submitted ?? false;
        const started =
          !submitted &&
          score !== undefined &&
          (Object.keys(score.movements).length > 0 || Object.keys(score.collectives).length > 0);
        const state = submitted ? 'submitted' : started ? 'scoring' : 'waiting';
        const name = seat.judgeName ?? seat.scribeName ?? seat.seatId;
        return (
          <span
            key={seat.seatId}
            className={`inline-flex items-center gap-[7px] rounded-full border px-3 py-[5px] text-[12px] font-semibold whitespace-nowrap ${
              state === 'submitted'
                ? 'border-[#CDEEDE] bg-[var(--fa-emerald-tint)] text-[var(--fa-emerald)]'
                : state === 'scoring'
                  ? 'border-[var(--fa-brand)] bg-[var(--fa-brand-tint)] text-[var(--fa-brand-ink)]'
                  : 'border-[var(--fa-line)] bg-white text-[var(--fa-ink-2)]'
            }`}
          >
            <span
              className={`size-[7px] rounded-full ${state === 'waiting' ? 'bg-[#C3CAD3]' : state === 'scoring' ? 'bg-[var(--fa-brand)]' : 'bg-[var(--fa-emerald)]'}`}
            />
            {name}
            {seat.position ? ` (${seat.position})` : ''} — {state}
          </span>
        );
      })}
    </div>
  );
}

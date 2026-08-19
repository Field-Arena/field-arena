import { standings } from '@/modules/scoring/scoring-engine';
import { parseFinalPct } from '@/modules/scoring/utils/parse-final-pct';
import type { RideEntry } from '@/modules/scoring/types';

/** Live leaderboard — only rides with a real percentage rank, ties share a place. */
export function StandingsPanel({ entries }: { entries: RideEntry[] }) {
  const rows = standings(
    entries
      .filter((e) => e.advancedPast)
      .map((e) => ({
        num: e.num,
        rider: e.rider ?? '—',
        horse: e.horse ?? '—',
        finalPct: parseFinalPct(e.finalPct),
        ctot: e.collectiveTotal,
      }))
  ).slice(0, 6);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px]">
      <span className="mb-3 block text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
        Standings — Top 6
      </span>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.num} className="flex items-center gap-3 text-[13.5px]">
            <span className="w-6 flex-none text-right font-bold text-ink-deep">{row.rank}</span>
            <span className="flex-1 text-ink-deep">
              {row.rider} <span className="text-[#7A8781]">· {row.horse}</span>
            </span>
            <span className="font-mono font-semibold text-ink-deep">{row.pct.toFixed(3)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

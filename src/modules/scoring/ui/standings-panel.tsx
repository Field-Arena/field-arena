import { standings } from '@/modules/scoring/scoring-engine';
import { parseFinalPct } from '@/modules/scoring/utils/parse-final-pct';
import type { RideEntry } from '@/modules/scoring/types';

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
      })),
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
            <span className="text-ink-deep w-6 flex-none text-right font-bold">{row.rank}</span>
            <span className="text-ink-deep flex-1">
              {row.rider} <span className="text-[#7A8781]">· {row.horse}</span>
            </span>
            <span className="text-ink-deep font-mono font-semibold">{row.pct.toFixed(3)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

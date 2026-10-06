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
    <div className="fa-card !overflow-visible p-5">
      <span className="mb-3 block text-[11px] font-semibold tracking-[.08em] text-[var(--fa-ink-3)] uppercase">
        Standings — Top 6
      </span>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.num} className="flex items-center gap-3 text-[13.5px]">
            <span className="w-6 flex-none text-right font-bold text-[#101828]">{row.rank}</span>
            <span className="flex-1 text-[#101828]">
              {row.rider} <span className="text-[#8A94A3]">· {row.horse}</span>
            </span>
            <span className="font-semibold text-[#101828] tabular-nums">{row.pct.toFixed(3)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

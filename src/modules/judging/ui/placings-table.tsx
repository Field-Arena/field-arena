'use client';

import { useRouter } from 'next/navigation';
import { rankPlacings, type PlacingRow } from '../utils';
import type { ClassPlacingEntry } from '../data/queries';

/**
 * Rank/rider/horse/score, ported from judge-scribe.html's `placingsTableHtml`
 * — shared by the Results view (My Assignments' inline standings) and the
 * History drill-down's second level. `linkBase` makes each row navigate to
 * that entry's scorecard when present (History); omitted, rows are plain
 * (Results, which doesn't drill further in legacy either).
 */
export function PlacingsTable({
  entries,
  linkBase,
}: {
  entries: ClassPlacingEntry[];
  linkBase?: string;
}) {
  const router = useRouter();
  const rows = rankPlacings(entries);

  if (rows.length === 0) {
    return <p className="text-[13px] text-[#7A8781]">No confirmed scores yet.</p>;
  }

  return (
    <table className="w-full border-collapse text-[13.5px]">
      <thead>
        <tr className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
          <th className="p-2">Place</th>
          <th className="p-2">Rider</th>
          <th className="p-2">Horse</th>
          <th className="p-2 text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row: PlacingRow) => (
          <tr
            key={row.entryId}
            className={`border-t border-[#E9EDEB] ${linkBase ? 'cursor-pointer hover:bg-[#F5F7F6]' : ''}`}
            onClick={
              linkBase
                ? () => {
                    router.push(`${linkBase}/${row.entryId}`);
                  }
                : undefined
            }
          >
            <td className="p-2 font-bold text-ink-deep">{row.rank}</td>
            <td className="p-2 text-ink-deep">{row.rider}</td>
            <td className="p-2 text-[#5A6B63]">{row.horse}</td>
            <td className="p-2 text-right font-mono font-semibold text-ink-deep">{row.pct.toFixed(3)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

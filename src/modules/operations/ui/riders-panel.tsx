'use client';
import { useMemo, useState } from 'react';
import type { RiderDirectoryRow } from '@/modules/operations/types';
import { OpsSearch } from '@/modules/operations/ui/ops-search';
import {
  Chip,
  ChipRow,
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

type Filter = 'all' | 'stalled' | 'unstalled' | 'multi';

export function RidersPanel({ riders }: { riders: RiderDirectoryRow[] }) {
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      horses: new Set(riders.map((r) => r.horse)).size,
      stalled: riders.filter((r) => r.stable).length,
      unstalled: riders.filter((r) => !r.stable).length,
      multi: riders.filter((r) => r.classNames.length > 1).length,
    }),
    [riders],
  );

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase().replace(/^#/, '');
    return riders
      .filter((r) => {
        if (filter === 'stalled') return !!r.stable;
        if (filter === 'unstalled') return !r.stable;
        if (filter === 'multi') return r.classNames.length > 1;
        return true;
      })
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.horse.toLowerCase().includes(q) ||
          r.num.includes(q),
      );
  }, [term, filter, riders]);

  const chips: [Filter, string, number][] = [
    ['all', 'All', riders.length],
    ['stalled', 'Stalled', counts.stalled],
    ['unstalled', 'No stall', counts.unstalled],
    ['multi', 'More than one class', counts.multi],
  ];

  return (
    <>
      <StatGrid cols={3}>
        <StatBox label="Riders entered" value={riders.length} />
        <StatBox label="Horses" value={counts.horses} note="ridden by these riders" />
        <StatBox label="Stalled" value={counts.stalled} note="have a stall" />
      </StatGrid>

      <ChipRow>
        {chips.map(([key, label, n]) => (
          <Chip
            key={key}
            active={filter === key}
            onClick={() => {
              setFilter(key);
            }}
          >
            {label} ({n})
          </Chip>
        ))}
        <OpsSearch
          value={term}
          onChange={setTerm}
          placeholder="Rider, horse or #"
          label="Search riders"
        />
      </ChipRow>

      {riders.length === 0 ? (
        <EmptyState title="No riders yet" note="Riders appear here once they enter this show." />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th className={FA_TH}>#</th>
                <th className={FA_TH}>Rider</th>
                <th className={FA_TH}>Horse</th>
                <th className={FA_TH}>Stable · Stall</th>
                <th className={FA_TH}>Classes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr className={FA_TR}>
                  <td colSpan={5} className={`${FA_TD} text-[#5A6B63]`}>
                    No matches.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.num} className={FA_TR}>
                  <td className={`${FA_TD} font-semibold`}>#{r.num}</td>
                  <td className={`${FA_TD} font-bold`}>{r.name}</td>
                  <td className={FA_TD}>{r.horse}</td>
                  <td className={`${FA_TD} font-semibold text-[#5A6B63]`}>{r.stable ?? '—'}</td>
                  <td className={`${FA_TD} text-[12.5px] text-[#5A6B63]`}>
                    {r.classNames.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

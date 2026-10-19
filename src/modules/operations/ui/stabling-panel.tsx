'use client';
import { useMemo, useState } from 'react';
import type { StablingData } from '@/modules/operations/types';
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

const ALL = '__all__';

export function StablingPanel({ stabling }: { stabling: StablingData }) {
  const [stable, setStable] = useState(ALL);
  const [term, setTerm] = useState('');

  const byStable = useMemo(() => {
    const map = new Map<string, number>();
    for (const stall of stabling.stalls) map.set(stall.stable, (map.get(stall.stable) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [stabling.stalls]);

  const riderCount = useMemo(
    () => new Set(stabling.stalls.map((s) => s.riderName)).size,
    [stabling.stalls],
  );

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase().replace(/^#/, '');
    return stabling.stalls
      .filter((s) => stable === ALL || s.stable === stable)
      .filter(
        (s) =>
          !q ||
          s.horseName.toLowerCase().includes(q) ||
          s.riderName.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q) ||
          (s.num ?? '').includes(q),
      );
  }, [stabling.stalls, stable, term]);

  if (!stabling.published) {
    return (
      <EmptyState
        title="Stable chart not published"
        note="Your organizer hasn't published the stable chart for this show yet."
      />
    );
  }

  return (
    <>
      <StatGrid cols={3}>
        <StatBox label="Stalled" value={stabling.stalls.length} note="horses in barns" />
        <StatBox label="Barns" value={byStable.length} />
        <StatBox label="Riders" value={riderCount} note="with a stalled horse" />
      </StatGrid>

      {byStable.length === 0 ? (
        <EmptyState title="No stalls assigned yet" />
      ) : (
        <>
          <ChipRow>
            <Chip
              active={stable === ALL}
              onClick={() => {
                setStable(ALL);
              }}
            >
              All ({stabling.stalls.length})
            </Chip>
            {byStable.map(([name, n]) => (
              <Chip
                key={name}
                active={stable === name}
                onClick={() => {
                  setStable(name);
                }}
              >
                {name} ({n})
              </Chip>
            ))}
            <OpsSearch
              value={term}
              onChange={setTerm}
              placeholder="Horse, rider, stall or #"
              label="Search stalls"
            />
          </ChipRow>

          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={FA_TH}>Stable · Stall</th>
                  <th className={FA_TH}>#</th>
                  <th className={FA_TH}>Rider</th>
                  <th className={FA_TH}>Horse</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr className={FA_TR}>
                    <td colSpan={4} className={`${FA_TD} text-[#5A6B63]`}>
                      No matches.
                    </td>
                  </tr>
                )}
                {rows.map((s) => (
                  <tr key={`${s.stable}-${s.label}`} className={FA_TR}>
                    <td className={`${FA_TD} font-semibold`}>
                      {s.stable} · {s.label}
                    </td>
                    <td className={`${FA_TD} text-[#5A6B63]`}>{s.num ? `#${s.num}` : '—'}</td>
                    <td className={FA_TD}>{s.riderName}</td>
                    <td className={`${FA_TD} font-bold`}>{s.horseName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

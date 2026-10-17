'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileTextIcon, SearchIcon } from 'lucide-react';
import { fmtTime, type ScheduleRide } from '@/modules/shows/schedule-engine';
import type { MasterScheduleData } from '@/modules/shows/data/setup-queries';
import { dayDate } from '@/modules/shows/utils/day-date';

interface RideRow { ride: ScheduleRide; ring: string }
type Status = 'scored' | 'in-ring' | 'on-deck' | 'scratched' | 'waiting';

const STATUS: Record<Status, { label: string; className: string }> = {
  scored: { label: 'Scored', className: 'bg-[#E9F4EE] text-[#1A5B3C]' },
  'in-ring': { label: 'In the ring', className: 'bg-[#B4432F] text-white' },
  'on-deck': { label: 'On deck', className: 'bg-[#FCF3E4] text-[#8A6D14]' },
  scratched: { label: 'Scratched', className: 'bg-[#EDF0EE] text-[#5A6B63]' },
  waiting: { label: 'Waiting', className: 'bg-[#EDF0EE] text-[#3F4F48]' },
};

const chip = (on: boolean) =>
  `inline-flex h-9 cursor-pointer items-center rounded-full border-2 px-4 text-[13px] font-bold ${
    on
      ? 'border-[#1A5B3C] bg-[#1A5B3C] text-white'
      : 'border-[#C9D3CE] bg-white text-[#16261F] hover:border-[#1A5B3C]'
  }`;

/** The schedule as one running order: every ride in time order, grouped by
 * test, with where each ride stands, a search, and print per test. */
export function RunningOrderView({
  data,
  filterDay,
}: {
  data: MasterScheduleData;
  filterDay: number | null;
}) {
  const [ring, setRing] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const all: RideRow[] = useMemo(
    () =>
      data.schedule.arenas.flatMap((arena) =>
        arena.items
          .filter((it): it is ScheduleRide => it.type === 'ride')
          .map((ride) => ({ ride, ring: arena.ring })),
      ),
    [data],
  );

  // Same rule as the ring editor: in each ring, the first unscored,
  // unscratched ride is in the ring and the next one is on deck.
  const statusByEntry = useMemo(() => {
    const map = new Map<string, Status>();
    for (const arena of data.schedule.arenas) {
      const rides = arena.items
        .filter((it): it is ScheduleRide => it.type === 'ride')
        .sort((a, b) => a.day - b.day || a.start - b.start);
      let next = 0;
      for (const r of rides) {
        if (r.status === 'scratched') map.set(r.entryId, 'scratched');
        else if (data.finalPctByEntry[r.entryId]) map.set(r.entryId, 'scored');
        else {
          map.set(r.entryId, next === 0 ? 'in-ring' : next === 1 ? 'on-deck' : 'waiting');
          next++;
        }
      }
    }
    return map;
  }, [data]);

  const rings = [...new Set(all.map((r) => r.ring))].sort();
  const needle = query.trim().toLowerCase();
  const rows = all
    .filter((r) => filterDay == null || r.ride.day === filterDay)
    .filter((r) => !ring || r.ring === ring)
    .filter(
      (r) =>
        !needle ||
        r.ride.name.toLowerCase().includes(needle) ||
        r.ride.horse.toLowerCase().includes(needle) ||
        r.ride.num.toLowerCase().includes(needle.replace(/^#/, '')),
    )
    .sort(
      (a, b) =>
        a.ride.day - b.ride.day || a.ride.start - b.ride.start || a.ring.localeCompare(b.ring),
    );

  // Group consecutive rides of the same test (and day/ring) under one header.
  const groups: {
    key: string;
    cls: string;
    label: string;
    ring: string;
    day: number;
    rows: RideRow[];
  }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last?.cls === r.ride.cls && last.ring === r.ring && last.day === r.ride.day) {
      last.rows.push(r);
    } else {
      groups.push({
        key: `${r.ride.cls}-${r.ring}-${String(r.ride.day)}-${String(groups.length)}`,
        cls: r.ride.cls,
        label: r.ride.label,
        ring: r.ring,
        day: r.ride.day,
        rows: [r],
      });
    }
  }
  const sheetsByClass = (cls: string) =>
    all.filter((r) => r.ride.cls === cls && r.ride.status !== 'scratched').length;

  // Day at a glance, for the selected day (or the whole show).
  const scope = all.filter((r) => filterDay == null || r.ride.day === filterDay);
  const active = scope.filter((r) => r.ride.status !== 'scratched');
  const testsInScope = new Set(scope.map((r) => r.ride.cls)).size;
  const ringsUsed = new Set(scope.map((r) => r.ring));
  const firstStart = active.length ? Math.min(...active.map((r) => r.ride.start)) : null;
  const lastEnd = active.length ? Math.max(...active.map((r) => r.ride.end)) : null;
  const { conflictsAvoided, conflictsWaited } = data.schedule;

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={chip(ring === null)}
          onClick={() => {
            setRing(null);
          }}
        >
          All rings
        </button>
        {rings.map((r) => (
          <button
            key={r}
            type="button"
            className={chip(ring === r)}
            onClick={() => {
              setRing(r);
            }}
          >
            {r}
          </button>
        ))}
        <label className="ml-auto flex h-10 w-[320px] max-w-full items-center gap-2 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 focus-within:border-[#1A5B3C]">
          <SearchIcon className="size-4 text-[#98A29D]" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Find a rider, horse or entry #"
            aria-label="Find a rider, horse or entry number"
            className="w-full border-0 bg-transparent text-[14px] outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white">
          <div className="grid grid-cols-[70px_70px_64px_1fr_1fr_130px] gap-2.5 bg-[#F5F7F6] px-3.5 py-2 text-[11px] font-extrabold tracking-[.06em] text-[#5A6B63] uppercase">
            <span>Time</span>
            <span>Ring</span>
            <span>Entry</span>
            <span>Rider</span>
            <span>Horse</span>
            <span>Status</span>
          </div>
          {groups.length === 0 && (
            <p className="m-0 px-4 py-6 text-[14px] text-[#5A6B63]">
              {needle ? `No rides match “${query}”.` : 'No rides scheduled for this selection.'}
            </p>
          )}
          {groups.map((g) => {
            const first = g.rows[0]?.ride.start ?? 0;
            const last = g.rows[g.rows.length - 1]?.ride.end ?? 0;
            const count = sheetsByClass(g.cls);
            return (
              <div key={g.key}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-[#D9E1DD] bg-[#F4FAF6] px-3.5 py-2.5">
                  <div>
                    <span className="text-[15px] font-bold text-[#0D2C23]">{g.label}</span>{' '}
                    <span className="text-[12px] font-semibold text-[#5A6B63]">
                      · {g.ring} · {filterDay == null ? `${dayDate(data.startDate, g.day)} · ` : ''}
                      {fmtTime(first)}–{fmtTime(last)} · {g.rows.length} ride
                      {g.rows.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/score-sheets?show=${data.showId}&class=${g.cls}`}
                    prefetch={false}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-[8px] border-2 border-[#1A5B3C] bg-white px-3 py-1 text-[12.5px] font-bold text-[#1A5B3C] no-underline hover:bg-[#1A5B3C] hover:text-white"
                  >
                    <FileTextIcon className="size-3.5" aria-hidden />
                    Print {count}
                  </Link>
                </div>
                {g.rows.map(({ ride }) => {
                  const status = statusByEntry.get(ride.entryId) ?? 'waiting';
                  const s = STATUS[status];
                  const pct = data.finalPctByEntry[ride.entryId];
                  const scratched = status === 'scratched';
                  const inRing = status === 'in-ring';
                  return (
                    <div
                      key={ride.entryId}
                      className={`grid grid-cols-[70px_70px_64px_1fr_1fr_130px] items-center gap-2.5 border-t border-[#EDF0EE] px-3.5 py-2 text-[13.5px] ${
                        inRing ? 'bg-[#FDEEEB] font-bold' : ''
                      }`}
                    >
                      <span>{fmtTime(ride.start)}</span>
                      <span>{g.ring}</span>
                      <b>#{ride.num}</b>
                      <span className={scratched ? 'text-[#98A29D] line-through' : ''}>
                        {ride.name}
                      </span>
                      <span className={scratched ? 'text-[#98A29D]' : ''}>{ride.horse}</span>
                      <span
                        className={`justify-self-start rounded-[7px] px-2 py-0.5 text-[11.5px] font-extrabold ${s.className}`}
                      >
                        {status === 'scored' && pct ? `Scored ${pct}%` : s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white px-4 py-3">
            <h4 className="m-0 mb-1.5 text-[16px] font-bold text-[#0D2C23]">
              {filterDay == null ? 'Show at a glance' : dayDate(data.startDate, filterDay)}
            </h4>
            <div className="text-[13px] leading-[1.75] font-semibold text-[#5A6B63]">
              {testsInScope} test{testsInScope === 1 ? '' : 's'} · {active.length} rides
              {scope.length > active.length
                ? ` · ${String(scope.length - active.length)} scratched`
                : ''}
              <br />
              {firstStart !== null && lastEnd !== null
                ? `First ride ${fmtTime(firstStart)} · last ends ~${fmtTime(lastEnd)}`
                : 'No rides yet'}
              <br />
              Rings in use: {[...ringsUsed].sort().join(', ') || '—'}
            </div>
          </div>
          <div className="rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white px-4 py-3">
            <h4 className="m-0 mb-1.5 text-[16px] font-bold text-[#0D2C23]">Schedule checks</h4>
            <div className="text-[13px] leading-[1.75] font-semibold">
              <div className="text-[#1A5B3C]">
                ✓ {conflictsAvoided} rider/horse clash{conflictsAvoided === 1 ? '' : 'es'} avoided
              </div>
              {conflictsWaited > 0 ? (
                <div className="text-[#B4432F]">
                  ! {conflictsWaited} ride{conflictsWaited === 1 ? '' : 's'} moved later to respect
                  rest gaps — see Edit by ring
                </div>
              ) : (
                <div className="text-[#1A5B3C]">✓ Every rest gap is met</div>
              )}
            </div>
          </div>
          <div className="rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white px-4 py-3">
            <h4 className="m-0 mb-1.5 text-[16px] font-bold text-[#0D2C23]">Rider lookup</h4>
            <div className="text-[13px] font-semibold text-[#5A6B63]">
              Type a name, horse or entry # above to see every ride time for them
              {filterDay == null ? ' across all days' : ''}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

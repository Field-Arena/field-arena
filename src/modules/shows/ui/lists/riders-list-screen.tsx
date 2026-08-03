'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import { formatMoney } from '@/shared/lib/format/currency';
import type { ShowRiders } from '../../data/setup-queries';

function dayDate(startDate: string | null, day: number): string {
  if (!startDate) return `Day ${String(day + 1)}`;
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Riders — everyone registered for a show, ported from showRidersList.
 *
 * A dense table rather than a card per rider: a hundred-rider show fits on a
 * screen or two instead of a long scroll of expandable boxes, and this is a
 * list people read at a busy check-in desk.
 */
export function RidersListScreen({
  data,
  canViewMoney,
}: {
  data: ShowRiders;
  canViewMoney: boolean;
}) {
  const [search, setSearch] = useState('');
  const [day, setDay] = useState<number | null>(null);

  const term = search.trim().toLowerCase();
  const onSite = day == null ? null : new Set(data.onSiteByDay[day] ?? []);

  const rows = data.riders.filter((r) => {
    if (onSite && !onSite.has(r.num)) return false;
    if (!term) return true;
    // Name, number and horse — how a front-desk volunteer is actually asked
    // for someone ("do you have a #42?", "the horse is called Comet").
    return (
      r.name.toLowerCase().includes(term) ||
      r.horse.toLowerCase().includes(term) ||
      r.num.includes(term)
    );
  });

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <ScreenTitle className="mb-1.5">Riders</ScreenTitle>
          <ScreenLede className="mb-0">Everyone registered for {data.showName}.</ScreenLede>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="inline-flex">
            <GhostButton>← Dashboard</GhostButton>
          </Link>
          <GhostButton
            onClick={() => {
              window.print();
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print roster
          </GhostButton>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="font-[family-name:var(--font-nr)] text-[19px] font-semibold text-forest">
          {data.showName}
        </h2>
        <span className="text-[12px] text-[#7A8781]">
          {rows.length} {rows.length === 1 ? 'rider' : 'riders'}
          {term && ` matching "${search.trim()}"`}
        </span>
      </div>

      <input
        type="text"
        placeholder="Search by name, number, or horse…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        className="mb-3 w-full max-w-[340px] rounded-[6px] border border-[#D9E1DD] px-3 py-2 text-[13.5px] outline-none focus-visible:border-gold print:hidden"
      />

      {/* Only once a schedule exists to compute "who's riding that day" from. */}
      {data.totalDays > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 print:hidden">
          <DayButton
            active={day == null}
            onClick={() => {
              setDay(null);
            }}
          >
            View All
          </DayButton>
          {Array.from({ length: data.totalDays }, (_, i) => i).map((i) => (
            <DayButton
              key={i}
              active={day === i}
              onClick={() => {
                setDay(i);
              }}
            >
              Day {i + 1} — {dayDate(data.startDate, i)}
            </DayButton>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-[13.5px] text-[#7A8781]">
          {term ? 'No riders match that search.' : 'No riders registered yet.'}
        </p>
      ) : (
        <Card className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full border-collapse text-[13px]">
              <caption className="sr-only">Riders registered for {data.showName}</caption>
              <thead>
                <tr className="border-b border-[#E9EDEB]">
                  <th scope="col" className="w-[60px] px-4 py-2.5 text-left">
                    #
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left">
                    Rider
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left">
                    Horse
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left">
                    Classes
                  </th>
                  {canViewMoney && (
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Total paid
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((rider) => (
                  <tr key={rider.num} className="border-b border-[#F1F4F3]">
                    <td className="px-4 py-2.5">{rider.num}</td>
                    <td className="px-4 py-2.5 font-semibold">{rider.name}</td>
                    <td className="px-4 py-2.5">{rider.horse}</td>
                    <td className="px-4 py-2.5 text-[12px] text-[#7A8781]">
                      {rider.classes.join(', ')}
                    </td>
                    {canViewMoney && (
                      <td className="px-4 py-2.5 text-right">{formatMoney(rider.total)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function DayButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[9px] border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
        active
          ? 'border-forest bg-forest text-white'
          : 'border-[#D9E1DD] bg-white text-forest hover:border-gold'
      )}
    >
      {children}
    </button>
  );
}

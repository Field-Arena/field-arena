'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/shared/ui/shadcn/table';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatDayDate } from '@/modules/shows/utils/format-day-date';
import type { ShowRiders } from '@/modules/shows/data/setup-queries';
import { DayButton } from '@/modules/shows/ui/lists/day-button';

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
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
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
        <h2 className="text-forest font-[family-name:var(--font-nr)] text-[19px] font-semibold">
          {data.showName}
        </h2>
        <span className="text-[12px] text-[#7A8781]">
          {rows.length} {rows.length === 1 ? 'rider' : 'riders'}
          {term && ` matching "${search.trim()}"`}
        </span>
      </div>

      <Input
        type="text"
        placeholder="Search by name, number, or horse…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        className="focus-visible:border-gold mb-3 h-auto w-full max-w-[340px] rounded-[6px] border border-[#D9E1DD] px-3 py-2 text-[13.5px] outline-none focus-visible:ring-0 print:hidden"
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
              Day {i + 1} — {formatDayDate(data.startDate, i)}
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
          <Table className="border-collapse text-[13px]">
            <TableCaption className="sr-only">Riders registered for {data.showName}</TableCaption>
            <TableHeader>
              <TableRow className="border-b border-[#E9EDEB] hover:bg-transparent">
                <TableHead scope="col" className="h-auto w-[60px] px-4 py-2.5 text-left">
                  #
                </TableHead>
                <TableHead scope="col" className="h-auto px-4 py-2.5 text-left">
                  Rider
                </TableHead>
                <TableHead scope="col" className="h-auto px-4 py-2.5 text-left">
                  Horse
                </TableHead>
                <TableHead scope="col" className="h-auto px-4 py-2.5 text-left">
                  Classes
                </TableHead>
                {canViewMoney && (
                  <TableHead scope="col" className="h-auto px-4 py-2.5 text-right">
                    Total paid
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:last-child]:border-b">
              {rows.map((rider) => (
                <TableRow
                  key={rider.num}
                  className="border-b border-[#F1F4F3] hover:bg-transparent"
                >
                  <TableCell className="px-4 py-2.5 whitespace-normal">{rider.num}</TableCell>
                  <TableCell className="px-4 py-2.5 font-semibold whitespace-normal">
                    {rider.name}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 whitespace-normal">{rider.horse}</TableCell>
                  <TableCell className="px-4 py-2.5 text-[12px] whitespace-normal text-[#7A8781]">
                    {rider.classes.join(', ')}
                  </TableCell>
                  {canViewMoney && (
                    <TableCell className="px-4 py-2.5 text-right whitespace-normal">
                      {formatMoney(rider.total)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

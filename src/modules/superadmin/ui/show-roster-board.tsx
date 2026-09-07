'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ExternalLinkIcon, SearchIcon } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/input';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { formatMoney } from '@/shared/lib/format/currency';
import type { ShowRosterRider } from '@/modules/superadmin/types';

const NR = 'font-[family-name:var(--font-nr)]';
const COLS = '70px minmax(160px,1fr) minmax(140px,1fr) minmax(200px,1.4fr) 110px';

export interface RosterData {
  showName: string;
  orgId: string;
  orgName: string;
  currency: string | null;
  locale: string | null;
  riders: ShowRosterRider[];
}

export function ShowRosterBoard({
  orgId,
  showId,
  roster,
}: {
  orgId: string;
  showId: string;
  roster: RosterData;
}) {
  const [search, setSearch] = useState('');
  const [openRider, setOpenRider] = useState<string | null>(null);

  const money = (value: number) => formatMoney(value, roster.currency, roster.locale);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roster.riders;
    return roster.riders.filter(
      (r) => r.name.toLowerCase().includes(term) || r.horse.toLowerCase().includes(term),
    );
  }, [roster.riders, search]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/superadmin/organizations/${orgId}`}
          className="text-fa-muted hover:text-gold mb-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {roster.orgName} — Shows
        </Link>

        <h1
          className={`${NR} text-hunter-deep mb-2 text-[32px] leading-[1.06] font-medium tracking-[-.022em]`}
        >
          Riders
        </h1>
        <p className="text-fa-muted max-w-[680px] text-[14.5px] leading-[1.6]">
          Everyone entered in <strong className="text-hunter-deep">{roster.showName}</strong>.
          Scratched entries are excluded. Open a rider to see their classes, fees and scores.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-hunter-deep text-[13px] font-bold">
          {roster.riders.length} {roster.riders.length === 1 ? 'rider' : 'riders'}
        </span>
        {/* Legacy's "Experience as this rider" opened the rider app scoped to
            this show. Riders are a separate auth realm, so this opens the real
            rider-facing page for this real show rather than inventing rider
            impersonation — the same screen a rider actually lands on. */}
        <Link
          href={`/show/${showId}`}
          target="_blank"
          rel="noreferrer"
          className="text-hunter-deep hover:border-gold inline-flex items-center gap-2 rounded-lg border border-[#C4D3CB] bg-white px-3 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
        >
          Experience as a rider
          <ExternalLinkIcon className="size-[13px]" aria-hidden />
        </Link>
        <div className="relative ml-auto max-w-[300px] min-w-[190px] flex-[1_1_220px]">
          <SearchIcon
            className="absolute top-1/2 left-[13px] size-[15px] -translate-y-1/2 text-[#9AA6A0]"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search rider or horse…"
            className="text-hunter-deep focus-visible:border-gold focus-visible:ring-gold/[.14] h-auto w-full rounded-[9px] border border-[#D7E0DA] bg-white py-2.5 pr-3.5 pl-9 text-[13.5px] focus-visible:ring-[3px] focus-visible:outline-none"
          />
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[820px] gap-3.5 border-b border-[#E2E8E4] bg-[#F6F3EC] px-5 py-[11px]"
            style={{ gridTemplateColumns: COLS }}
          >
            {['No.', 'Rider', 'Horse', 'Classes (Division)', 'Fees'].map((h, i) => (
              <span
                key={h}
                className={cn(
                  'text-fa-muted-2 text-[10px] font-bold tracking-[0.14em] uppercase',
                  i === 4 && 'text-right',
                )}
              >
                {h}
              </span>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="px-5 py-[52px] text-center">
              <div className={`${NR} text-hunter-deep mb-2 text-[23px]`}>
                {search.trim() ? 'No matches' : 'No entries yet'}
              </div>
              <p className="text-fa-muted-2 text-[13.5px]">
                {search.trim()
                  ? `Nobody matches “${search.trim()}”.`
                  : 'Nobody has entered this show yet.'}
              </p>
            </div>
          ) : (
            visible.map((rider) => {
              const expanded = openRider === rider.key;
              return (
                <div key={rider.key} className="border-b border-[#EEF2EF] last:border-b-0">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-expanded={expanded}
                    onClick={() => {
                      setOpenRider(expanded ? null : rider.key);
                    }}
                    className="grid h-auto w-full min-w-[820px] items-center gap-3.5 rounded-none px-5 py-[13px] text-left hover:bg-[#FAFCFB]"
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span className="text-fa-muted-2 text-[12.5px] font-bold">#{rider.num}</span>
                    <span className="text-hunter-deep truncate text-[13.5px] font-bold">
                      {rider.name}
                    </span>
                    <span className="text-fa-muted truncate text-[13px]">{rider.horse}</span>
                    <span className="text-fa-muted truncate text-[12.5px]">
                      {rider.entries
                        .map((e) => (e.division ? `${e.className} (${e.division})` : e.className))
                        .join(', ')}
                    </span>
                    <span className="text-hunter-deep text-right text-[13px] font-bold">
                      {money(rider.feeTotal)}
                    </span>
                  </Button>

                  {expanded && (
                    <div className="bg-[#FAFCFB] px-5 pt-1 pb-5">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-fa-muted-2 text-[10px] tracking-[0.14em] uppercase">
                            <th className="py-2 text-left font-bold">Class</th>
                            <th className="py-2 text-left font-bold">Division</th>
                            <th className="py-2 text-right font-bold">Fee</th>
                            <th className="py-2 text-right font-bold">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rider.entries.map((entry, i) => (
                            <tr
                              key={`${entry.className}-${String(i)}`}
                              className="border-t border-[#EEF2EF]"
                            >
                              <td className="text-hunter-deep py-2">{entry.className}</td>
                              <td className="text-fa-muted py-2">{entry.division || '—'}</td>
                              <td className="text-hunter-deep py-2 text-right">
                                {money(entry.fee)}
                              </td>
                              <td className="py-2 text-right">
                                {entry.percent == null ? (
                                  <span className="text-fa-muted-2">not ridden</span>
                                ) : (
                                  <span className="text-hunter-deep font-bold">
                                    {entry.percent.toFixed(3)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-fa-muted-2 mt-3 text-[12px] leading-[1.5]">
                        Entry fees only — add-on and stabling purchases aren&apos;t broken out per
                        rider here. Event Sales carries the full per-order totals.
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

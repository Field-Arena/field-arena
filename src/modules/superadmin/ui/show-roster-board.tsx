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
          prefetch={false}
          className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#475467] transition-colors hover:text-[#146A47]"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {roster.orgName} — Shows
        </Link>

        <h1 className="mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-tight font-semibold tracking-[-.5px] text-[#101828]">
          Riders
        </h1>
        <p className="max-w-[680px] text-[14.5px] leading-[1.6] text-[#475467]">
          Everyone entered in <strong className="text-[#101828]">{roster.showName}</strong>.
          Scratched entries are excluded. Open a rider to see their classes, fees and scores.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] font-bold text-[#101828]">
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
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[12.5px] font-bold text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-[#FBFCFD]"
        >
          Experience as a rider
          <ExternalLinkIcon className="size-[13px]" aria-hidden />
        </Link>
        <div className="relative ml-auto max-w-[300px] min-w-[190px] flex-[1_1_220px]">
          <SearchIcon
            className="absolute top-1/2 left-[13px] size-[15px] -translate-y-1/2 text-[#8A94A3]"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search rider or horse…"
            className="h-auto w-full rounded-[9px] border border-[#E7EAEE] bg-white py-2.5 pr-3.5 pl-9 text-[13.5px] text-[#101828] focus-visible:border-[#9FD3BA] focus-visible:ring-[3px] focus-visible:ring-[#EAF5EF] focus-visible:outline-none"
          />
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E7EAEE] bg-white">
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[820px] gap-3.5 border-b border-[#E7EAEE] bg-[#FBFCFD] px-5 py-[11px]"
            style={{ gridTemplateColumns: COLS }}
          >
            {['No.', 'Rider', 'Horse', 'Classes (Division)', 'Fees'].map((h, i) => (
              <span
                key={h}
                className={cn(
                  'text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase',
                  i === 4 && 'text-right',
                )}
              >
                {h}
              </span>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="px-5 py-[52px] text-center">
              <div className={`${NR} mb-2 text-[23px] text-[#101828]`}>
                {search.trim() ? 'No matches' : 'No entries yet'}
              </div>
              <p className="text-[13.5px] text-[#8A94A3]">
                {search.trim()
                  ? `Nobody matches “${search.trim()}”.`
                  : 'Nobody has entered this show yet.'}
              </p>
            </div>
          ) : (
            visible.map((rider) => {
              const expanded = openRider === rider.key;
              return (
                <div key={rider.key} className="border-b border-[#EEF1F4] last:border-b-0">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-expanded={expanded}
                    onClick={() => {
                      setOpenRider(expanded ? null : rider.key);
                    }}
                    className="grid h-auto w-full min-w-[820px] items-center gap-3.5 rounded-none px-5 py-[13px] text-left hover:bg-[#FBFCFD]"
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span className="text-[12.5px] font-bold text-[#8A94A3]">#{rider.num}</span>
                    <span className="truncate text-[13.5px] font-bold text-[#101828]">
                      {rider.name}
                    </span>
                    <span className="truncate text-[13px] text-[#475467]">{rider.horse}</span>
                    <span className="truncate text-[12.5px] text-[#475467]">
                      {rider.entries
                        .map((e) => (e.division ? `${e.className} (${e.division})` : e.className))
                        .join(', ')}
                    </span>
                    <span className="text-right text-[13px] font-bold text-[#101828]">
                      {money(rider.feeTotal)}
                    </span>
                  </Button>

                  {expanded && (
                    <div className="bg-[#FBFCFD] px-5 pt-1 pb-5">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-[10px] tracking-[.08em] text-[#8A94A3] uppercase">
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
                              className="border-t border-[#EEF1F4]"
                            >
                              <td className="py-2 text-[#101828]">{entry.className}</td>
                              <td className="py-2 text-[#475467]">{entry.division || '—'}</td>
                              <td className="py-2 text-right text-[#101828]">{money(entry.fee)}</td>
                              <td className="py-2 text-right">
                                {entry.percent == null ? (
                                  <span className="text-[#8A94A3]">not ridden</span>
                                ) : (
                                  <span className="font-bold text-[#101828]">
                                    {entry.percent.toFixed(3)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-3 text-[12px] leading-[1.5] text-[#8A94A3]">
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

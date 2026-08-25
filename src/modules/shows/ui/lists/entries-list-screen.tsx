'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { formatMoney } from '@/shared/lib/format/currency';
import { groupEntriesByClass } from '@/modules/shows/utils/group-entries-by-class';
import type { ShowEntries } from '@/modules/shows/data/setup-queries';

export function EntriesListScreen({
  data,
  canViewMoney,
}: {
  data: ShowEntries;
  canViewMoney: boolean;
}) {
  const [classFilter, setClassFilter] = useState('');

  const shown = classFilter ? data.entries.filter((e) => e.cls === classFilter) : data.entries;
  const groups = groupEntriesByClass(shown);

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <ScreenTitle className="mb-1.5">Entries</ScreenTitle>
          <ScreenLede className="mb-0">
            Every class entry sold for {data.showName}, grouped by class.
          </ScreenLede>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="inline-flex">
            <GhostButton>← Dashboard</GhostButton>
          </Link>
          {data.entries.length > 0 && (
            <GhostButton
              onClick={() => {
                window.print();
              }}
            >
              <PrinterIcon className="size-4" aria-hidden />
              Print class list
            </GhostButton>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="text-forest font-[family-name:var(--font-nr)] text-[19px] font-semibold">
          {data.showName}
        </h2>
        <span className="text-[12px] text-[#7A8781]">
          {data.entries.length} entries · {data.classes.length}{' '}
          {data.classes.length === 1 ? 'class' : 'classes'}
        </span>
      </div>

      {data.classes.length > 1 && (
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
          }}
          aria-label="Filter by class"
          className="mb-3.5 w-full max-w-[340px] rounded-[6px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] print:hidden"
        >
          <option value="">All classes</option>
          {data.classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      )}

      {shown.length === 0 ? (
        <p className="text-[13.5px] text-[#7A8781]">No entries sold yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const subtotal = group.rows.reduce((sum, r) => sum + r.fee, 0);

            return (
              <Card key={group.cls} className="p-5">
                <div className="text-forest mb-2.5 border-b border-[#E9EDEB] pb-2 text-[13.5px] font-bold">
                  {group.cls} — {group.rows.length} {group.rows.length === 1 ? 'entry' : 'entries'}
                  {canViewMoney && ` · ${formatMoney(subtotal)}`}
                </div>

                <div className="flex flex-col">
                  {group.rows.map((entry) => (
                    <div
                      key={`${entry.num}-${entry.cls}`}
                      className="flex flex-wrap items-center gap-2 border-b border-[#F1F4F3] py-1.5 text-[12.5px] last:border-b-0"
                    >
                      <span className="w-[54px] flex-none font-semibold">#{entry.num}</span>
                      <span className="min-w-0 flex-1">{entry.rider}</span>
                      <span className="text-[#7A8781]">{entry.horse}</span>
                      {canViewMoney && (
                        <span className="w-[70px] text-right font-semibold">
                          {formatMoney(entry.fee)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

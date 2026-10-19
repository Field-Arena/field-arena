'use client';

import { useMemo, useState } from 'react';
import {
  CardTitle,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  FaCard,
} from '@/shared/ui/organizer/fa-page';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import type { ArrivalDepartureRow } from '@/modules/shows/types';

type SortKey = 'rider' | 'arrival' | 'departure';

function sortValue(row: ArrivalDepartureRow, key: SortKey): string {
  if (key === 'rider') return row.riderName.toLowerCase();
  if (key === 'arrival') return row.arrivalDate ?? '9999-99-99';
  return row.departureDate ?? '9999-99-99';
}

export function ArrivalsDeparturesPanel({
  rows,
  showEndDate,
}: {
  rows: ArrivalDepartureRow[];
  showEndDate: string | null;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('arrival');

  const sorted = useMemo(
    () => [...rows].sort((a, b) => sortValue(a, sortKey).localeCompare(sortValue(b, sortKey))),
    [rows, sortKey],
  );

  const isLate = (row: ArrivalDepartureRow) =>
    !!showEndDate && !!row.departureDate && row.departureDate > showEndDate;
  const lateCount = rows.filter(isLate).length;

  const headers: { key: SortKey; label: string }[] = [
    { key: 'rider', label: 'Rider / Trainer' },
    { key: 'arrival', label: 'Arrival' },
    { key: 'departure', label: 'Departure' },
  ];

  return (
    <FaCard>
      <CardTitle className="text-[17px]">Arrivals &amp; departures</CardTitle>
      <p className={cn(FA_MUTED, 'mb-3')}>
        What riders reported at checkout — sort to spot late arrivals or early departures.
        {lateCount > 0 &&
          ` ${String(lateCount)} ${lateCount === 1 ? 'departure is' : 'departures are'} after the show ends.`}
      </p>

      {rows.length === 0 ? (
        <p className="text-[13px] font-semibold text-[#5A6B63]">
          No stabling requests with logistics reported yet.
        </p>
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <thead>
              <tr className={FA_THEAD_ROW}>
                {headers.map((h) => (
                  <th key={h.key} className={FA_TH}>
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey(h.key);
                      }}
                      className={
                        sortKey === h.key
                          ? 'cursor-pointer text-[#1A5B3C]'
                          : 'cursor-pointer transition-colors hover:text-[#1A5B3C]'
                      }
                    >
                      {h.label} {sortKey === h.key ? '↓' : ''}
                    </button>
                  </th>
                ))}
                <th className={cn(FA_TH, 'text-right')}>Horse stalls</th>
                <th className={cn(FA_TH, 'text-right')}>Tack stalls</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.riderId} className={FA_TR}>
                  <td className={cn(FA_TD, 'font-bold')}>
                    {row.riderName}
                    <span className="ml-1.5 font-semibold text-[#5A6B63]">· {row.trainerName}</span>
                  </td>
                  <td className={cn(FA_TD, 'whitespace-nowrap')}>
                    {row.arrivalDate ? (
                      formatDateShort(row.arrivalDate)
                    ) : (
                      <span className="text-[#B4432F]">Not set</span>
                    )}
                  </td>
                  <td className={cn(FA_TD, 'whitespace-nowrap')}>
                    {row.departureDate ? (
                      isLate(row) ? (
                        <span className="font-semibold text-[#B4432F]" title="After the show ends">
                          ⚠ {formatDateShort(row.departureDate)}
                        </span>
                      ) : (
                        formatDateShort(row.departureDate)
                      )
                    ) : (
                      <span className="text-[#B4432F]">Not set</span>
                    )}
                  </td>
                  <td className={cn(FA_TD, 'text-right text-[#5A6B63]')}>{row.horseStalls}</td>
                  <td className={cn(FA_TD, 'text-right text-[#5A6B63]')}>{row.tackStalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FaCard>
  );
}

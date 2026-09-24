'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { formatDateShort } from '@/shared/lib/format/date';
import type { ArrivalDepartureRow } from '@/modules/shows/data/arrivals-departures-queries';

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
    <Card className="p-[16px_18px]">
      <h3 className="text-ink-deep mb-1 font-[Newsreader,serif] text-[17px] font-semibold">
        Arrivals &amp; Departures
      </h3>
      <p className="mb-3 text-[12.5px] text-[#7A8781]">
        What riders reported at checkout — sort to spot late arrivals or early departures.
        {lateCount > 0 &&
          ` ${String(lateCount)} ${lateCount === 1 ? 'departure is' : 'departures are'} after the show ends.`}
      </p>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[#98A29D] italic">
          No stabling requests with logistics reported yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[#E9EDEB] text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
                {headers.map((h) => (
                  <th key={h.key} className="p-2 font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey(h.key);
                      }}
                      className={
                        sortKey === h.key ? 'text-forest' : 'hover:text-forest transition-colors'
                      }
                    >
                      {h.label} {sortKey === h.key ? '↓' : ''}
                    </button>
                  </th>
                ))}
                <th className="p-2 text-right font-semibold">Horse stalls</th>
                <th className="p-2 text-right font-semibold">Tack stalls</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.riderId} className="border-b border-[#F0F2F1]">
                  <td className="text-ink-deep p-2">
                    {row.riderName}
                    <span className="ml-1.5 text-[#98A29D]">· {row.trainerName}</span>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {row.arrivalDate ? (
                      formatDateShort(row.arrivalDate)
                    ) : (
                      <span className="text-[#B4432F]">Not set</span>
                    )}
                  </td>
                  <td className="p-2 whitespace-nowrap">
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
                  <td className="p-2 text-right text-[#5A6B63]">{row.horseStalls}</td>
                  <td className="p-2 text-right text-[#5A6B63]">{row.tackStalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

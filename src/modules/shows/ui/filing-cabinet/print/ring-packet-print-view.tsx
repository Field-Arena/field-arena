'use client';

import type { RingPacketClass } from '@/modules/shows/data/ring-packet-queries';

export function RingPacketPrintView({
  showName,
  classes,
}: {
  showName: string;
  classes: RingPacketClass[];
}) {
  if (classes.length === 0) return null;

  return (
    <div className="hidden p-10 print:block">
      {classes.map((cls, i) => (
        <div
          key={cls.classId}
          className="pb-6"
          style={{ pageBreakAfter: i < classes.length - 1 ? 'always' : 'auto' }}
        >
          <h1 className="text-[24px] font-bold">
            {showName} — {cls.classLabel}
          </h1>
          <p className="mb-1 text-[15px] font-semibold">
            {cls.testName ?? 'No test assigned'}
            {cls.testEdition ? ` (${cls.testEdition})` : ''}
          </p>
          <p className="mb-4 text-sm text-[#555]">
            {[cls.date, cls.location].filter(Boolean).join(' · ') || 'Not scheduled'} ·{' '}
            {cls.rides.length} ride{cls.rides.length === 1 ? '' : 's'}
          </p>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b-2 border-[#333] text-left">
                <th className="py-1 pr-2">Order</th>
                <th className="py-1 pr-2">Number</th>
                <th className="py-1 pr-2">Rider</th>
                <th className="py-1 pr-2">Horse</th>
              </tr>
            </thead>
            <tbody>
              {cls.rides.map((ride) => (
                <tr
                  key={ride.entryId}
                  className="border-b border-[#DDD]"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <td className="py-1 pr-2">{ride.rideOrder ?? '—'}</td>
                  <td className="py-1 pr-2">{ride.num}</td>
                  <td className="py-1 pr-2">{ride.riderName}</td>
                  <td className="py-1 pr-2">{ride.horse ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useClock } from '@/modules/superadmin/hooks/use-clock';

export function RingStatusBar({ rings }: { rings: { label: string; offset: string }[] }) {
  const time = useClock();
  return (
    <div className="mb-4 flex overflow-hidden rounded-lg border border-line font-mono text-xs font-bold">
      <div className="flex items-center bg-forest px-3 py-2 text-paper">{time}</div>
      {rings.map((ring) => (
        <div key={ring.label} className="flex-1 bg-mint px-3 py-2 text-center text-forest">
          {ring.label} {ring.offset}
        </div>
      ))}
    </div>
  );
}

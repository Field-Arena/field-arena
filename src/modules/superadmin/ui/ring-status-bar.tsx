'use client';

import { useClock } from '@/modules/superadmin/hooks/use-clock';

export function RingStatusBar({ rings }: { rings: { label: string; offset: string }[] }) {
  const time = useClock();
  return (
    <div className="border-line mb-4 flex overflow-hidden rounded-lg border font-mono text-xs font-bold">
      <div className="bg-forest text-paper flex items-center px-3 py-2">{time}</div>
      {rings.map((ring) => (
        <div key={ring.label} className="bg-mint text-forest flex-1 px-3 py-2 text-center">
          {ring.label} {ring.offset}
        </div>
      ))}
    </div>
  );
}

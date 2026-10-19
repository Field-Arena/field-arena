'use client';

import { useClock } from '@/modules/superadmin/hooks/use-clock';

export function RingStatusBar({ rings }: { rings: { label: string; offset: string }[] }) {
  const time = useClock();
  return (
    <div className="mb-4 flex overflow-hidden rounded-lg border border-[#E7EAEE] font-mono text-xs font-bold">
      <div className="flex items-center bg-[#146A47] px-3 py-2 text-white">{time ?? '\u00A0'}</div>
      {rings.map((ring) => (
        <div key={ring.label} className="flex-1 bg-[#EAF5EF] px-3 py-2 text-center text-[#101828]">
          {ring.label} {ring.offset}
        </div>
      ))}
    </div>
  );
}

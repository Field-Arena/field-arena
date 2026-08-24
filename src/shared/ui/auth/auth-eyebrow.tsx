'use client';

import type { ReactNode } from 'react';

export function AuthEyebrow({ children, centred }: { children: ReactNode; centred?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="bg-gold h-[3px] w-[26px]" />
      <span className="text-forest text-[10.5px] font-bold tracking-[.18em] uppercase">
        {children}
      </span>
      {centred && <span aria-hidden className="bg-gold h-[3px] w-[26px]" />}
    </div>
  );
}

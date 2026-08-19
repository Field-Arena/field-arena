import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-gold mb-[18px] text-[10.5px] font-bold tracking-[.18em] uppercase">
      {children}
    </div>
  );
}

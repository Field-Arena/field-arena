'use client';

import type { ReactNode } from 'react';

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3.5">
      <span aria-hidden className="bg-line h-px flex-1" />
      <span className="text-fa-muted-2 text-[13px] whitespace-nowrap">{children}</span>
      <span aria-hidden className="bg-line h-px flex-1" />
    </div>
  );
}

import type { ReactElement, ReactNode } from 'react';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';

export function DemoLink({ children }: { children: ReactNode }): ReactElement {
  return (
    <DemoTrigger className="bg-gold text-forest hover:bg-gold-light hover:text-forest inline-flex items-center gap-2.5 rounded-[10px] px-6 py-3.5 text-[14.5px] font-bold no-underline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(201,162,39,.28)]">
      {children}
    </DemoTrigger>
  );
}

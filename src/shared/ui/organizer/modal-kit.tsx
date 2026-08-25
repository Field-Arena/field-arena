import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export const modalContentClass =
  'gap-0 rounded-2xl border border-[#E9EDEB] bg-[#F5F7F6] p-0 shadow-[0_40px_90px_rgba(9,26,21,.42)] sm:max-w-[480px]';

export const modalBodyClass = 'flex flex-col gap-4 p-5';

export const modalFooterClass =
  'mx-0 mb-0 flex-row justify-end gap-2.5 rounded-b-2xl border-t border-[#E9EDEB] bg-[#EAF4EE] p-5';

export function ModalEyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mb-1 flex items-center gap-2', className)}>
      <span className="h-[3px] w-6 rounded-full bg-[#C9A227]" aria-hidden />
      <span className="text-[10.5px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
        {children}
      </span>
    </div>
  );
}

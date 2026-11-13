'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

export function DayButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto rounded-[9px] border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
        active
          ? 'border-[#146A47] bg-[#146A47] text-white'
          : 'border-[#E7EAEE] bg-white text-[#101828] hover:border-[#D6DBE1]',
        'hover:bg-transparent',
      )}
    >
      {children}
    </Button>
  );
}

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
        'h-auto rounded-[9px] border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-transparent',
        active
          ? 'border-forest bg-forest text-white'
          : 'text-forest hover:border-gold border-[#D9E1DD] bg-white',
      )}
    >
      {children}
    </Button>
  );
}

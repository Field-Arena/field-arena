'use client';

import { Trash2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';

export function RowRemove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      onClick={onClick}
      className="h-auto grid size-[30px] flex-none place-items-center rounded-[7px] border border-transparent p-0 text-[#B4432F] hover:bg-[#FCF1EF] transition-colors hover:border-[#F0D3CE]"
    >
      <Trash2Icon className="size-[14px]" aria-hidden />
    </Button>
  );
}

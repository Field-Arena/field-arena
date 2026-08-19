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
      className="grid size-[30px] h-auto flex-none place-items-center rounded-[7px] border border-transparent p-0 text-[#B4432F] transition-colors hover:border-[#F0D3CE] hover:bg-[#FCF1EF]"
    >
      <Trash2Icon className="size-[14px]" aria-hidden />
    </Button>
  );
}

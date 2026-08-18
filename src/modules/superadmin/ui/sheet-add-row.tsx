'use client';

import { Button } from '@/shared/ui/shadcn/button';

export function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto rounded-lg border border-[#C4D3CB] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-hunter-deep hover:bg-transparent transition-colors hover:border-gold"
    >
      {label}
    </Button>
  );
}

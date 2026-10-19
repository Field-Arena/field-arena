'use client';

import { Button } from '@/shared/ui/shadcn/button';

export function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto rounded-lg border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-transparent"
    >
      {label}
    </Button>
  );
}

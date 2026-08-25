'use client';

import { Button } from '@/shared/ui/shadcn/button';

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="text-fa-muted hover:text-gold h-auto justify-start bg-transparent px-2 py-1 text-[13.5px] font-semibold transition-colors hover:bg-transparent"
    >
      Back
    </Button>
  );
}

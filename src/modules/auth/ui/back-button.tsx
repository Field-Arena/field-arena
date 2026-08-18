'use client';

import { Button } from '@/shared/ui/shadcn/button';

/** Returns to the previous auth panel. */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto justify-start bg-transparent px-2 py-1 text-[13.5px] font-semibold text-fa-muted transition-colors hover:bg-transparent hover:text-gold"
    >
      Back
    </Button>
  );
}

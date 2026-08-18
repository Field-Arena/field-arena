'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { cn } from '@/shared/lib/utils';
import { useScratchEntry } from '@/modules/shows/hooks/use-schedule-mutations';

export function ScratchButton({ showId, entryId, num }: { showId: string; entryId: string; num: string }) {
  const [open, setOpen] = useState(false);
  const scratch = useScratchEntry();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={scratch.isPending}
        onClick={() => {
          setOpen(true);
        }}
        className={cn(
          'h-auto rounded-[6px] border border-[#E4B5AC] bg-[#FDF0EE] px-2 py-0.5 text-[11px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F]',
          'hover:bg-transparent'
        )}
      >
        Scratch
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Scratch #${num}?`}
        description="They'll stay on the schedule, marked as scratched, so the printed sheet still accounts for them."
        confirmLabel={scratch.isPending ? 'Scratching…' : 'Scratch rider'}
        destructive
        pending={scratch.isPending}
        onConfirm={() => {
          scratch.mutate({ showId, entryId }, { onSuccess: () => { setOpen(false); } });
        }}
      />
    </>
  );
}

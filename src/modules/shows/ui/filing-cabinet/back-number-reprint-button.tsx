'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, PrinterIcon } from 'lucide-react';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { downloadBackNumberCards } from '@/modules/shows/utils/download-back-number-cards';

export function BackNumberReprintButton({ showId, showEntryId }: { showId: string; showEntryId: string }) {
  const [pending, setPending] = useState(false);

  async function reprint() {
    setPending(true);
    try {
      await downloadBackNumberCards(showId, [showEntryId]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reprint that card.');
    } finally {
      setPending(false);
    }
  }

  return (
    <GhostButton
      type="button"
      className="h-7 px-2 py-0"
      disabled={pending}
      title="Reprint this rider's back number card"
      onClick={(e) => {
        e.stopPropagation();
        void reprint();
      }}
    >
      {pending ? (
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <PrinterIcon className="size-3.5" aria-hidden />
      )}
    </GhostButton>
  );
}

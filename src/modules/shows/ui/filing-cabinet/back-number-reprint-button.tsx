'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, PrinterIcon } from 'lucide-react';
import { FA_BTN_SMALL } from '@/shared/ui/organizer/fa-page';
import { downloadBackNumberCards } from '@/modules/shows/utils/download-back-number-cards';

export function BackNumberReprintButton({
  showId,
  showEntryId,
}: {
  showId: string;
  showEntryId: string;
}) {
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
    <button
      type="button"
      className={`${FA_BTN_SMALL} px-2`}
      disabled={pending}
      title="Reprint this rider's back number card"
      aria-label="Reprint back number card"
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
    </button>
  );
}

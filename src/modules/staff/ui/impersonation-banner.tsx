'use client';

import { useTransition } from 'react';
import { EyeIcon, XIcon } from 'lucide-react';
import { exitOrganizerView } from '@/modules/superadmin/data/impersonation';

export function ImpersonationBanner() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-gold text-hunter-deep flex flex-wrap items-center gap-3 px-6 py-2">
      <EyeIcon className="size-4 flex-none" aria-hidden />
      <p className="text-[13px] font-bold">
        Viewing as an organizer. Changes you make here affect their live data.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await exitOrganizerView();
          });
        }}
        className="border-hunter-deep/30 ml-auto inline-flex items-center gap-1.5 rounded-lg border bg-white/70 px-2.5 py-1 text-xs font-bold transition hover:bg-white disabled:opacity-50"
      >
        <XIcon className="size-3.5" aria-hidden />
        {isPending ? 'Exiting…' : 'Exit organizer view'}
      </button>
    </div>
  );
}

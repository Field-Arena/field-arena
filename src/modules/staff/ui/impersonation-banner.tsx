'use client';

import { useTransition } from 'react';
import { EyeIcon, XIcon } from 'lucide-react';
import { exitOrganizerView } from '@/shared/lib/impersonation';

/**
 * Shown across the top of the organizer workspace while a SuperAdmin is viewing
 * as an organizer.
 *
 * Deliberately loud. Acting on a customer's live data while believing it is your
 * own is how a support session becomes an incident, and the exit is always one
 * click away rather than buried in a menu.
 *
 * useTransition rather than a mutation hook: the Server Action ends in a
 * redirect, so there is no success state to toast and no result to cache — the
 * only UI need is a pending flag while the navigation happens.
 */
export function ImpersonationBanner() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 bg-gold px-6 py-2 text-hunter-deep">
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
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-hunter-deep/30 bg-white/70 px-2.5 py-1 text-xs font-bold transition hover:bg-white disabled:opacity-50"
      >
        <XIcon className="size-3.5" aria-hidden />
        {isPending ? 'Exiting…' : 'Exit organizer view'}
      </button>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { ShowListItem } from '@/modules/shows/data/queries';

/**
 * Show Manager's own show switcher — distinct from the Dashboard's GET-form
 * version because Show Manager carries the show id in the route path
 * (/dashboard/shows/[showId]/tab), not a `?show=` query param, so switching
 * shows means navigating to a different URL rather than resubmitting a form.
 * `tabPath` is the current tab's own path suffix (e.g. '' for Setup,
 * '/schedule' for Schedule / Review) so switching shows keeps the same tab.
 */
export function ShowSwitcher({
  shows,
  currentShowId,
  tabPath,
}: {
  shows: ShowListItem[];
  currentShowId: string;
  tabPath: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  return (
    <div className="contents">
      <select
        value={pending ?? currentShowId}
        onChange={(e) => {
          setPending(e.target.value);
        }}
        className="text-ink-deep min-w-[320px] flex-[0_1_380px] rounded-[10px] border border-[#D9E1DD] px-3 py-2.5 text-sm"
        aria-label="Select show"
      >
        {shows.map((show) => (
          <option key={show.id} value={show.id}>
            {show.name}
            {show.dateLabel ? ` (${show.dateLabel})` : ''}
          </option>
        ))}
      </select>
      <GhostButton
        type="button"
        disabled={!pending || pending === currentShowId}
        onClick={() => {
          if (pending) router.push(`/dashboard/shows/${pending}${tabPath}`);
        }}
      >
        Switch
      </GhostButton>
    </div>
  );
}

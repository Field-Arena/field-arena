'use client';

import { useRouter } from 'next/navigation';
import type { ShowListItem } from '@/modules/shows/data/queries';

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
  const current = shows.find((s) => s.id === currentShowId || s.slug === currentShowId);

  // Picking a show opens it straight away -- no separate Switch button.
  return (
    <select
      value={current ? (current.slug ?? current.id) : currentShowId}
      onChange={(e) => {
        router.push(`/dashboard/shows/${e.target.value}${tabPath}`);
      }}
      className="text-ink-deep max-w-full min-w-0 flex-[0_1_380px] rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-2 text-[14px] font-semibold"
      aria-label="Go to another show"
    >
      {shows.map((show) => (
        <option key={show.id} value={show.slug ?? show.id}>
          {show.name}
          {show.dateLabel ? ` (${show.dateLabel})` : ''}
        </option>
      ))}
    </select>
  );
}

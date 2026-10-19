'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FA_SELECT } from '@/shared/ui/organizer/fa-page';

/* Show picker for workspace pages: choosing a show opens it straight away
 * (sets ?show= on the current page) -- no separate Switch button. */
export function FaShowSelect({
  shows,
  currentRef,
  label = 'Go to another show',
}: {
  shows: { id: string; slug: string | null; name: string }[];
  /** The open show's slug or id. */
  currentRef: string;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (shows.length < 2) return null;
  const current = shows.find((s) => s.id === currentRef || s.slug === currentRef);

  return (
    <select
      aria-label={label}
      className={FA_SELECT}
      value={current ? (current.slug ?? current.id) : currentRef}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('show', e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      {shows.map((s) => (
        <option key={s.id} value={s.slug ?? s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

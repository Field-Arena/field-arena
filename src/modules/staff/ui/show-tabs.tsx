'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { todayIsoInZone } from '@/modules/staff/utils';
import { pickCurrentShows, pickFinishedShows } from '@/modules/shows/utils/current-shows';
import type { DashboardShowRow } from '@/modules/shows/types';

const SHOW_PATH = /^\/dashboard\/shows\/(?!new\b|incomplete\b)([^/]+)/;

const tabClass = (active: boolean) =>
  cn(
    'relative flex-none cursor-pointer border-0 bg-transparent px-3.5 py-2.5 text-[13.5px] whitespace-nowrap no-underline',
    active
      ? "font-semibold text-[var(--fa-brand)] after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-sm after:bg-[var(--fa-brand)] after:content-['']"
      : 'font-medium text-[var(--fa-ink-2)] hover:text-[var(--fa-ink)]',
  );

/** Always-visible show switcher: Home, the current shows, Completed.
 * From Home or Completed a show tab goes into that show's dashboard; from
 * any other page it keeps you on the same page for the other show. */
export function ShowTabs({
  shows,
  focusedShowId,
  onPickShow,
}: {
  shows: DashboardShowRow[];
  /** Defaults to the show named in the URL (path or ?show=). */
  focusedShowId?: string | null;
  onPickShow?: (ref: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const today = todayIsoInZone();
  const urlRef = SHOW_PATH.exec(pathname)?.[1] ?? searchParams.get('show');
  const focusedId =
    focusedShowId ?? shows.find((s) => s.id === urlRef || s.slug === urlRef)?.id ?? null;

  const isHome = pathname === '/dashboard' && !searchParams.get('show');
  const isCompleted = pathname.startsWith('/dashboard/completed');
  const inShow = !isHome && !isCompleted;

  const tabs = pickCurrentShows(shows, today);
  // Whatever show you're in always has a tab, so you can see where you are
  // even when it's an older show reached from Completed or All shows.
  const focused = shows.find((s) => s.id === focusedId);
  if (inShow && focused && !tabs.some((s) => s.id === focused.id)) tabs.push(focused);

  const finishedCount = pickFinishedShows(shows, today).length;

  function openShow(ref: string) {
    if (inShow && onPickShow) {
      onPickShow(ref);
      return;
    }
    if (inShow) {
      // Stay on the same page, switched to the other show.
      const params = new URLSearchParams(searchParams.toString());
      params.set('show', ref);
      router.push(`${pathname}?${params.toString()}`);
      return;
    }
    router.push(`/dashboard?show=${encodeURIComponent(ref)}`);
  }

  return (
    <nav
      aria-label="Shows"
      className="flex [scrollbar-width:none] flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-[var(--fa-line)] bg-[var(--fa-surface)] px-4 [&::-webkit-scrollbar]:hidden"
    >
      <Link
        href="/dashboard"
        prefetch={false}
        aria-current={isHome ? 'page' : undefined}
        className={tabClass(isHome)}
      >
        Home
      </Link>
      {tabs.map((show) => {
        const active = inShow && show.id === focusedId;
        return (
          <button
            key={show.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            className={tabClass(active)}
            onClick={() => {
              openShow(show.slug ?? show.id);
            }}
          >
            {show.name}
          </button>
        );
      })}
      <Link
        href="/dashboard/completed"
        prefetch={false}
        aria-current={isCompleted ? 'page' : undefined}
        className={tabClass(isCompleted)}
      >
        Completed ({finishedCount})
      </Link>
      <Link href="/dashboard/shows" prefetch={false} className={tabClass(false)}>
        All shows
      </Link>
    </nav>
  );
}

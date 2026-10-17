'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { todayIsoInZone } from '@/modules/staff/utils';
import { pickCurrentShows, pickFinishedShows } from '@/modules/shows/utils/current-shows';
import { getUrgentTodoCounts } from '@/modules/staff/data/tab-counts';
import type { DashboardShowRow } from '@/modules/shows/types';

const SHOW_PATH = /^\/dashboard\/shows\/(?!new\b|incomplete\b)([^/]+)/;

/* Browser-style tabs: the active one is the page's own colour and sits on
 * top of the strip's bottom border, so it reads as joined to the page. */
const tabClass = (active: boolean) =>
  cn(
    'relative -mb-px inline-flex h-12 flex-none cursor-pointer items-center gap-2 rounded-t-xl border border-b-0 px-5 text-[15.5px] whitespace-nowrap no-underline transition-colors',
    active
      ? 'z-10 border-[#C9D3CE] bg-[#F5F7F6] font-extrabold text-[#0D2C23] shadow-[inset_0_3px_0_0_#1A5B3C]'
      : 'border-transparent bg-transparent font-semibold text-[#3F4F48] hover:bg-white/70 hover:text-[#0D2C23]',
  );

const HomeIcon = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"
    />
  </svg>
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

  const current = pickCurrentShows(shows, today);
  const tabs = [...current];
  // Whatever show you're in always has a tab, so you can see where you are
  // even when it's an older show reached from Completed or All shows.
  const focused = shows.find((s) => s.id === focusedId);
  if (inShow && focused && !tabs.some((s) => s.id === focused.id)) tabs.push(focused);

  const finishedCount = pickFinishedShows(shows, today).length;

  // Red badges load once after the tabs appear; the shell persists across
  // navigation, so this doesn't re-run on every page change.
  const [urgent, setUrgent] = useState<Record<string, number>>({});
  const countKey = current.map((s) => s.id).join(',');
  useEffect(() => {
    if (!countKey) return;
    let cancelled = false;
    getUrgentTodoCounts(current.map(({ id, slug, startDate }) => ({ id, slug, startDate })))
      .then((counts) => {
        if (!cancelled) setUrgent(counts);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the show ids
  }, [countKey]);

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
      className="flex [scrollbar-width:none] flex-nowrap items-end gap-1 overflow-x-auto border-b border-[#C9D3CE] bg-[#E4EAE7] px-6 pt-3 [&::-webkit-scrollbar]:hidden"
    >
      <Link
        href="/dashboard"
        prefetch={false}
        aria-label="Home"
        aria-current={isHome ? 'page' : undefined}
        className={tabClass(isHome)}
      >
        <HomeIcon />
        Home
      </Link>
      {tabs.map((show) => {
        const active = inShow && show.id === focusedId;
        const count = urgent[show.id] ?? 0;
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
            {count > 0 && (
              <span
                className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#B4432F] px-1.5 text-[12.5px] font-extrabold text-white"
                title={`${String(count)} urgent`}
              >
                {count}
              </span>
            )}
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
        + All shows
      </Link>
    </nav>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/organizer/card';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import type { ShowPickerSummary } from '@/modules/shows/data/queries';

const VISIBLE_COUNT = 3;

export function UpcomingShowsCard({
  shows,
  currentShowId,
  todayIso,
}: {
  shows: ShowPickerSummary[];
  currentShowId: string | null;
  todayIso: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (shows.length === 0) return null;

  const visible = expanded ? shows : shows.slice(0, VISIBLE_COUNT);

  return (
    <Card className="mb-3.5 p-[16px_20px_18px]">
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <h2 className="text-forest font-[family-name:var(--font-nr)] text-[17px] font-semibold">
          Upcoming shows
        </h2>
        {shows.length > VISIBLE_COUNT && (
          <button
            type="button"
            className={cn(ghostButtonClass, 'px-2.5 py-[3px] text-[11.5px]')}
            onClick={() => {
              setExpanded((v) => !v);
            }}
          >
            {expanded ? 'Show less' : `See more (${String(shows.length - VISIBLE_COUNT)})`}
          </button>
        )}
      </div>

      <ul>
        {visible.map((show) => {
          const ref = show.slug ?? show.id;
          const isLive = (show.startDate ?? '') <= todayIso;
          const isCurrent = show.id === currentShowId;
          return (
            <li
              key={show.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F0] py-[9px] last:border-b-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard?show=${ref}`}
                  prefetch={false}
                  className="text-forest text-[13.5px] font-semibold hover:underline"
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {show.name}
                </Link>
                {isLive && (
                  <span className="ml-2 rounded-full bg-[#E3F1EA] px-2 py-[1px] text-[11px] font-semibold text-[#1F6B47]">
                    Live
                  </span>
                )}
                {isCurrent && <span className="ml-2 text-[11.5px] text-[#6E7C76]">· viewing</span>}
                <p className="mt-0.5 text-[12.5px] text-[#6E7C76]">
                  {show.dateLabel ??
                    (show.startDate ? formatDateShort(show.startDate) : 'Dates TBD')}
                  {show.venueName ? ` · ${show.venueName}` : ''}
                </p>
              </div>

              <Link
                href={`/dashboard/shows/${ref}`}
                prefetch={false}
                className={cn(ghostButtonClass, 'flex-none px-3 py-1.5 text-[12.5px]')}
              >
                Show Manager →
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

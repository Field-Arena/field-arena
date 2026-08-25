import type { ReactNode } from 'react';
import { Card, Eyebrow } from './card';
import { ShowStatsRow } from './show-stats-row';
import { LiveClock } from './live-clock';
import { fa } from '@/shared/lib/organizer-theme';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import type { ShowListItem, ShowStats } from '@/modules/shows/data/queries';

export function WorkspaceHeader({
  orgName,
  shows,
  currentShow,
  stage,
  stats,
  canViewMoney,
  rings,
  newShowSlot,
  trailingSlot,
}: {
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  stage: string;
  stats: ShowStats;
  canViewMoney: boolean;
  rings: string[];
  newShowSlot?: ReactNode;
  trailingSlot?: ReactNode;
}) {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="mb-[18px]">
      <Eyebrow className="mb-2.5 block">Show lifecycle</Eyebrow>
      <Card className="mb-[18px] flex flex-wrap items-center gap-2.5 p-[14px_18px]">
        {SHOW_STAGES.map((s, i) => (
          <span key={s.key} className="contents">
            <span
              className={`inline-flex items-center gap-2 text-[13px] whitespace-nowrap ${
                i === currentIndex ? 'text-forest font-semibold' : 'text-[#5A6B63]'
              }`}
            >
              <span
                className={`size-2 rounded-full border ${
                  i <= currentIndex
                    ? 'border-[#3E8E5A] bg-[#3E8E5A]'
                    : 'border-[#D9E1DD] bg-transparent'
                }`}
              />
              {s.label}
            </span>
            {i < SHOW_STAGES.length - 1 && <span className="h-px min-w-6 flex-1 bg-[#E9EDEB]" />}
          </span>
        ))}
      </Card>

      <Card className="mb-[18px] p-[16px_18px_18px]">
        <div className="mb-3.5 flex flex-wrap items-center gap-3">
          <span className="text-forest inline-flex items-center gap-2 text-[13.5px] font-semibold">
            <span className="size-[7px] rounded-full" style={{ background: fa.gold }} />
            {orgName}
          </span>

          {currentShow && shows.length > 0 && (
            <form method="get" className="contents">
              <select
                name="show"
                defaultValue={currentShow.id}
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
              <button
                type="submit"
                className="hover:border-gold rounded-[10px] border border-[#D9E1DD] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#0D2C23] transition-colors"
              >
                Switch
              </button>
            </form>
          )}

          {newShowSlot}
          {trailingSlot && <span className="ml-auto">{trailingSlot}</span>}
        </div>

        <ShowStatsRow stats={stats} canViewMoney={canViewMoney} showId={currentShow?.id} />

        {rings.length > 0 && (
          <div className="mt-4 flex items-stretch overflow-hidden rounded-[10px] border border-[#E9EDEB]">
            <span className="text-gold inline-flex items-center gap-2 bg-[#0D2C23] px-4 py-2.5 font-mono text-sm font-bold whitespace-nowrap">
              <LiveClock /> · {rings.length} ring{rings.length === 1 ? '' : 's'}
            </span>
            {rings.map((ring, i) => {
              const tint = RING_TINTS[i % RING_TINTS.length] ?? RING_TINTS[0];
              return (
                <span
                  key={ring}
                  className="grid flex-1 place-items-center px-2.5 py-2.5 text-[12.5px] font-bold"
                  style={{ background: tint.bg, color: tint.fg }}
                >
                  {ring}
                </span>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

const RING_TINTS = [
  { bg: '#FBE7EE', fg: '#8E3A57' },
  { bg: '#E4F0E8', fg: '#1A5B3C' },
  { bg: '#FCF3E4', fg: '#8A5B14' },
] as const;

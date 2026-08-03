import type { ReactNode } from 'react';
import { Card, Eyebrow } from './card';
import { ShowStatsRow } from './show-stats-row';
import { LiveClock } from './live-clock';
import { fa } from '@/shared/lib/organizer-theme';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import type { ShowListItem, ShowStats } from '@/modules/shows/data/queries';

/**
 * The organizer workspace's page header — lifecycle stepper, org/show picker,
 * the six-stat-card row, and a ring/clock strip — ported from the Admin
 * Console design's `wsLifecycle`/`wsStats`/`wsRings` block (Field & Arena
 * Admin Console.dc.html, "Show lifecycle" section, ~lines 840-910).
 *
 * The design repeats this exact combination above several organizer screens
 * (Dashboard, Show Manager tabs, and — per the legacy showstaff.html — the
 * Users directory too), which is why it lives here rather than inside any one
 * module: the staff module's Dashboard and the shows module's Show Manager
 * shell already each carry their own copy of the stepper/picker/stat-row
 * (see dashboard-overview.tsx and show-manager-shell.tsx), and this component
 * is the reusable version for whoever reaches for it next — the Users page
 * wires it in now, nothing else was changed to adopt it.
 *
 * Two deliberate departures from the mock:
 *
 *  - The stat row is the shared `ShowStatsRow`, which labels the money card
 *    "Revenue (settled)" rather than the design's "Revenue (all-in)". That
 *    split (settled vs. entry value) is a real, intentional distinction
 *    already established in this codebase — ShowStats' own doc comment notes
 *    the legacy dashboard conflated the two under one misleading figure. This
 *    header does not reintroduce that.
 *  - The ring strip shows each configured ring's name only, not a schedule
 *    offset ("+6m" etc). Those offsets are static mock values in the design
 *    source (`WS_RINGS`), not a computed drift from real timing data — no
 *    live-scoring/schedule-actual data exists yet to compute one honestly.
 *    The clock itself is real (the viewer's live local time).
 *
 * `newShowSlot`/`trailingSlot` are render props rather than a built-in
 * "+ New Show" / "Awards" button so this shared component never has to import
 * from `modules/shows` or `modules/staff` — the caller supplies whatever
 * concrete, mutation-backed button belongs there. `trailingSlot` is rendered
 * whenever passed; whether that's stage-gated (the design only shows Awards
 * once a show is Live) is the caller's call, not this component's.
 */
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
              className={`inline-flex items-center gap-2 whitespace-nowrap text-[13px] ${
                i === currentIndex ? 'font-semibold text-forest' : 'text-[#5A6B63]'
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
          <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-forest">
            <span className="size-[7px] rounded-full" style={{ background: fa.gold }} />
            {orgName}
          </span>

          {currentShow && shows.length > 0 && (
            <form method="get" className="contents">
              <select
                name="show"
                defaultValue={currentShow.id}
                className="min-w-[320px] flex-[0_1_380px] rounded-[10px] border border-[#D9E1DD] px-3 py-2.5 text-sm text-ink-deep"
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
                className="rounded-[10px] border border-[#D9E1DD] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#0D2C23] transition-colors hover:border-gold"
              >
                Switch
              </button>
            </form>
          )}

          {newShowSlot}
          {trailingSlot && <span className="ml-auto">{trailingSlot}</span>}
        </div>

        <ShowStatsRow stats={stats} canViewMoney={canViewMoney} />

        {rings.length > 0 && (
          <div className="mt-4 flex items-stretch overflow-hidden rounded-[10px] border border-[#E9EDEB]">
            <span className="inline-flex items-center gap-2 whitespace-nowrap bg-[#0D2C23] px-4 py-2.5 font-mono text-sm font-bold text-gold">
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

/** Rose / mint / amber, cycled per ring — the design's own WS_RINGS tint pairs. */
const RING_TINTS = [
  { bg: '#FBE7EE', fg: '#8E3A57' },
  { bg: '#E4F0E8', fg: '#1A5B3C' },
  { bg: '#FCF3E4', fg: '#8A5B14' },
] as const;

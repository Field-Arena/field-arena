import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { ResultsStubButton } from './results-stub-button';
import { Card, Eyebrow, ScreenTitle, ScreenLede } from '@/shared/ui/organizer/card';
import { ShowStatsRow } from '@/shared/ui/organizer/show-stats-row';
import { GhostButton, ghostButtonClass, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { fa } from '@/shared/lib/organizer-theme';
import { formatMoney } from '@/shared/lib/format/currency';
import type { InventoryRow, ShowListItem, ShowStats } from '@/modules/shows/data/queries';

/**
 * The organizer dashboard.
 *
 * Every figure here comes from the database — see the module's prior history
 * for why that matters (it used to render fixed numbers from constants.ts).
 * This pass swaps the hand-rolled markup for the shared organizer UI kit
 * (src/shared/ui/organizer/) ported from the Admin Console design export, so
 * this screen and Show Manager draw from the same components instead of two
 * independently hand-matched copies of the same recipe. Every prop, query,
 * and href is unchanged — only presentation moved.
 *
 * Two honesty points carried over unchanged:
 *
 *  - Revenue is split. Entry value (what the roster is worth at current class
 *    prices) and settled revenue (money actually taken) are different things,
 *    and conflating them is how an organizer ends up budgeting against money
 *    nobody has paid.
 *  - The rings list says what rings are configured, not live timers — those
 *    come from the scoring screen, which isn't migrated yet.
 */
export function DashboardOverview({
  orgName,
  shows,
  currentShow,
  stats,
  inventory,
  stage,
  rings,
  canViewMoney,
}: {
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  stats: ShowStats | null;
  inventory: InventoryRow[];
  stage: string;
  rings: string[];
  canViewMoney: boolean;
}) {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === stage);

  if (!currentShow || !stats) {
    return (
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <ScreenTitle>Dashboard</ScreenTitle>
        <ScreenLede>Everything across your shows, in one place.</ScreenLede>
        <Card className="p-[18px]">
          <p className="text-lg font-semibold text-forest">No shows yet</p>
          <p className="mt-1 text-[13.5px] text-[#5A6B63]">
            {orgName} has no shows on the platform. Create one to see entries, staffing and revenue
            here.
          </p>
        </Card>
      </div>
    );
  }

  const incompleteCount = shows.filter((s) => !s.published).length;

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-5">
        <ScreenTitle className="mb-1.5">Dashboard</ScreenTitle>
        <p className="text-[13.5px] text-[#5A6B63]">Everything across your shows, in one place.</p>
      </div>

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
            <span className="size-[7px] rounded-full" style={{ background: fa.green }} />
            {orgName}
          </span>

          {/* GET form, no JS required — matches the rest of this workspace's show switcher. */}
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
            <GhostButton type="submit">Switch</GhostButton>
          </form>

          <NewShowButton className="px-[15px] py-2.5 text-[13px]" />
          {/* Design labels this "Awards" — no results/awards viewer has been built (no
              "/shows/[showId]/results" route exists), so this is a toast stub rather
              than a link that 404s. */}
          <ResultsStubButton className="ml-auto" />
        </div>

        <div className="mb-4">
          <ShowStatsRow stats={stats} canViewMoney={canViewMoney} />
        </div>

        {canViewMoney && stats.entryValue > 0 && stats.settledRevenue === 0 && (
          <p className="mb-4 text-[12.5px] text-[#7C8A84] text-pretty">
            The roster is worth {formatMoney(stats.entryValue)} at current class prices, but nothing
            has been collected — rider checkout is not migrated yet, so this is genuinely unpaid
            rather than missing.
          </p>
        )}

        {rings.length > 0 ? (
          <div className="flex items-stretch overflow-hidden rounded-[10px] border border-[#E9EDEB]">
            <span className="whitespace-nowrap bg-forest px-4 py-2.5 font-mono text-sm font-bold text-gold">
              {rings.length} ring{rings.length === 1 ? '' : 's'}
            </span>
            {rings.map((ring) => (
              <span
                key={ring}
                className="grid flex-1 place-items-center bg-[#F5F7F6] px-2.5 py-2.5 text-[12.5px] font-bold text-forest"
              >
                {ring}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[#E9EDEB] px-4 py-3 text-[12.5px] text-[#98A29D]">
            No rings running for this show.
          </div>
        )}
      </Card>

      {incompleteCount > 0 && (
        <Card className="mb-[18px] flex flex-wrap items-center gap-4 border-l-[3px] border-l-[#B4432F] p-[16px_18px]">
          <span className="text-[13.5px] text-[#48574F]">
            {incompleteCount} show{incompleteCount === 1 ? '' : 's'} still{' '}
            {incompleteCount === 1 ? 'needs' : 'need'} setup before they can open entries.
          </span>
          <Link href="/dashboard/shows/incomplete" className={cn(ghostButtonClass, 'ml-auto')}>
            View incomplete shows →
          </Link>
        </Card>
      )}

      <div className="overflow-hidden rounded-[12px] border border-[#E9EDEB] border-l-[3px] border-l-[#1A5B3C]">
        <div className="p-[16px_18px_14px]">
          <div className="mb-[5px] font-[Newsreader,serif] text-[19px] font-semibold text-forest">
            {currentShow.name}
          </div>
          <div className="text-[12.5px] text-[#7A8781]">
            {[currentShow.dateLabel, currentShow.venueName].filter(Boolean).join(' · ')}
          </div>
        </div>

        <div className="border-t border-[#E9EDEB] px-[18px] py-3.5">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3.5 text-[9.5px] font-bold uppercase tracking-[.14em] text-[#6E7C76]">
            <span>Purchases &amp; inventory</span>
            <span className="text-right">Qty</span>
            <span className="text-right">{canViewMoney ? 'Value' : ''}</span>
          </div>
          {inventory.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3.5 border-t border-[#EFE9DB] py-2.5 text-[13.5px]"
            >
              <span className="font-semibold text-ink-deep">{row.name}</span>
              <span className="text-right text-ink-deep">{row.qty}</span>
              <span className="text-right text-ink-deep">
                {canViewMoney && (
                  <>
                    {formatMoney(row.revenue)}
                    {!row.settled && row.revenue > 0 && (
                      <span className="block text-[11.5px] font-normal text-[#98A29D]">
                        owed, not collected
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-[#E9EDEB] bg-[#F5F7F6] px-[18px] py-3.5">
          <span className="text-[13px] text-[#5A6B63]">
            {currentShow.published
              ? 'This show is published and visible to riders.'
              : 'This show is not published — riders cannot see or enter it yet.'}
          </span>
          <Link href={`/dashboard/shows/${currentShow.id}`} className={cn(primaryButtonClass, 'ml-auto')}>
            Open Show Manager
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { ScreenTitle, ScreenLede, Eyebrow, Card } from '@/shared/ui/organizer/card';
import { ShowStatsRow } from '@/shared/ui/organizer/show-stats-row';
import { fa } from '@/shared/lib/organizer-theme';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import type { ShowStats, ShowListItem } from '../../data/queries';
import { NewShowButton } from './new-show-button';
import { ShowSwitcher } from './show-switcher';

/**
 * The "Show Manager sections" tab bar and page heading — the chrome every
 * Show Manager tab sits under, ported from showstaff.html's SM_SUBNAV_STEPS
 * and the design's `smTabs` header block. All seven tabs now have routes.
 *
 * Below the tabs, the design repeats the exact same lifecycle bar,
 * org/show switcher, and six-stat-card row the Dashboard shows — on every
 * Show Manager tab, not only Setup. It deliberately does NOT repeat the
 * ring/clock strip; see getShowManagerVitals's own comment for why.
 *
 * The design's fixed-overlay "smOpen" panel included its own "← Dashboard"
 * back button and org-name bar, because in that mock it takes over the
 * whole screen. Here it renders inside OrganizerShell, which already keeps
 * the sidebar and a real "Shows" nav item on screen at all times, so that
 * bar has no job left to do and isn't reproduced.
 */
const SM_TABS = [
  { label: 'Setup', path: '' },
  { label: 'Select Events', path: '/select-events' },
  { label: 'Rider Entries', path: '/rider-entries' },
  { label: 'Schedule / Review', path: '/schedule' },
  { label: 'Run Show', path: '/run-show' },
  { label: 'Documents', path: '/documents' },
  { label: 'Test Builder', path: '/test-builder' },
] as const;

export function ShowManagerShell({
  showId,
  showName,
  activeTab = 'Setup',
  orgName,
  shows,
  stats,
  stage,
  canViewMoney,
  children,
}: {
  showId: string;
  showName: string;
  /** Which tab is current. Passed in rather than read from the pathname so the shell stays a Server Component. */
  activeTab?: (typeof SM_TABS)[number]['label'];
  orgName: string;
  shows: ShowListItem[];
  stats: ShowStats;
  stage: string;
  canViewMoney: boolean;
  children: React.ReactNode;
}) {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === stage);
  const tabPath = SM_TABS.find((t) => t.label === activeTab)?.path ?? '';

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <ScreenTitle>Show Manager</ScreenTitle>
      <ScreenLede>{showName} — set up, schedule, and run your show, start to finish.</ScreenLede>

      <Eyebrow className="mb-3 block">Show Manager sections</Eyebrow>
      <div className="mb-[22px] flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-[#E9EDEB]">
        {SM_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={`/dashboard/shows/${showId}${tab.path}`}
            aria-current={tab.label === activeTab ? 'page' : undefined}
            className={
              tab.label === activeTab
                ? 'flex-none border-b-2 border-forest px-3.5 py-[11px] text-[13.5px] font-bold text-forest whitespace-nowrap'
                : 'flex-none border-b-2 border-transparent px-3.5 py-[11px] text-[13.5px] font-medium text-[#6E7C76] whitespace-nowrap transition-colors hover:text-forest'
            }
          >
            {tab.label}
          </Link>
        ))}
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

          <ShowSwitcher shows={shows} currentShowId={showId} tabPath={tabPath} />

          <NewShowButton className="px-[15px] py-2.5 text-[13px]" />
        </div>

        <ShowStatsRow stats={stats} canViewMoney={canViewMoney} showId={showId} />
      </Card>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

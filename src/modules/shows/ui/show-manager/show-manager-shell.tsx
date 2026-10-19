'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import type { ShowListItem, ShowManagerOverview } from '@/modules/shows/types';
import { SHOW_MANAGER_SECTIONS, type ShowManagerTab } from '@/modules/shows/constants';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { ShowSwitcher } from '@/modules/shows/ui/show-manager/show-switcher';
import { approvalTone, shortDate, whenLabel } from '@/modules/staff/ui/dashboard-format';

const SM_TABS = SHOW_MANAGER_SECTIONS;

/* The step a show is "on" for each lifecycle stage. Steps before it with
 * nothing open get a check mark. */
const STAGE_STEP: Record<string, ShowManagerTab> = {
  setup: 'Setup',
  'sales-open': 'Rider Entries',
  'sales-closed': 'Schedule / Review',
  schedule: 'Run Show',
  live: 'Run Show',
  complete: 'Results',
};

const STEP_NAME: Record<ShowManagerTab, string> = {
  Setup: 'Setup',
  'Select Events': 'Select events',
  'Rider Entries': 'Rider entries',
  'Schedule / Review': 'Schedule',
  'Run Show': 'Run show',
  Documents: 'Documents',
  'Test Builder': 'Test builder',
  Results: 'Results',
};

function dateRange(start: string | null, end: string | null): string | null {
  const a = shortDate(start);
  const b = shortDate(end);
  if (!a) return null;
  return b && b !== a ? `${a} – ${b}` : a;
}

export function ShowManagerShell({
  showId,
  shows,
  stage,
  overview,
  children,
}: {
  showId: string;
  shows: ShowListItem[];
  stage: string;
  overview: ShowManagerOverview;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab =
    SM_TABS.find((t) => pathname === `/dashboard/shows/${showId}${t.path}`) ?? SM_TABS[0];
  const currentIndex = SM_TABS.indexOf(currentTab);
  const stageStep = STAGE_STEP[stage] ?? 'Setup';
  const stageIndex = SM_TABS.findIndex((t) => t.label === stageStep);
  const stageLabel = SHOW_STAGES.find((s) => s.key === stage)?.label ?? null;

  const pct =
    overview.readyTotal === 0
      ? null
      : Math.round((overview.readyCount / overview.readyTotal) * 100);
  const tone = approvalTone(pct);
  const subline = [
    dateRange(overview.startDate, overview.endDate),
    overview.venue,
    whenLabel(overview.daysOut),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <ShowSwitcher shows={shows} currentShowId={showId} tabPath={currentTab.path} />
        <NewShowButton className="px-[15px] py-2.5 text-[13px]" />
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {subline && <p className="text-[13.5px] font-semibold text-[#5A6B63]">{subline}</p>}
          <h1 className="mt-1 font-[family-name:var(--ws-fraunces)] text-[32px] leading-[1.1] font-bold text-[#0D2C23]">
            {overview.name}
          </h1>
        </div>
        <div className="text-right">
          <p className={`text-[30px] leading-none font-bold ${tone.text}`}>
            {overview.readyCount} of {overview.readyTotal} ready
          </p>
          <div
            className="mt-2 ml-auto h-2.5 w-[240px] max-w-full overflow-hidden rounded-full bg-[#E4EAE7]"
            role="progressbar"
            aria-label="Setup readiness"
            aria-valuenow={pct ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full ${tone.bar}`}
              style={{ width: `${String(pct ?? 0)}%` }}
            />
          </div>
          {stageLabel && (
            <p className="mt-1.5 text-[12.5px] font-semibold text-[#5A6B63]">Stage: {stageLabel}</p>
          )}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav
          aria-label="Show Manager steps"
          className="flex gap-1 overflow-x-auto rounded-[16px] border-[1.5px] border-[#C9D3CE] bg-white p-2 lg:flex-col lg:overflow-visible"
        >
          {SM_TABS.map((tab, i) => {
            const count = overview.countsByStep[tab.label] ?? 0;
            const viewing = tab === currentTab;
            const done =
              count === 0 && (tab.label === 'Setup' ? overview.setupComplete : i < stageIndex);
            const now = !done && i === stageIndex;
            return (
              <Link
                key={tab.label}
                href={`/dashboard/shows/${showId}${tab.path}`}
                prefetch={false}
                aria-current={viewing ? 'page' : undefined}
                className={`flex flex-none items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] whitespace-nowrap no-underline ${
                  viewing
                    ? 'border-2 border-[#1A5B3C] bg-[#F5F7F6] font-extrabold text-[#0D2C23]'
                    : 'border-2 border-transparent font-semibold text-[#3F4F48] hover:bg-[#F5F7F6]'
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-[26px] flex-none place-items-center rounded-full text-[13px] font-extrabold ${
                    done
                      ? 'bg-[#1A5B3C] text-white'
                      : now
                        ? 'bg-[#E0A800] text-white'
                        : 'border-2 border-[#C9D3CE] text-[#98A29D]'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                {STEP_NAME[tab.label]}
                {count > 0 && (
                  <span
                    className="ml-auto rounded-full bg-[#FDEEEB] px-2 py-0.5 text-[11.5px] font-extrabold text-[#B4432F]"
                    aria-label={`${String(count)} open`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0">
          {overview.needs.length > 0 ? (
            <section aria-labelledby="sm-needs" className="mb-5">
              <h2
                id="sm-needs"
                className="mb-2 font-[family-name:var(--ws-fraunces)] text-[13px] font-bold tracking-[.06em] text-[#5A6B63] uppercase"
              >
                Needs you · {overview.needs.length}
              </h2>
              <ul className="overflow-hidden rounded-[16px] border-[1.5px] border-[#B4432F] bg-white">
                {overview.needs.map((need, i) => (
                  <li
                    key={need.key}
                    className={`flex flex-wrap items-center gap-4 px-5 py-3.5 ${
                      i > 0 ? 'border-t border-[#EDF0EE]' : ''
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid size-[30px] flex-none place-items-center rounded-full border-2 text-[13px] font-extrabold ${
                        need.priority === 'urgent'
                          ? 'border-[#B4432F] bg-[#FDEEEB] text-[#B4432F]'
                          : 'border-[#E0A800] bg-[#FCF3E4] text-[#8A6D14]'
                      }`}
                    >
                      !
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15.5px] font-bold text-[#0D2C23]">
                        {need.label}{' '}
                        <span className="ml-1 rounded-[6px] bg-[#EDF0EE] px-2 py-0.5 align-middle text-[11.5px] font-bold text-[#5A6B63]">
                          {need.step ? STEP_NAME[need.step] : need.tag}
                        </span>
                      </p>
                      {need.detail && <p className="text-[13px] text-[#5A6B63]">{need.detail}</p>}
                    </div>
                    <Link
                      href={need.href}
                      prefetch={false}
                      className={`rounded-[9px] border-2 border-[#1A5B3C] px-3 py-1.5 text-[13px] font-bold whitespace-nowrap no-underline ${
                        i === 0 ? 'bg-[#1A5B3C] text-white' : 'bg-white text-[#1A5B3C]'
                      }`}
                    >
                      {need.actionLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="mb-5 rounded-[16px] border-[1.5px] border-[#1A5B3C] bg-[#E9F4EE] px-5 py-3.5 text-[15px] font-bold text-[#1A5B3C]">
              ✓ Nothing needs you right now.
            </p>
          )}

          <p className="text-[13px] font-semibold text-[#5A6B63]">
            You&apos;re on step {currentIndex + 1} of {SM_TABS.length}
          </p>
          <h2 className="mb-3 font-[family-name:var(--ws-fraunces)] text-[24px] font-bold text-[#0D2C23]">
            {STEP_NAME[currentTab.label]}
          </h2>
          <div className="flex flex-col gap-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

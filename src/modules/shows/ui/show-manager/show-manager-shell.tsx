'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import { SHOW_MANAGER_SECTIONS } from '@/modules/shows/constants';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { TabStrip } from '@/shared/ui/organizer/tab-strip';

/* The redesign's Show Manager header: title, numbered lifecycle stepper, and
 * the section tabs. The show itself is picked in the workspace topbar, so the
 * old in-page org/show switcher and stats card are gone from here (the same
 * stats are on the Dashboard). */
export function ShowManagerShell({
  showId,
  stage,
  children,
}: {
  showId: string;
  stage: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab =
    SHOW_MANAGER_SECTIONS.find((t) => pathname === `/dashboard/shows/${showId}${t.path}`) ??
    SHOW_MANAGER_SECTIONS[0];
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === stage);

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Show Manager</h2>
          <p>Set up, schedule, and run your show — start to finish. One show at a time.</p>
        </div>
        <div className="fa-head-actions">
          <Link href="/dashboard/shows?all=1" prefetch={false} className="fa-btn fa-btn-ghost">
            All shows
          </Link>
          <NewShowButton variant="primary" />
        </div>
      </div>

      <div className="fa-lifecycle" aria-label="Show lifecycle">
        {SHOW_STAGES.map((s, i) => {
          const state = i < currentIndex ? 'fa-done' : i === currentIndex ? 'fa-current' : '';
          return (
            <span key={s.key} className="contents">
              <span className={`fa-lc-step ${state}`}>
                <span className="fa-lc-dot">{i < currentIndex ? '✓' : i + 1}</span>
                <span className="fa-lc-lab">{s.label}</span>
              </span>
              {i < SHOW_STAGES.length - 1 && (
                <span className={`fa-lc-line ${i < currentIndex ? 'fa-done' : ''}`} />
              )}
            </span>
          );
        })}
      </div>

      <TabStrip
        activeKey={currentTab.label}
        sections={SHOW_MANAGER_SECTIONS.map((tab) => ({
          key: tab.label,
          label: tab.label,
          href: `/dashboard/shows/${showId}${tab.path}`,
        }))}
      />

      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

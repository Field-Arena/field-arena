import Link from 'next/link';
import { ScreenTitle, ScreenLede, Eyebrow } from '@/shared/ui/organizer/card';

/**
 * The "Show Manager sections" tab bar and page heading — the chrome every
 * Show Manager tab sits under, ported from showstaff.html's SM_SUBNAV_STEPS
 * and the design's `smTabs` header block. All seven tabs now have routes.
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
  children,
}: {
  showId: string;
  showName: string;
  /** Which tab is current. Passed in rather than read from the pathname so the shell stays a Server Component. */
  activeTab?: (typeof SM_TABS)[number]['label'];
  children: React.ReactNode;
}) {
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

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

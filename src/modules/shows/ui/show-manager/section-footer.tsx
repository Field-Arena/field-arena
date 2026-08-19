import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { SHOW_MANAGER_SECTIONS, type ShowManagerTab } from '@/modules/shows/constants';
import { SM_GREEN_BTN } from '@/modules/shows/ui/show-manager/tokens';

export function SectionFooter({
  currentTab,
  showId,
  blockedReason,
}: {
  currentTab: ShowManagerTab;

  showId?: string;
  blockedReason?: string | null;
}) {
  const section = SHOW_MANAGER_SECTIONS.find((s) => s.label === currentTab);
  const next = section?.nextLabel
    ? SHOW_MANAGER_SECTIONS.find((s) => s.label === section.nextLabel)
    : null;

  if (!section || !next) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-[#EDF0EE] bg-white px-6 py-5">
        <p className="min-w-0 text-[13px] text-[#6E7C76]">
          That&apos;s every Show Manager section for this show — jump back to any tab above, or head
          to your dashboard.
        </p>
        <Link href="/dashboard" className={cn(ghostButtonClass, 'ml-auto')}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-[#EDF0EE] bg-white px-6 py-5">
      <div className="min-w-0">
        <p className="text-[13px] text-[#6E7C76]">{section.nextNote}</p>
        {blockedReason && (
          <p className="mt-1 text-[12.5px] text-[#B4432F] italic">{blockedReason}</p>
        )}
      </div>
      <Link
        href={`/dashboard/shows/${showId ?? ''}${next.path}`}
        className={cn(SM_GREEN_BTN, 'ml-auto')}
      >
        Continue to {next.label} →
      </Link>
    </div>
  );
}

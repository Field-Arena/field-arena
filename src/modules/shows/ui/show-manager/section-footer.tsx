import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { SHOW_MANAGER_SECTIONS, type ShowManagerTab } from '@/modules/shows/constants';
import { SM_GREEN_BTN } from '@/modules/shows/ui/show-manager/tokens';

export function SectionFooter({
  currentTab,
  showId,
  blockedReason,
  previewUrl,
  inCard = false,
}: {
  currentTab: ShowManagerTab;
  /** Render as the last row of the section's own card (prototype footer:
   * "Saved automatically" left, Continue right) instead of a separate card. */
  inCard?: boolean;

  showId?: string;
  blockedReason?: string | null;
  previewUrl?: string;
}) {
  const section = SHOW_MANAGER_SECTIONS.find((s) => s.label === currentTab);
  const next = section?.nextLabel
    ? SHOW_MANAGER_SECTIONS.find((s) => s.label === section.nextLabel)
    : null;

  if (!section || !next) {
    return (
      <div className="fa-card flex flex-wrap items-center gap-4 px-5 py-4">
        <p className="m-0 min-w-0 text-[13px] text-[var(--fa-ink-3)]">
          That&apos;s every Show Manager section for this show — jump back to any tab above, or head
          to your dashboard.
        </p>
        <Link href="/dashboard" prefetch={false} className={cn(ghostButtonClass, 'ml-auto')}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (inCard) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--fa-line-soft)] px-5 py-3.5">
        <div className="min-w-0">
          <span className="fa-autosave-inline">
            <span className="fa-as-dot" />
            Saved automatically
          </span>
          <p className="m-0 mt-0.5 text-[11.5px] text-[var(--fa-ink-3)]">{section.nextNote}</p>
          {blockedReason && (
            <p className="m-0 mt-0.5 text-[11.5px] text-[var(--fa-amber)]">{blockedReason}</p>
          )}
        </div>
        <Link
          href={`/dashboard/shows/${showId ?? ''}${next.path}`}
          className="fa-btn fa-btn-primary"
        >
          Continue to {next.label} →
        </Link>
      </div>
    );
  }

  return (
    <div className="fa-card flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-0">
        <span className="fa-autosave-inline">
          <span className="fa-as-dot" />
          {section.nextNote}
        </span>
        {blockedReason && (
          <p className="m-0 mt-1 text-[12px] text-[var(--fa-amber)]">{blockedReason}</p>
        )}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-3">
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="fa-filelink">
            Preview ticket page ↗
          </a>
        )}
        <Link href={`/dashboard/shows/${showId ?? ''}${next.path}`} className={SM_GREEN_BTN}>
          Continue to {next.label} →
        </Link>
      </div>
    </div>
  );
}

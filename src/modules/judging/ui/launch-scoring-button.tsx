'use client';

import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

/**
 * "Launch Scoring →", ported from Judge Workspace.dc.html's today-vs-upcoming
 * button treatment (green/live for today's classes, greyed and inert for
 * later ones). The live scoring screen itself isn't migrated yet — matching
 * the note already on the old judging page — so the active click surfaces
 * that honestly instead of navigating to a page that doesn't exist.
 */
export function LaunchScoringButton({ active }: { active: boolean }) {
  if (!active) {
    return (
      <span
        className="flex-none whitespace-nowrap rounded-[9px] bg-[#F1F4F3] px-5 py-[13px] text-[13.5px] font-bold text-[#B4BFB9]"
        aria-hidden
      >
        Launch Scoring →
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        toast.info('Entering marks needs the live scoring screen, which is not migrated yet.');
      }}
      className={cn(
        'flex-none whitespace-nowrap rounded-[9px] bg-[#1D4A38] px-5 py-[13px]',
        'text-[13.5px] font-bold text-[#F5F7F6] transition-colors hover:bg-gold hover:text-[#0D2C23]'
      )}
    >
      Launch Scoring →
    </button>
  );
}

import Link from 'next/link';

/**
 * "Launch Scoring →", ported from Judge Workspace.dc.html's today-vs-upcoming
 * button treatment (green/live for today's classes, greyed and inert for
 * later ones). Today's classes link straight into the live-scoring screen
 * (`modules/scoring`) — a route link, not an import, so this module never
 * reaches into scoring's internals.
 */
export function LaunchScoringButton({ active, classId }: { active: boolean; classId: string }) {
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
    <Link
      href={`/dashboard/scoring/${classId}`}
      className="flex-none rounded-[9px] bg-[#1D4A38] px-5 py-[13px] text-[13.5px] font-bold text-[#F5F7F6] whitespace-nowrap transition-colors hover:bg-gold hover:text-[#0D2C23]"
    >
      Launch Scoring →
    </Link>
  );
}

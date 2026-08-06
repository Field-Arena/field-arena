import { cn } from '@/shared/lib/utils';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import type { AssignmentRow } from '../data/queries';
import { formatClassTime } from '../utils';
import { LaunchScoringButton } from './launch-scoring-button';

const WHEN_META = {
  today: { label: 'Today', bg: '#FBF0D8', fg: '#8A6D14' },
  upcoming: { label: 'Upcoming', bg: '#E6EFF6', fg: '#37637F' },
  history: { label: 'Completed', bg: '#DCEFE1', fg: '#2E7D46' },
} as const;

/**
 * One class panel row, ported from Judge Workspace.dc.html's assignment
 * card — used for the Today/Upcoming groups on My Assignments and again,
 * without the Launch Scoring button, on History.
 *
 * The design's "Test sheet: {name} ↗" is a live link to a real PDF in its
 * mock. No per-class test-sheet document exists in this schema yet (the
 * platform's Documents board matches sheets to the scoring catalog globally,
 * not to a specific class instance) — shown as plain text rather than a link
 * that would go nowhere.
 */
export function AssignmentCard({
  assignment,
  variant,
}: {
  assignment: AssignmentRow;
  variant: 'today' | 'upcoming' | 'history';
}) {
  const time = formatClassTime(assignment.classTime);
  const seatLabel = [assignment.ring, assignment.position ? `at ${assignment.position}` : null]
    .filter(Boolean)
    .join(' · ');
  const when = WHEN_META[variant];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-5 rounded-xl border bg-white p-[18px_20px]',
        'shadow-[0_1px_2px_rgba(16,40,32,.03)]',
        variant === 'today' ? 'border-[#E9EDEB] border-l-4 border-l-gold' : 'border-[#E9EDEB]'
      )}
    >
      <div className="min-w-[260px] flex-1">
        <div className="mb-1.5 font-[Newsreader,serif] text-lg font-semibold text-ink-deep">
          {time ? `${time} · ` : ''}
          {assignment.classLabel}
        </div>
        <div className="mb-0.5 text-[13.5px] text-[#5A6B63]">
          {assignment.showName}
          {seatLabel ? ` · ${seatLabel}` : ''}
        </div>
        {assignment.partnerName && (
          <div className="mb-[7px] text-[13.5px] text-[#5A6B63]">
            With {assignment.partnerName} ({assignment.partnerRole === 'judge' ? 'Judge' : 'Scribe'})
          </div>
        )}
        <div className="text-[13.5px] text-[#5A6B63]">
          Test sheet: <span className="font-bold text-ink-deep">{assignment.classLabel}</span>
        </div>
      </div>

      <StatusPill
        bg="#EAF1EC"
        border="#EAF1EC"
        fg="#3F5C4C"
        className="flex-none text-[11px] tracking-[.1em]"
      >
        {assignment.seatRole === 'judge' ? 'JUDGE' : 'SCRIBE'}
      </StatusPill>

      <StatusPill bg={when.bg} border={when.bg} fg={when.fg} className="flex-none">
        {when.label}
      </StatusPill>

      {variant !== 'history' && (
        <LaunchScoringButton active={variant === 'today'} classId={assignment.classId} />
      )}
    </div>
  );
}

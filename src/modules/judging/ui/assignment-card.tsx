import { cn } from '@/shared/lib/utils';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import { formatDateShort } from '@/shared/lib/format/date';
import type { AssignmentRow } from '@/modules/judging/data/queries';
import { formatClassTime } from '@/modules/judging/utils/format-class-time';
import { USDF_TEST_SHEETS_URL } from '@/modules/judging/constants';
import { LaunchScoringButton } from '@/modules/judging/ui/launch-scoring-button';

const WHEN_META = {
  today: { label: 'Today', bg: '#FBF0D8', fg: '#8A6D14' },
  upcoming: { label: 'Upcoming', bg: '#E6EFF6', fg: '#37637F' },
  history: { label: 'Completed', bg: '#DCEFE1', fg: '#2E7D46' },
} as const;

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

  const dateLabel =
    formatDateShort(assignment.classDate) ||
    formatDateShort(assignment.showDate) ||
    (assignment.showDate ?? '');
  const dateTime = variant === 'today' ? time : [dateLabel, time].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-5 rounded-xl border bg-white p-[18px_20px]',
        'shadow-[0_1px_2px_rgba(16,40,32,.03)]',
        variant === 'today' ? 'border-l-gold border-l-4 border-[#E9EDEB]' : 'border-[#E9EDEB]',
      )}
    >
      <div className="min-w-[260px] flex-1">
        <div className="text-ink-deep mb-1.5 font-[Newsreader,serif] text-lg font-semibold">
          {dateTime ? `${dateTime} · ` : ''}
          {assignment.classLabel}
        </div>
        <div className="mb-0.5 text-[13.5px] text-[#5A6B63]">
          {assignment.showName}
          {seatLabel ? ` · ${seatLabel}` : ''}
        </div>
        {assignment.partnerName && (
          <div className="mb-[7px] text-[13.5px] text-[#5A6B63]">
            With {assignment.partnerName} ({assignment.partnerRole === 'judge' ? 'Judge' : 'Scribe'}
            )
          </div>
        )}
        <div className="text-[13.5px] text-[#5A6B63]">
          Test sheet:{' '}
          {variant === 'history' ? (
            // The whole history card is wrapped in a <Link>; a nested <a> here
            // is invalid HTML and causes a hydration mismatch.
            <span className="text-ink-deep font-bold">{assignment.classLabel}</span>
          ) : (
            <a
              href={USDF_TEST_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-deep hover:text-gold font-bold underline decoration-[#B4BFB9]"
            >
              {assignment.classLabel} ↗
            </a>
          )}
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

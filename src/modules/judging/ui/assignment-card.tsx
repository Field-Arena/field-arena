import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import type { AssignmentRow } from '@/modules/judging/types';
import { formatClassTime } from '@/modules/judging/utils/format-class-time';
import { USDF_TEST_SHEETS_URL } from '@/modules/judging/constants';
import { LaunchScoringButton } from '@/modules/judging/ui/launch-scoring-button';

const WHEN_META = {
  today: { label: 'Today', badge: 'fa-pending' },
  upcoming: { label: 'Upcoming', badge: 'fa-pass' },
  history: { label: 'Completed', badge: 'fa-live' },
} as const;

export function AssignmentCard({
  assignment,
  variant,
  completed = false,
}: {
  assignment: AssignmentRow;
  variant: 'today' | 'upcoming' | 'history';
  /** Every ride already scored/scratched/disqualified, but results aren't
   * published yet — still "today," but nothing left to launch. */
  completed?: boolean;
}) {
  const time = formatClassTime(assignment.classTime);
  const seatLabel = [assignment.ring, assignment.position ? `at ${assignment.position}` : null]
    .filter(Boolean)
    .join(' · ');
  const when = completed ? WHEN_META.history : WHEN_META[variant];

  const dateLabel =
    formatDateShort(assignment.classDate) ||
    formatDateShort(assignment.showDate) ||
    (assignment.showDate ?? '');
  const dateTime = variant === 'today' ? time : [dateLabel, time].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'fa-card flex flex-wrap items-center gap-4 !overflow-visible border-l-[3px] px-5 py-[18px]',
        variant === 'today' && !completed
          ? '!border-l-[var(--fa-brand)]'
          : variant === 'history' || completed
            ? '!border-l-[var(--fa-emerald)]'
            : '!border-l-[#C3CAD3]',
      )}
    >
      <div className="min-w-[260px] flex-1">
        <div className="mb-1 text-[16px] font-semibold tracking-[-.2px] text-[var(--fa-ink)]">
          {dateTime ? `${dateTime} · ` : ''}
          {assignment.classLabel}
        </div>
        <div className="text-[13px] text-[var(--fa-ink-2)]">
          {assignment.showName}
          {seatLabel ? ` · ${seatLabel}` : ''}
        </div>
        <div className="text-[13px] text-[var(--fa-ink-2)]">
          {assignment.partnerName && (
            <>
              With {assignment.partnerName} (
              {assignment.partnerRole === 'judge' ? 'Judge' : 'Scribe'}) ·{' '}
            </>
          )}
          Test sheet:{' '}
          {variant === 'history' ? (
            // The whole history card is wrapped in a <Link>; a nested <a> here
            // is invalid HTML and causes a hydration mismatch.
            <span className="font-medium text-[var(--fa-sky)]">{assignment.classLabel}</span>
          ) : (
            <a
              href={USDF_TEST_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="fa-filelink"
            >
              {assignment.classLabel} ↗
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2">
        <span className="fa-badge fa-stub !tracking-[.04em]">
          {assignment.seatRole === 'judge' ? 'JUDGE' : 'SCRIBE'}
        </span>
        <span className={`fa-badge ${when.badge}`}>
          <span className="fa-dot" />
          {when.label}
        </span>

        {variant !== 'history' &&
          (completed ? (
            <Link
              href="/dashboard/judging/results"
              prefetch={false}
              className="fa-btn fa-btn-ghost"
            >
              View results →
            </Link>
          ) : (
            <LaunchScoringButton active={variant === 'today'} classId={assignment.classId} />
          ))}
      </div>
    </div>
  );
}

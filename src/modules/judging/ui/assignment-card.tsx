import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import {
  CardTitle,
  FA_BTN,
  FA_MUTED,
  FaCard,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import type { AssignmentRow } from '@/modules/judging/types';
import { formatClassTime } from '@/modules/judging/utils/format-class-time';
import { USDF_TEST_SHEETS_URL } from '@/modules/judging/constants';
import { LaunchScoringButton } from '@/modules/judging/ui/launch-scoring-button';

const WHEN_META: Record<'today' | 'upcoming' | 'history', { label: string; tone: PillTone }> = {
  today: { label: 'Today', tone: 'green' },
  upcoming: { label: 'Upcoming', tone: 'grey' },
  history: { label: 'Completed', tone: 'blue' },
};

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
  const roleLabel = assignment.seatRole === 'judge' ? 'Judge' : 'Scribe';
  const meta = [
    assignment.showName,
    assignment.ring ?? 'Ring not assigned yet',
    assignment.position ? `${roleLabel} at ${assignment.position}` : roleLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  const when = completed ? WHEN_META.history : WHEN_META[variant];

  const dateLabel =
    formatDateShort(assignment.classDate) ||
    formatDateShort(assignment.showDate) ||
    (assignment.showDate ?? '');
  const rides = `${String(assignment.entryCount)} ride${assignment.entryCount === 1 ? '' : 's'}`;
  const bigLabel = variant === 'today' ? (time ?? '—') : dateLabel || '—';
  const subLabel = variant === 'today' ? rides : [time, rides].filter(Boolean).join(' · ');

  return (
    <FaCard
      tone={variant === 'today' && !completed ? 'live' : 'default'}
      className="flex flex-wrap items-center gap-x-[18px] gap-y-3"
    >
      <div className="min-w-[110px] flex-none">
        <div className="text-[24px] leading-tight font-bold text-[#0D2C23]">{bigLabel}</div>
        <div className={FA_MUTED}>{subLabel}</div>
      </div>

      <div className="min-w-[220px] flex-1">
        <CardTitle className="text-[19px]">{assignment.classLabel}</CardTitle>
        <div className={FA_MUTED}>{meta}</div>
        <div className={FA_MUTED}>
          {assignment.partnerName && (
            <>
              With {assignment.partnerName} (
              {assignment.partnerRole === 'judge' ? 'Judge' : 'Scribe'}) ·{' '}
            </>
          )}
          {variant === 'history' ? (
            // The whole history card is wrapped in a <Link>; a nested <a> here
            // is invalid HTML and causes a hydration mismatch.
            <span>Test sheet: {assignment.classLabel}</span>
          ) : (
            <a
              href={USDF_TEST_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0D2C23] underline decoration-[#B4BFB9] underline-offset-2 hover:text-[#1A5B3C]"
            >
              Test sheet ↗
            </a>
          )}
        </div>
      </div>

      <Pill tone={when.tone} className="flex-none">
        {when.label}
      </Pill>

      {variant !== 'history' &&
        (completed ? (
          <Link
            href="/dashboard/judging/results"
            prefetch={false}
            className={cn(FA_BTN, 'flex-none')}
          >
            View results →
          </Link>
        ) : (
          <LaunchScoringButton active={variant === 'today'} classId={assignment.classId} />
        ))}
    </FaCard>
  );
}

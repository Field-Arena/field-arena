'use client';

import Link from 'next/link';
import type { ScheduleSummary } from '@/modules/shows/schedule-summary';
import { useApproveSchedule } from '@/modules/shows/hooks/use-run-show-mutations';
import { SHOW_STAGES } from '@/shared/constants/show-stages';

function Check({
  ok,
  title,
  sub,
  href,
  fix,
}: {
  ok: boolean;
  title: string;
  sub: string;
  href: string;
  fix: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`fa-comp-item ${ok ? 'fa-ok' : 'fa-warn'} no-underline`}
    >
      <span className="fa-ci">{ok ? '✓' : '!'}</span>
      <span className="fa-ct">
        <b>{title}</b>
        <span>
          {sub}
          {!ok && <> · {fix} →</>}
        </span>
      </span>
    </Link>
  );
}

/** The redesign's Schedule / Review summary: what the auto-built schedule
 * looks like ring by ring, what's left before it can be approved, and the
 * approve action itself. */
export function ScheduleReviewSummary({
  showId,
  publicId,
  summary,
  published,
  ticketClosed,
  approved,
  stage,
  officials,
  restGap,
}: {
  showId: string;
  publicId: string;
  summary: ScheduleSummary;
  published: boolean;
  ticketClosed: boolean;
  approved: boolean;
  stage: string;
  /** Judges + scribes on this show, and how many have signed in (have access). */
  officials: { total: number; judges: number; withAccess: number };
  /** The show's rest-gap rule, in minutes (same horse / different horse). */
  restGap: { same: number; diff: number };
}) {
  const approve = useApproveSchedule();
  const firstWait = summary.restWaits[0];
  const stageLabel = SHOW_STAGES.find((st) => st.key === stage)?.label ?? stage;
  const liveLabel = SHOW_STAGES.find((st) => st.key === 'live')?.label ?? 'Live';
  const plural = (n: number, one: string, many = `${one}s`) =>
    `${String(n)} ${n === 1 ? one : many}`;
  const hasRides = summary.rides > 0;
  const judgesOk = summary.rings > 0 && summary.ringsWithJudges === summary.rings;

  const blocker = approved
    ? null
    : !hasRides
      ? 'Nothing is scheduled yet — the schedule builds once riders enter.'
      : !published
        ? 'Open ticket sales first (Run Show).'
        : !ticketClosed
          ? 'Close ticket sales on Run Show before approving.'
          : null;

  return (
    <>
      {firstWait && (
        <div className="fa-callout !mb-0 !border-[#CFE3F5] !bg-[var(--fa-sky-tint)] !text-[#0B4F87]">
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
          <span>
            <b className="!text-[#0B4F87]">Rest gap applied.</b> {firstWait.riderName} rides in{' '}
            {firstWait.ringA} and {firstWait.ringB}, so {firstWait.ringA} waits until they&apos;ve
            had their {restGap.same}-minute break ({restGap.diff} with a different horse)
            {summary.restWaits.length > 1
              ? ` — and ${plural(summary.restWaits.length - 1, 'other wait')} like it`
              : ''}
            . Nothing to fix — move a class on the{' '}
            <Link href={`/dashboard/schedule?show=${publicId}`} className="font-semibold underline">
              Master Schedule
            </Link>{' '}
            if you&apos;d rather the ring didn&apos;t sit idle.
          </span>
        </div>
      )}

      <div className="fa-stats !mb-0">
        <div className="fa-stat">
          <div className="fa-num">{summary.rides}</div>
          <div className="fa-lab">Rides scheduled</div>
          <div className="fa-sub">
            {plural(summary.riders, 'rider')} · {plural(summary.days.length, 'day')}
          </div>
        </div>
        <div className="fa-stat">
          <div className="fa-num">{summary.rings}</div>
          <div className="fa-lab">Rings</div>
          <div className="fa-sub">
            {summary.ringsWithJudges} of {summary.rings} with judges
          </div>
        </div>
        <div className="fa-stat">
          <div className="fa-num">{summary.classes}</div>
          <div className="fa-lab">Classes</div>
          <div className="fa-sub">with rides on the schedule</div>
        </div>
        <div className="fa-stat">
          <div className="fa-num">{summary.restWaits.length}</div>
          <div className="fa-lab">Rest-gap waits</div>
          <div className="fa-sub">
            {summary.restWaits.length === 0 ? 'no ring had to wait' : 'ring idle so a rider rests'}
          </div>
        </div>
      </div>

      <div className="fa-detail-grid">
        <div className="fa-card">
          <div className="fa-card-head">
            <div>
              <h3>Schedule summary</h3>
              <div className="fa-sub">
                Auto-built from {plural(summary.rides, 'entry', 'entries')} ·{' '}
                {approved ? 'approved and published' : 'draft, not yet approved'}
              </div>
            </div>
            <Link
              href={`/dashboard/schedule?show=${publicId}`}
              prefetch={false}
              className="fa-btn fa-btn-ghost fa-btn-sm"
            >
              Open Master Schedule
            </Link>
          </div>
          {!hasRides ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-[var(--fa-ink-3)]">
              No rides yet — once riders enter, the schedule builds itself here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="fa-table min-w-[620px]">
                <thead>
                  <tr>
                    <th>Ring</th>
                    <th>Judge</th>
                    <th className="fa-num">Rides</th>
                    <th>Window</th>
                    <th className="!text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.days.map((day) => (
                    <DayRows key={day.day} label={day.label}>
                      {day.rings.map((ring) => (
                        <tr key={ring.ring}>
                          <td className="font-semibold !text-[var(--fa-ink)]">{ring.ring}</td>
                          <td>
                            {ring.judges.length > 0 ? (
                              ring.judges.join(', ')
                            ) : (
                              <span className="text-[var(--fa-amber)]">Not assigned</span>
                            )}
                          </td>
                          <td className="fa-num">{ring.rides}</td>
                          <td>{ring.window}</td>
                          <td className="text-right">
                            {ring.judges.length > 0 ? (
                              <span className="fa-badge fa-live">
                                <span className="fa-dot" />
                                Ready
                              </span>
                            ) : (
                              <span className="fa-badge fa-pending">
                                <span className="fa-dot" />
                                Needs judge
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </DayRows>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside>
          <div className="fa-aside-card">
            <h4>Approval checklist</h4>
            <Check
              ok={hasRides}
              title="Entries scheduled"
              sub={hasRides ? `${plural(summary.rides, 'ride')} placed` : 'No rides yet'}
              href={`/dashboard/entries?show=${publicId}`}
              fix="see entries"
            />
            <Check
              ok={judgesOk}
              title="Judges assigned"
              sub={`${String(summary.ringsWithJudges)} of ${plural(summary.rings, 'ring')}`}
              href={`/dashboard/shows/${publicId}#venue`}
              fix="assign judges"
            />
            <Check
              ok={published && ticketClosed}
              title="Ticket sales closed"
              sub={
                ticketClosed ? 'Entries are final' : published ? 'Still selling' : 'Not open yet'
              }
              href={`/dashboard/shows/${publicId}/run-show`}
              fix={published ? 'close sales' : 'open sales'}
            />
            <Check
              ok
              title="No double-bookings"
              sub={
                summary.restWaits.length === 0
                  ? 'Every rider has their rest gap'
                  : `${plural(summary.restWaits.length, 'rest-gap wait')}, resolved automatically`
              }
              href={`/dashboard/schedule?show=${publicId}`}
              fix="open schedule"
            />
            <button
              type="button"
              className="fa-btn fa-btn-primary mt-3.5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              disabled={approved || blocker !== null || approve.isPending}
              onClick={() => {
                approve.mutate(showId);
              }}
            >
              {approved
                ? '✓ Schedule approved'
                : approve.isPending
                  ? 'Approving…'
                  : 'Approve schedule'}
            </button>
            {blocker && (
              <p className="mt-2.5 mb-0 text-center text-[12px] font-semibold text-[var(--fa-amber)]">
                {blocker}
              </p>
            )}
          </div>

          <div className="fa-aside-card">
            <h4>{approved ? 'Approved' : 'When you approve'}</h4>
            <div className="fa-kv">
              <span className="fa-k">{approved ? 'Lifecycle' : 'Lifecycle moves to'}</span>
              <span className="fa-v">{approved ? stageLabel : liveLabel}</span>
            </div>
            <div className="fa-kv">
              <span className="fa-k">Ride times</span>
              <span className="fa-v">
                {approved
                  ? `Published to ${plural(summary.riders, 'rider')}`
                  : hasRides
                    ? `${plural(summary.rides, 'ride')} go to ${plural(summary.riders, 'rider')}`
                    : 'Nothing to publish yet'}
              </span>
            </div>
            <div className="fa-kv">
              <span className="fa-k">Judges &amp; scribes</span>
              <span
                className="fa-v"
                style={officials.total === 0 ? { color: 'var(--fa-amber)' } : undefined}
              >
                {officials.total === 0
                  ? 'None assigned yet'
                  : `${String(officials.withAccess)} of ${String(officials.total)} ${approved ? 'can see' : 'will see'} their rings`}
              </span>
            </div>
            <Link
              href={`/dashboard/documents/print-center?show=${publicId}`}
              prefetch={false}
              className="fa-btn fa-btn-ghost mt-3 w-full justify-center"
            >
              Preview / print schedule
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

function DayRows({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <tr className="!bg-[var(--fa-surface-2)]">
        <td
          colSpan={5}
          className="!py-2 !text-[11px] font-bold tracking-[.07em] !text-[var(--fa-ink-2)] uppercase"
        >
          {label}
        </td>
      </tr>
      {children}
    </>
  );
}

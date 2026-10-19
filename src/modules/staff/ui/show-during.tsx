import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import {
  FA_BTN,
  FA_BTN_PRIMARY,
  FaCard,
  Pill,
  StatBox,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import { OpsAutoRefresh } from '@/modules/operations/ui/ops-auto-refresh';
import type { ShowListItem } from '@/modules/shows/data/queries';
import {
  clockLabel,
  type LiveClassRow,
  type LiveData,
  type LiveRide,
  type LiveRing,
  type ShowCockpit,
} from '@/modules/shows/data/show-cockpit-queries';
import { TodoList } from './todo-list';
import { approvalTone, percent } from './dashboard-format';
import { dateRange } from './show-before';

const CLASS_STATUS: Record<LiveClassRow['status'], { label: string; tone: PillTone }> = {
  results: { label: 'Results out', tone: 'green' },
  done: { label: 'All scored', tone: 'blue' },
  running: { label: 'Running', tone: 'red' },
  next: { label: 'Up next', tone: 'grey' },
};

function pacePill(minutes: number | null) {
  if (minutes === null) return null;
  if (minutes > 5) return <Pill tone="yellow">{`${String(minutes)} min behind`}</Pill>;
  if (minutes < -5) return <Pill tone="blue">{`${String(-minutes)} min ahead`}</Pill>;
  return <Pill tone="green">On time</Pill>;
}

function NextRide({ label, ride }: { label: string; ride: LiveRide | null }) {
  if (!ride) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-semibold text-[#3F4F48]">
        {label}: #{ride.num} · {ride.rider} on {ride.horse}
      </dt>
      <dd className="m-0 font-semibold text-[#0D2C23]">{clockLabel(ride.start)}</dd>
    </div>
  );
}

function RingCard({ ring, showRef }: { ring: LiveRing; showRef: string }) {
  const pct = ring.rideTotal > 0 ? Math.round((ring.rideIndex / ring.rideTotal) * 100) : 0;
  return (
    <FaCard tone={ring.current ? 'live' : 'default'} className="p-[18px_20px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
          {ring.ring}
        </h3>
        {ring.current ? pacePill(ring.paceMinutes) : <Pill tone="green">Done for today</Pill>}
      </div>

      {ring.current ? (
        <>
          <div className="mt-3 rounded-[12px] bg-[#F5F7F6] px-4 py-3">
            <p className="text-[11px] font-extrabold tracking-[.08em] text-[#5A6B63] uppercase">
              In the ring now
            </p>
            <p className="mt-0.5 text-[18px] font-bold text-[#0D2C23]">
              #{ring.current.num} · {ring.current.rider} on {ring.current.horse}
            </p>
            <p className="mt-0.5 flex justify-between gap-3 text-[13px] font-semibold text-[#5A6B63]">
              <span>{ring.classLabel}</span>
              <span>
                ride {ring.rideIndex} of {ring.rideTotal}
              </span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#DCE5E0]">
              <div
                className="h-full rounded-full bg-[#1A5B3C]"
                style={{ width: `${String(pct)}%` }}
              />
            </div>
          </div>
          <dl className="mt-3 grid gap-1.5 text-[14px]">
            <NextRide label="On deck" ride={ring.onDeck} />
            <NextRide label="In the hole" ride={ring.inHole} />
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            {ring.classId && (
              <Link
                href={`/dashboard/scoring/${ring.classId}`}
                prefetch={false}
                className={FA_BTN_PRIMARY}
              >
                Open scoring
              </Link>
            )}
            <Link
              href={`/dashboard/announcing?show=${encodeURIComponent(showRef)}`}
              prefetch={false}
              className={FA_BTN}
            >
              Announcer
            </Link>
          </div>
        </>
      ) : (
        <p className="mt-3 text-[14px] font-semibold text-[#5A6B63]">
          Every ride in this ring today is scored.
        </p>
      )}
    </FaCard>
  );
}

function PctStat({
  label,
  done,
  total,
  note,
}: {
  label: string;
  done: number;
  total: number;
  note: string;
}) {
  const pct = percent(done, total);
  const tone = approvalTone(pct);
  return (
    <div className="rounded-[12px] border-[1.5px] border-[#D9E1DD] bg-white px-4 py-3">
      <span className="block text-[12.5px] font-semibold text-[#5A6B63]">{label}</span>
      <span className={cn('block text-[26px] leading-tight font-bold', tone.text)}>
        {pct === null ? '—' : `${String(pct)}%`}
      </span>
      <span className="block text-[12px] font-semibold text-[#5A6B63]">{note}</span>
    </div>
  );
}

/* The show page while the show is running: what's happening in every ring,
 * today's classes, and what needs handling right now. Refreshes itself. */
export function ShowDuring({
  show,
  cockpit,
  live,
}: {
  show: ShowListItem;
  cockpit: ShowCockpit;
  live: LiveData;
}) {
  const ref = show.slug ?? show.id;
  const { documents } = cockpit;
  const ridesPct = live.ridesTotal > 0 ? Math.round((live.ridesDone / live.ridesTotal) * 100) : 0;
  const finishedClasses = live.schedule.filter(
    (c) => c.status === 'done' || c.status === 'results',
  ).length;
  const classNow = Math.min(finishedClasses + 1, live.classesToday);
  const urgentTodos = cockpit.todos.filter(
    (t) => t.priority === 'urgent' && !live.needsNow.some((n) => n.key === t.key),
  );
  const subline = [dateRange(show.startDate, show.endDate), show.venueName ?? cockpit.detail.venue]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <OpsAutoRefresh />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[18px] bg-[#0D2C23] px-6 py-5 text-white">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#B4432F] px-3 py-1 text-[12.5px] font-extrabold tracking-[.06em] uppercase">
            <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden />
            Live · Day {live.dayIndex + 1} of {live.totalDays}
          </span>
          <h1 className="mt-2 font-[family-name:var(--ws-fraunces)] text-[32px] leading-[1.1] font-bold">
            {show.name}
          </h1>
          {subline && <p className="mt-1 text-[14px] font-semibold text-[#DCE8E1]">{subline}</p>}
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--ws-fraunces)] text-[36px] leading-none font-bold">
            {clockLabel(live.nowMinutes)}
          </p>
          <p className="mt-1 text-[13.5px] font-semibold text-[#DCE8E1]">
            {live.classesToday > 0
              ? `Class ${String(classNow)} of ${String(live.classesToday)} today`
              : 'No classes today'}
            {live.lastRideEnd !== null ? ` · last ride ~${clockLabel(live.lastRideEnd)}` : ''}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-[12px] border-[1.5px] border-[#D9E1DD] bg-white px-4 py-3">
          <span className="block text-[12.5px] font-semibold text-[#5A6B63]">Rides today</span>
          <span className="block text-[26px] leading-tight font-bold text-[#0D2C23]">
            {live.ridesDone} / {live.ridesTotal}
          </span>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#EDF0EE]">
            <span
              className="block h-full rounded-full bg-[#1A5B3C]"
              style={{ width: `${String(ridesPct)}%` }}
            />
          </span>
          <span className="mt-1 block text-[12px] font-semibold text-[#5A6B63]">
            {live.ridesTotal - live.ridesDone} to go
          </span>
        </div>
        <StatBox
          label="Results published"
          value={`${String(live.resultsPublished)} of ${String(live.classesToday)}`}
          note="today's classes"
        />
        <StatBox label="Scratches" value={live.scratches} note="today" />
        <StatBox label="Riders today" value={live.ridersToday} note="riding at least once" />
        <PctStat
          label="Waivers"
          done={documents.waiversSigned}
          total={documents.waiversTotal}
          note={
            live.waiversBlocking > 0
              ? `${String(live.waiversBlocking)} riding today can't ride yet`
              : 'everyone riding today has signed'
          }
        />
        <PctStat
          label="Coggins"
          done={documents.cogginsConfirmed}
          total={documents.cogginsTotal}
          note={
            live.cogginsBlocking > 0
              ? `${String(live.cogginsBlocking)} horses need clearing`
              : 'every horse today is cleared'
          }
        />
      </div>

      {live.rings.length > 0 ? (
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          {live.rings.map((ring) => (
            <RingCard key={ring.ring} ring={ring} showRef={ref} />
          ))}
        </div>
      ) : (
        <FaCard tone="dashed" className="mb-5 text-center text-[15px] font-semibold text-[#5A6B63]">
          Nothing is scheduled in any ring today.
        </FaCard>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FaCard className="p-[20px_22px]">
          <h2 className="mb-2 font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            Today&apos;s schedule
          </h2>
          {live.schedule.length === 0 ? (
            <p className="text-[14px] text-[#5A6B63]">No classes today.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {live.schedule.map((row, i) => {
                const s = CLASS_STATUS[row.status];
                return (
                  <li
                    key={row.classId}
                    className={cn(
                      'grid grid-cols-[72px_70px_1fr_auto] items-center gap-3 py-2.5 text-[14.5px]',
                      i > 0 && 'border-t border-[#EDF0EE]',
                    )}
                  >
                    <span className="font-bold text-[#0D2C23]">{clockLabel(row.start)}</span>
                    <span className="text-[#5A6B63]">{row.ring}</span>
                    <span className="font-semibold text-[#0D2C23]">{row.label}</span>
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={`/dashboard/schedule?show=${encodeURIComponent(ref)}`}
            prefetch={false}
            className={cn(FA_BTN, 'mt-3')}
          >
            Full schedule →
          </Link>
        </FaCard>

        <FaCard className="p-[20px_22px]">
          <h2 className="mb-3 font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            Needs you now
          </h2>
          <TodoList
            todos={[...live.needsNow, ...urgentTodos]}
            limit={5}
            labels={{ urgent: 'Now', soon: 'Today', later: 'Later' }}
          />
        </FaCard>
      </div>
    </div>
  );
}

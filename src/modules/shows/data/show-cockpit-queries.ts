import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getMasterSchedule } from '@/modules/shows/data/setup-queries';
import { getShowTodos } from '@/modules/shows/data/dashboard-todos';
import { COGGINS_LABEL } from '@/modules/shows/constants';
import type { ScheduleRide } from '@/modules/shows/schedule-engine';
import type {
  DashboardTodo,
  ShowDocumentSummary,
  ShowPanelDetail,
  TicketSales,
} from '@/modules/shows/types';

export interface ReadinessItem {
  label: string;
  state: 'done' | 'warn' | 'todo';
  status: string;
}

export interface LiveRide {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  start: number;
}

export interface LiveRing {
  ring: string;
  classId: string | null;
  classLabel: string | null;
  current: LiveRide | null;
  onDeck: LiveRide | null;
  inHole: LiveRide | null;
  rideIndex: number;
  rideTotal: number;
  /** Minutes behind (+) or ahead (−) of schedule; null when not meaningful. */
  paceMinutes: number | null;
}

export interface LiveClassRow {
  classId: string;
  label: string;
  ring: string;
  start: number;
  status: 'results' | 'running' | 'next' | 'done';
}

export interface LiveData {
  dayIndex: number;
  totalDays: number;
  ridesTotal: number;
  ridesDone: number;
  scratches: number;
  ridersToday: number;
  classesToday: number;
  resultsPublished: number;
  lastRideEnd: number | null;
  nowMinutes: number;
  rings: LiveRing[];
  schedule: LiveClassRow[];
  needsNow: DashboardTodo[];
  waiversBlocking: number;
  cogginsBlocking: number;
}

export interface ShowCockpit {
  todos: DashboardTodo[];
  documents: ShowDocumentSummary;
  entries: number;
  revenue: number;
  tickets: TicketSales;
  detail: ShowPanelDetail;
  newOrdersThisWeek: number;
  readiness: ReadinessItem[];
  live: LiveData | null;
}

const plural = (n: number, word: string) => `${String(n)} ${word}${n === 1 ? '' : 's'}`;

function minutesNowInZone(timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

const dayDiff = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export function clockLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12)}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/* Everything the show page needs, before and during the show. */
export async function getShowCockpit(
  show: { id: string; slug: string | null; startDate: string | null; endDate: string | null },
  todayIso: string,
  daysOut: number | null,
): Promise<ShowCockpit> {
  const supabase = await createServerClient();
  const ref = show.slug ?? show.id;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [base, { data: showRow }, { data: judges }, { count: newOrders }] = await Promise.all([
    getShowTodos(show, daysOut),
    supabase
      .from('shows')
      .select(
        'published, waiver_text, waiver_approved_text, runner_state, timezone, document_requirements',
      )
      .eq('id', show.id)
      .maybeSingle(),
    supabase.from('staff_assignments').select('status').eq('show_id', show.id).eq('role', 'Judge'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', show.id)
      .eq('status', 'paid')
      .gte('paid_at', weekAgo),
  ]);

  const { detail, documents, tickets } = base;
  const classIds = detail.tests.map((t) => t.id);
  const [{ data: classTests }, { data: classCatalog }, { data: catalogTitles }] = await Promise.all(
    [
      classIds.length
        ? supabase.from('class_tests').select('class_id').in('class_id', classIds)
        : Promise.resolve({ data: [] as { class_id: string }[] }),
      classIds.length
        ? supabase.from('classes').select('id, label, catalog_id').in('id', classIds)
        : Promise.resolve({
            data: [] as { id: string; label: string; catalog_id: string | null }[],
          }),
      supabase.from('scoring_catalog').select('title'),
    ],
  );
  const titles = new Set((catalogTitles ?? []).map((t) => t.title.trim().toLowerCase()));
  const withTest = new Set((classTests ?? []).map((t) => t.class_id));
  const testsReady = (classCatalog ?? []).filter(
    (c) => withTest.has(c.id) || !!c.catalog_id || titles.has(c.label.trim().toLowerCase()),
  ).length;

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);
  const waiverPct = pct(documents.waiversSigned, documents.waiversTotal);
  const cogginsPct = pct(documents.cogginsConfirmed, documents.cogginsTotal);
  const judgeRows = judges ?? [];
  const judgesAccepted = judgeRows.filter((j) => j.status === 'accepted').length;
  const approved = !!(showRow?.runner_state as { approved?: boolean } | null)?.approved;
  const waiverOk = !!showRow?.waiver_text && showRow.waiver_approved_text === showRow.waiver_text;
  const booked = detail.vendors.paid + detail.vendors.approvedUnpaid;

  const readiness: ReadinessItem[] = [
    {
      label: 'Show published',
      state: showRow?.published ? 'done' : 'todo',
      status: showRow?.published ? 'Done' : 'Not yet',
    },
    {
      label: 'Waiver approved',
      state: waiverOk ? 'done' : 'todo',
      status: waiverOk ? 'Done' : 'Not yet',
    },
    {
      label: 'Classes and rings set',
      state: detail.tests.length > 0 && detail.rings > 0 ? 'done' : 'todo',
      status: `${plural(detail.tests.length, 'test')} · ${plural(detail.rings, 'ring')}`,
    },
    {
      label: 'Ticket sales',
      state: tickets.state === 'not-open' ? 'warn' : 'done',
      status:
        tickets.state === 'open'
          ? tickets.days === null
            ? 'Open'
            : `Open · ${plural(tickets.days, 'day')} left`
          : tickets.state === 'closed'
            ? 'Closed'
            : 'Not open yet',
    },
    {
      label: 'Coggins 90%+ approved',
      state:
        cogginsPct === null ? 'warn' : cogginsPct > 90 ? 'done' : cogginsPct > 50 ? 'warn' : 'todo',
      status: cogginsPct === null ? 'No entries yet' : `${String(cogginsPct)}%`,
    },
    {
      label: 'Waivers 90%+ signed',
      state:
        waiverPct === null ? 'warn' : waiverPct > 90 ? 'done' : waiverPct > 50 ? 'warn' : 'todo',
      status: waiverPct === null ? 'No entries yet' : `${String(waiverPct)}%`,
    },
    {
      label: 'Vendor applications reviewed',
      state: detail.vendors.pending === 0 ? 'done' : 'warn',
      status:
        detail.vendors.pending === 0
          ? detail.vendors.spaces !== null
            ? `${String(booked)} of ${String(detail.vendors.spaces)} booths`
            : 'All reviewed'
          : `${String(detail.vendors.pending)} to review`,
    },
    {
      label: 'Schedule approved',
      state: approved ? 'done' : 'todo',
      status: approved ? 'Done' : 'Not yet',
    },
    {
      label: 'Judges assigned and accepted',
      state:
        judgeRows.length > 0 && judgesAccepted === judgeRows.length
          ? 'done'
          : judgesAccepted > 0
            ? 'warn'
            : 'todo',
      status:
        judgeRows.length === 0
          ? 'None assigned'
          : `${String(judgesAccepted)} of ${String(judgeRows.length)} accepted`,
    },
    {
      label: 'Every test has a score sheet',
      state: detail.tests.length > 0 && testsReady === detail.tests.length ? 'done' : 'todo',
      status: `${String(testsReady)} of ${String(detail.tests.length)}`,
    },
  ];

  const start = show.startDate;
  const end = show.endDate ?? show.startDate;
  const isLive = !!start && !!end && start <= todayIso && todayIso <= end;
  const live = isLive
    ? await getLiveData(
        show.id,
        ref,
        start,
        end,
        todayIso,
        showRow?.timezone ?? 'America/New_York',
        showRow?.document_requirements,
      )
    : null;

  return { ...base, newOrdersThisWeek: newOrders ?? 0, readiness, live };
}

async function getLiveData(
  showId: string,
  ref: string,
  start: string,
  end: string,
  todayIso: string,
  timeZone: string,
  requirements: unknown,
): Promise<LiveData> {
  const supabase = await createServerClient();
  const dayIndex = dayDiff(start, todayIso);
  const totalDays = dayDiff(start, end) + 1;
  const nowMinutes = minutesNowInZone(timeZone);
  const schedule = await getMasterSchedule(showId);

  const today = (schedule?.schedule.arenas ?? []).flatMap((arena) =>
    arena.items
      .filter((it): it is ScheduleRide => it.type === 'ride' && it.day === dayIndex)
      .map((ride) => ({ ride, ring: arena.ring })),
  );
  const classIds = [...new Set(today.map(({ ride }) => ride.cls))];
  const [{ data: entryRows }, { data: classRows }] = await Promise.all([
    classIds.length
      ? supabase
          .from('class_entries')
          .select('id, status, finalized_at, rider_id, horse_id')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] as never[] }),
    classIds.length
      ? supabase.from('classes').select('id, label, results_published').in('id', classIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const entry = new Map((entryRows ?? []).map((e) => [e.id, e]));
  const isDone = (entryId: string) => {
    const e = entry.get(entryId);
    return !!e && (e.status === 'scored' || !!e.finalized_at);
  };
  const active = today.filter(({ ride }) => ride.status !== 'scratched');
  const classInfo = new Map((classRows ?? []).map((c) => [c.id, c]));

  // Rings: current ride is the first unfinished one in schedule order.
  const ringNames = [...new Set(today.map((t) => t.ring))].sort();
  const toLive = (r: ScheduleRide | undefined): LiveRide | null =>
    r ? { entryId: r.entryId, num: r.num, rider: r.name, horse: r.horse, start: r.start } : null;
  const rings: LiveRing[] = ringNames.map((ring) => {
    const rides = active
      .filter((t) => t.ring === ring)
      .map((t) => t.ride)
      .sort((a, b) => a.start - b.start);
    const idx = rides.findIndex((r) => !isDone(r.entryId));
    const current = idx >= 0 ? rides[idx] : undefined;
    const classRides = current ? rides.filter((r) => r.cls === current.cls) : [];
    const pace = current ? nowMinutes - current.start : null;
    return {
      ring,
      classId: current?.cls ?? null,
      classLabel: current ? (classInfo.get(current.cls)?.label ?? current.label) : null,
      current: toLive(current),
      onDeck: idx >= 0 ? toLive(rides[idx + 1]) : null,
      inHole: idx >= 0 ? toLive(rides[idx + 2]) : null,
      rideIndex: current ? classRides.findIndex((r) => r.entryId === current.entryId) + 1 : 0,
      rideTotal: classRides.length,
      paceMinutes: pace !== null && Math.abs(pace) <= 180 ? pace : null,
    };
  });

  // Today's classes in time order, with where each one stands.
  const byClass = new Map<string, { ring: string; start: number; rides: ScheduleRide[] }>();
  for (const { ride, ring } of active) {
    const c = byClass.get(ride.cls) ?? { ring, start: ride.start, rides: [] };
    c.start = Math.min(c.start, ride.start);
    c.rides.push(ride);
    byClass.set(ride.cls, c);
  }
  const scheduleRows: LiveClassRow[] = [...byClass.entries()]
    .map(([classId, c]) => {
      const done = c.rides.filter((r) => isDone(r.entryId)).length;
      const published = !!classInfo.get(classId)?.results_published;
      const status: LiveClassRow['status'] = published
        ? 'results'
        : done === c.rides.length
          ? 'done'
          : done > 0 || rings.some((r) => r.classId === classId)
            ? 'running'
            : 'next';
      return {
        classId,
        label: classInfo.get(classId)?.label ?? c.rides[0]?.label ?? '',
        ring: c.ring,
        start: c.start,
        status,
      };
    })
    .sort((a, b) => a.start - b.start || a.ring.localeCompare(b.ring));

  // Who's riding today without a signed waiver or a cleared Coggins.
  const riderIds = [
    ...new Set(active.map(({ ride }) => entry.get(ride.entryId)?.rider_id).filter(Boolean)),
  ] as string[];
  const horseIds = [
    ...new Set(active.map(({ ride }) => entry.get(ride.entryId)?.horse_id).filter(Boolean)),
  ] as string[];
  const cogginsReq = (
    Array.isArray(requirements) ? (requirements as { id?: string; label?: string }[]) : []
  ).find((r) => (r.label ?? '').trim().toLowerCase() === COGGINS_LABEL.toLowerCase());
  const [{ data: signed }, { data: horses }] = await Promise.all([
    riderIds.length
      ? supabase
          .from('waiver_signatures')
          .select('rider_id')
          .eq('show_id', showId)
          .in('rider_id', riderIds)
      : Promise.resolve({ data: [] as { rider_id: string }[] }),
    horseIds.length && cogginsReq?.id
      ? supabase.from('horses').select('id, document_uploads').in('id', horseIds)
      : Promise.resolve({ data: [] as { id: string; document_uploads: unknown }[] }),
  ]);
  const signedSet = new Set((signed ?? []).map((s) => s.rider_id));
  const unsignedRides = active
    .filter(({ ride }) => !isDone(ride.entryId))
    .filter(({ ride }) => {
      const rid = entry.get(ride.entryId)?.rider_id;
      return !!rid && !signedSet.has(rid);
    })
    .sort((a, b) => a.ride.start - b.ride.start);
  const waiversBlocking = new Set(
    unsignedRides.map(({ ride }) => entry.get(ride.entryId)?.rider_id),
  ).size;
  const cogginsBad = (horses ?? []).filter((h) => {
    const up = (
      Array.isArray(h.document_uploads) ? (h.document_uploads as Record<string, unknown>[]) : []
    ).find((u) => u.requirementId === cogginsReq?.id);
    if (!up) return true;
    const status = typeof up.status === 'string' ? up.status : up.verified ? 'approved' : 'pending';
    const exp = typeof up.expirationDate === 'string' ? up.expirationDate : null;
    return status !== 'approved' || (exp !== null && exp < todayIso);
  }).length;

  const needsNow: DashboardTodo[] = [];
  const next = unsignedRides[0];
  if (next) {
    const mins = next.ride.start - nowMinutes;
    needsNow.push({
      key: 'next-unsigned',
      priority: 'urgent',
      label:
        mins >= 0 && mins <= 120
          ? `#${next.ride.num} rides in ${String(mins)} min — no waiver`
          : `#${next.ride.num} rides at ${clockLabel(next.ride.start)} — no waiver`,
      detail: `${next.ride.name} can't ride until they sign.`,
      actionLabel: 'See riders',
      href: `/dashboard/riders?show=${ref}`,
    });
  }
  if (waiversBlocking > 1) {
    needsNow.push({
      key: 'unsigned-today',
      priority: 'urgent',
      label: `${String(waiversBlocking)} riders riding today haven't signed the waiver`,
      detail: 'They can’t ride until they sign.',
      actionLabel: 'See who',
      href: `/dashboard/riders?show=${ref}`,
    });
  }
  if (cogginsBad > 0) {
    needsNow.push({
      key: 'coggins-today',
      priority: 'urgent',
      label: `${plural(cogginsBad, 'horse')} riding today without a cleared Coggins`,
      detail: 'Hold at the gate until a current, approved test is on file.',
      actionLabel: 'See horses',
      href: `/dashboard/horses?show=${ref}`,
    });
  }
  for (const row of scheduleRows.filter((r) => r.status === 'done')) {
    needsNow.push({
      key: `publish-${row.classId}`,
      priority: 'soon',
      label: `Publish ${row.label} results`,
      detail: 'Every ride is scored.',
      actionLabel: 'Open results',
      href: `/dashboard/scoring/${row.classId}`,
    });
  }

  return {
    dayIndex,
    totalDays,
    ridesTotal: active.length,
    ridesDone: active.filter(({ ride }) => isDone(ride.entryId)).length,
    scratches: today.length - active.length,
    ridersToday: riderIds.length,
    classesToday: byClass.size,
    resultsPublished: scheduleRows.filter((r) => r.status === 'results').length,
    lastRideEnd: active.length ? Math.max(...active.map(({ ride }) => ride.end)) : null,
    nowMinutes,
    rings,
    schedule: scheduleRows,
    needsNow,
    waiversBlocking,
    cogginsBlocking: cogginsBad,
  };
}

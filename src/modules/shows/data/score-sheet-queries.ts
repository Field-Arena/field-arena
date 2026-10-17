import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getMasterSchedule } from '@/modules/shows/data/setup-queries';
import { dayDate } from '@/modules/shows/utils/day-date';
import type { ScheduleRide } from '@/modules/shows/schedule-engine';

export interface SheetMovement {
  num: number | null;
  text: string;
  coef: number;
}

export interface SheetTest {
  title: string;
  /** "Training Level" — the level part of the title. */
  testName: string;
  /** "Test 1 · USEF" — the number part plus the governing body / edition. */
  testNumber: string | null;
  movements: SheetMovement[];
  collectives: { label: string; coef: number }[];
  maxPoints: number | null;
  arena: string | null;
  rideTime: string | null;
}

/** One printed page: the rider sticker plus the blank test underneath. */
export interface ScoreSheet {
  entryId: string;
  entryNumber: string;
  rider: string;
  horse: string;
  dateLabel: string;
  ring: string;
  rideTime: string;
  classLabel: string;
  test: SheetTest | null;
}

export interface ScoreSheetPack {
  showName: string;
  scopeLabel: string;
  sheets: ScoreSheet[];
}

type Json = Record<string, unknown>;
const asArray = (v: unknown): Json[] =>
  Array.isArray(v) ? v.filter((x): x is Json => !!x && typeof x === 'object') : [];
const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/* Day index → "Sat Nov 7, 2026" (short enough to sit on one line). */
function shortDay(startDate: string | null, day: number): string {
  if (!startDate) return `Day ${String(day + 1)}`;
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + day);
  const wd = date.toLocaleDateString('en-US', { weekday: 'short' });
  const md = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${wd} ${md}`;
}

function clockLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12)}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/* "Training Level Test 1" → ["Training Level", "Test 1"]. */
function splitTitle(title: string): [string, string] {
  const match = /^(.*?)\s*(Test\s+\S+.*)$/i.exec(title.trim());
  // Strip the dash some catalog titles use: "Introductory Level – Test B".
  return match ? [(match[1] ?? title).replace(/[\s–—-]+$/, ''), match[2] ?? ''] : [title, ''];
}

function buildTest(
  title: string,
  body: string | null,
  movementsRaw: unknown,
  collectivesRaw: unknown,
  extra: { maxPoints?: unknown; arena?: unknown; rideTime?: unknown } = {},
): SheetTest {
  const [testName, testNumber] = splitTitle(title);
  return {
    title,
    testName,
    testNumber: [testNumber, body].filter(Boolean).join(' · ') || null,
    movements: asArray(movementsRaw).map((m, i) => ({
      num: typeof m.num === 'number' ? m.num : typeof m.n === 'number' ? m.n : i + 1,
      text: str(m.text),
      coef: num(m.coef, 1),
    })),
    collectives: asArray(collectivesRaw).map((c) => ({
      label: str(c.label).replace(/’S|'S/g, "'s"),
      coef: num(c.coef, 1),
    })),
    maxPoints: typeof extra.maxPoints === 'number' ? extra.maxPoints : null,
    arena: str(extra.arena) || null,
    rideTime: str(extra.rideTime) || null,
  };
}

/* Blank score sheets for a show, in the order the schedule runs them:
 * day → ring → ride time. Scratched rides are left out. Scope to one class
 * (a test's Print button) or one day (the master Print button), or neither. */
export async function getScoreSheets(
  showId: string,
  scope: { classId?: string | null; day?: number | null },
): Promise<ScoreSheetPack | null> {
  const schedule = await getMasterSchedule(showId);
  if (!schedule) return null;

  const rides = schedule.schedule.arenas
    .flatMap((arena) =>
      arena.items
        .filter((it): it is ScheduleRide => it.type === 'ride')
        .map((ride) => ({ ride, ring: arena.ring })),
    )
    .filter(({ ride }) => ride.status !== 'scratched')
    .filter(({ ride }) => !scope.classId || ride.cls === scope.classId)
    .filter(({ ride }) => scope.day == null || ride.day === scope.day)
    .sort(
      (a, b) =>
        a.ride.day - b.ride.day || a.ring.localeCompare(b.ring) || a.ride.start - b.ride.start,
    );

  const classIds = [...new Set(rides.map(({ ride }) => ride.cls))];
  const supabase = await createServerClient();

  const [{ data: tests }, { data: classes }] = await Promise.all([
    classIds.length
      ? supabase
          .from('class_tests')
          .select('class_id, name, edition, movements, collectives')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] as never[] }),
    classIds.length
      ? supabase.from('classes').select('id, label, catalog_id').in('id', classIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const testByClass = new Map<string, SheetTest>();
  for (const t of tests ?? []) {
    testByClass.set(t.class_id, buildTest(t.name, t.edition, t.movements, t.collectives));
  }

  // Classes without a test of their own fall back to the official catalog:
  // by the linked catalog entry, else by the class label matching a title.
  const missing = (classes ?? []).filter((c) => !testByClass.has(c.id));
  if (missing.length > 0) {
    const { data: catalog } = await supabase
      .from('scoring_catalog')
      .select('id, title, governing_body, def');
    for (const c of missing) {
      const label = c.label.trim().toLowerCase();
      const entry =
        (catalog ?? []).find((e) => e.id === c.catalog_id) ??
        (catalog ?? []).find((e) => e.title.trim().toLowerCase() === label) ??
        (catalog ?? []).find((e) => label.includes(e.title.trim().toLowerCase()));
      if (!entry) continue;
      const def = (entry.def ?? {}) as Json;
      testByClass.set(
        c.id,
        buildTest(entry.title, entry.governing_body, def.movements, def.collectives, {
          maxPoints: def.maxPoints,
          arena: def.arena,
          rideTime: def.rideTime,
        }),
      );
    }
  }

  const classLabel = new Map((classes ?? []).map((c) => [c.id, c.label]));
  const sheets: ScoreSheet[] = rides.map(({ ride, ring }) => ({
    entryId: ride.entryId,
    entryNumber: ride.num,
    rider: ride.name,
    horse: ride.horse,
    dateLabel: shortDay(schedule.startDate, ride.day),
    ring,
    rideTime: clockLabel(ride.start),
    classLabel: classLabel.get(ride.cls) ?? ride.label,
    test: testByClass.get(ride.cls) ?? null,
  }));

  const firstClass = scope.classId ? classLabel.get(scope.classId) : null;
  const scopeLabel =
    firstClass ??
    (scope.day != null
      ? `Day ${String(scope.day + 1)} — ${dayDate(schedule.startDate, scope.day)}`
      : 'All days');

  return { showName: schedule.showName, scopeLabel, sheets };
}

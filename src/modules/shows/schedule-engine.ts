/**
 * The master-schedule builder, ported from showstaff.html's
 * buildMasterSchedule / assignRings / extraBreaksFor.
 *
 * Pure on purpose: it takes classes, entries, rings and rules and returns
 * arenas of timed items. Nothing here reads Supabase or the DOM, so the rules
 * below — which are the part a wrong schedule shows up in as real people
 * double-booked at a real show — can be reasoned about and tested on their own.
 *
 * The scheduling rules it implements, in the legacy's own order of priority:
 *
 *  1. A class pinned to a day never lands on another day, not even as a last
 *     resort.
 *  2. A rider never rides twice inside the required gap — 30 minutes on the
 *     same horse, 55 on a different one. This is the hard rule: it is never
 *     violated, and the schedule runs longer instead.
 *  3. Rings stay compact. A conflict is first resolved by reordering the ring's
 *     own queue; waiting idle is the last resort.
 *  4. Breaks happen at the same moment in every ring. Each ring runs to a real
 *     ride boundary within a tolerance window, then all of them pause together.
 *  5. Nothing is atomic below one ride, so a break may fall inside a class and
 *     the class picks up afterwards.
 */

export interface ScheduleRules {
  /** Minutes of riding per ride. */
  perMin: number;
  /** Minutes between rides. */
  buffer: number;
  /** Extra minutes per ride for upper-level classes (Third, Fourth, FEI). */
  upper: number;
  /** Latest finish, 'HH:MM'. Overridden per day by dayEndTimes. */
  end: string;
  /** Which end of the level range runs first. */
  order: 'low' | 'high';
  /** 'yes' reserves the last ring for warm-up, so nothing schedules into it. */
  warmup: 'yes' | 'no';
  lunch: boolean;
  lunchAt: string;
  lunchDur: number;
  extraBreaks: number;
  extraBreakMin: number;
  /** One entry per show day; '' means "use the ring's own start". */
  dayStartTimes: string[];
  dayEndTimes: string[];
  /** Both default to the legacy's 30/55 when absent. */
  hardRuleEnabled?: boolean;
  hardRuleSameHorseMin?: number;
  hardRuleDiffHorseMin?: number;
}

export interface RingConfig {
  name: string;
  size: 'standard' | 'small';
  /** 'HH:MM'. This ring's own first-ride time. */
  start: string;
}

export interface ScheduleEntry {
  /** class_entries.id — what scratch and reorder act on. */
  entryId: string;
  num: string;
  name: string;
  horse: string;
  /** The real horses.id where one exists — see horseKey for why it is preferred. */
  horseId: string | null;
  division: string;
  quals: string[];
  status: string;
}

export interface ScheduleClass {
  /** The class's stable key — its id. */
  cls: string;
  label: string;
  /** Third Level / Fourth Level / FEI get the upper-level ride time. */
  discipline: string;
  /** Ring name this class is pinned to, or null to auto-balance. */
  ring: string | null;
  /** Day index this class is pinned to, or null. */
  pinnedDay: number | null;
  /** Per-class ride-time override in minutes, or null for the rules' value. */
  minPerRide: number | null;
  order: ScheduleEntry[];
}

export interface ScheduleRide {
  type: 'ride';
  /** The class's id. */
  cls: string;
  entryId: string;
  label: string;
  num: string;
  name: string;
  horse: string;
  division: string;
  quals: string[];
  qualifying: boolean;
  day: number;
  /** Minutes from midnight. */
  start: number;
  end: number;
  status: string;
}

export interface ScheduleBreak {
  type: 'lunch' | 'break';
  label: string;
  day: number;
  start: number;
  end: number;
}

export type ScheduleItem = ScheduleRide | ScheduleBreak;

export interface Arena {
  ring: string;
  ringSize: 'standard' | 'small';
  items: ScheduleItem[];
}

export interface ConflictDetail {
  riderNum: string;
  riderName: string;
  horse: string;
  classA: string;
  ringA: string;
  classB: string;
  ringB: string;
}

export interface MasterSchedule {
  arenas: Arena[];
  /** Set when the class list is implausibly large — see RIDE_CEILING. */
  tooLarge: number | null;
  conflictsAvoided: number;
  conflictsWaited: number;
  conflicts: { avoided: ConflictDetail[]; waited: ConflictDetail[] };
}

/**
 * A real show never legitimately reaches this many rides — even a large
 * multi-day rated show tops out in the low hundreds. The legacy build added
 * this ceiling after a show whose class list had ballooned to hundreds of
 * duplicated classes crashed the browser tab: the conflict search is O(rides)
 * per ride with up to 200 retries each, across up to 60 day-building passes.
 * Returning an empty-but-valid schedule is a visible, safe degradation.
 */
const RIDE_CEILING = 2000;

const DEFAULT_SAME_HORSE_GAP = 30;
const DEFAULT_DIFF_HORSE_GAP = 55;

/** 'HH:MM' → minutes from midnight. */
export function toMin(time: string): number {
  const [h = 0, m = 0] = (time || '0:0').split(':').map(Number);
  return h * 60 + m;
}

/** Minutes from midnight → '9:05 AM'. */
export function fmtTime(min: number): string {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${String(hh)}:${String(m).padStart(2, '0')} ${suffix}`;
}

const LEVEL_RANK: Record<string, number> = {
  Introductory: 0,
  'Training Level': 1,
  'First Level': 2,
  'Second Level': 3,
  'Third Level': 4,
  'Fourth Level': 5,
  FEI: 6,
};

function levelRank(discipline: string): number {
  return discipline in LEVEL_RANK ? (LEVEL_RANK[discipline] ?? 99) : 99;
}

function isUpperLevel(discipline: string): boolean {
  return discipline === 'Third Level' || discipline === 'Fourth Level' || discipline === 'FEI';
}

/** Minutes one ride of this class takes, including the between-rides buffer. */
export function stepMinutesForClass(cls: ScheduleClass, rules: ScheduleRules): number {
  if (cls.minPerRide != null) return cls.minPerRide + rules.buffer;
  return rules.perMin + rules.buffer + (isUpperLevel(cls.discipline) ? rules.upper : 0);
}

/**
 * The rings classes may actually be scheduled into.
 *
 * With warm-up on, the last ring is reserved and gets no classes — so it also
 * gets no arena, which is what stops anything being placed there.
 */
export function competitionRings(rings: RingConfig[], rules: ScheduleRules): RingConfig[] {
  if (rules.warmup === 'yes' && rings.length > 1) return rings.slice(0, -1);
  return rings;
}

/**
 * Distributes classes across rings by total time.
 *
 * A class with an explicit ring goes there regardless of balance; everything
 * else lands in whichever ring currently has the least time booked.
 */
function assignRings(
  classes: ScheduleClass[],
  rules: ScheduleRules,
  rings: RingConfig[]
): ScheduleClass[][] {
  const count = Math.max(1, rings.length);
  const ringIndexByName = new Map(rings.map((ring, i) => [ring.name, i]));

  const ordered = [...classes].sort((a, b) =>
    rules.order === 'high'
      ? levelRank(b.discipline) - levelRank(a.discipline)
      : levelRank(a.discipline) - levelRank(b.discipline)
  );

  const buckets = Array.from({ length: count }, () => ({ mins: 0, classes: [] as ScheduleClass[] }));

  for (const cls of ordered) {
    const mins = cls.order.length * stepMinutesForClass(cls, rules);
    const pinned = cls.ring ? ringIndexByName.get(cls.ring) : undefined;

    let index = pinned ?? 0;
    if (pinned == null) {
      for (let i = 1; i < count; i++) {
        if ((buckets[i]?.mins ?? 0) < (buckets[index]?.mins ?? 0)) index = i;
      }
    }

    const bucket = buckets[index];
    if (!bucket) continue;
    bucket.classes.push(cls);
    bucket.mins += mins;
  }

  return buckets.map((b) => b.classes);
}

interface PlannedBreak {
  type: 'lunch' | 'break';
  label: string;
  at: number;
  dur: number;
  /** How far past its target time it may drift to reach a ride boundary. */
  tol: number;
}

/**
 * The short breaks beyond lunch, spread across the day.
 *
 * Split between morning and afternoon in proportion to how long each half of
 * the day is, then evenly spaced inside each half — the legacy's own
 * arrangement, so an organizer who set "2 extra breaks" gets one either side of
 * lunch on a normal day rather than both crammed into the morning.
 */
function extraBreaksFor(rules: ScheduleRules, rings: RingConfig[]): PlannedBreak[] {
  const n = rules.extraBreaks || 0;
  if (n <= 0) return [];

  const dur = rules.extraBreakMin || 10;
  const dayStart = rings.reduce(
    (min, ring) => Math.min(min, toMin(ring.start)),
    toMin(rings[0]?.start ?? '08:00')
  );
  const dayEnd = toMin(rules.end);

  const lunchStart = rules.lunch ? toMin(rules.lunchAt) : null;
  const lunchEnd = lunchStart == null ? null : lunchStart + rules.lunchDur;

  const morningLen = lunchStart == null ? dayEnd - dayStart : Math.max(0, lunchStart - dayStart);
  const afternoonLen = lunchEnd == null ? 0 : Math.max(0, dayEnd - lunchEnd);
  const totalLen = Math.max(1, morningLen + afternoonLen);

  let nMorning = lunchStart == null ? n : Math.round((n * morningLen) / totalLen);
  nMorning = Math.max(0, Math.min(n, nMorning));
  const nAfternoon = n - nMorning;

  const out: PlannedBreak[] = [];
  const place = (count: number, from: number, to: number) => {
    for (let i = 1; i <= count; i++) {
      out.push({
        type: 'break',
        label: 'Break',
        at: Math.round(from + ((to - from) * i) / (count + 1)),
        dur,
        tol: 5,
      });
    }
  };

  place(nMorning, dayStart, lunchStart ?? dayEnd);
  if (lunchEnd != null) place(nAfternoon, lunchEnd, dayEnd);

  return out;
}

/**
 * Identity used for the same-horse gap.
 *
 * The real horses.id wins over the free-text name: two different horses can
 * share a name, and treating that as "same horse" would apply the shorter gap
 * and double-book a rider. Only entries with no id at all — organizer-seeded or
 * moved — fall back to the name.
 */
function horseKey(horseId: string | null, horseName: string): string | null {
  if (horseId) return `id:${horseId}`;
  return horseName ? `name:${horseName}` : null;
}

interface RiderWindow {
  ring: number;
  day: number;
  start: number;
  end: number;
  cls: string;
  label: string;
  horse: string | null;
}

export function buildMasterSchedule(
  classes: ScheduleClass[],
  rules: ScheduleRules,
  allRings: RingConfig[]
): MasterSchedule {
  const rings = competitionRings(allRings, rules);
  const usableRings = rings.length > 0 ? rings : [{ name: 'Ring 1', size: 'standard' as const, start: '08:00' }];
  const buckets = assignRings(classes, rules, usableRings);

  interface QueuedRide {
    cls: string;
    entryId: string;
    label: string;
    num: string;
    name: string;
    horse: string;
    horseId: string | null;
    division: string;
    quals: string[];
    pinnedDay: number | null;
    status: string;
    step: number;
  }

  const arenas = usableRings.map((ring, i) => {
    const queue: QueuedRide[] = [];
    for (const cls of buckets[i] ?? []) {
      const step = stepMinutesForClass(cls, rules);
      for (const entry of cls.order) {
        queue.push({
          cls: cls.cls,
          entryId: entry.entryId,
          label: cls.label,
          num: entry.num,
          name: entry.name,
          horse: entry.horse,
          horseId: entry.horseId,
          division: entry.division || 'O',
          quals: entry.quals,
          pinnedDay: cls.pinnedDay,
          status: entry.status,
          step,
        });
      }
    }
    return {
      ring: ring.name,
      ringSize: ring.size,
      ringStart: toMin(ring.start),
      queue,
      items: [] as ScheduleItem[],
    };
  });

  const totalRides = arenas.reduce((n, a) => n + a.queue.length, 0);
  if (totalRides > RIDE_CEILING) {
    return {
      arenas: arenas.map((a) => ({ ring: a.ring, ringSize: a.ringSize, items: [] })),
      tooLarge: totalRides,
      conflictsAvoided: 0,
      conflictsWaited: 0,
      conflicts: { avoided: [], waited: [] },
    };
  }

  const riderWindows = new Map<string, RiderWindow[]>();
  let conflictsAvoided = 0;
  let conflictsWaited = 0;
  const conflicts: { avoided: ConflictDetail[]; waited: ConflictDetail[] } = {
    avoided: [],
    waited: [],
  };

  const gapFor = (a: string | null, b: string | null) =>
    a && b && a === b
      ? (rules.hardRuleSameHorseMin ?? DEFAULT_SAME_HORSE_GAP)
      : (rules.hardRuleDiffHorseMin ?? DEFAULT_DIFF_HORSE_GAP);

  /**
   * The window this ride would collide with, or null.
   *
   * Day-scoped because start/end are minutes-of-day, not a continuous
   * timeline — a rider's Day 1 ride has no bearing on a Day 2 one.
   */
  function conflictWindow(
    num: string,
    horse: string | null,
    day: number,
    start: number,
    end: number
  ): RiderWindow | null {
    if (rules.hardRuleEnabled === false) return null;
    const windows = riderWindows.get(num);
    if (!windows) return null;

    return (
      windows.find((w) => {
        const gap = gapFor(horse, w.horse);
        return w.day === day && !(end + gap <= w.start || w.end + gap <= start);
      }) ?? null
    );
  }

  /** The earliest start at or after `floor` with no remaining conflict. */
  function earliestSafeStart(
    num: string,
    horse: string | null,
    day: number,
    floor: number,
    dur: number
  ): number {
    let start = floor;
    for (let guard = 0; guard < 200; guard++) {
      const win = conflictWindow(num, horse, day, start, start + dur);
      if (!win) return start;
      start = Math.max(start + 1, win.end + gapFor(horse, win.horse));
    }
    // A pathological pileup of 200 overlapping windows — best effort past here.
    return start;
  }

  const dayBreaks: PlannedBreak[] = [];
  if (rules.lunch) {
    dayBreaks.push({
      type: 'lunch',
      label: 'Lunch Break',
      at: toMin(rules.lunchAt),
      dur: rules.lunchDur,
      tol: 10,
    });
  }
  dayBreaks.push(...extraBreaksFor(rules, usableRings));
  dayBreaks.sort((a, b) => a.at - b.at);

  const anyLeft = () => arenas.some((a) => a.queue.length > 0);
  let day = 0;
  let guard = 0;

  while (anyLeft() && guard++ < 60) {
    const clocks = arenas.map((a) => {
      const override = rules.dayStartTimes[day];
      return override ? toMin(override) : a.ringStart;
    });
    const dayEndOverride = rules.dayEndTimes[day];
    const end = dayEndOverride ? toMin(dayEndOverride) : toMin(rules.end);

    /**
     * Places rides in one ring until nothing more fits.
     *
     * `cap` is a break's tolerance window — a capped call stops at a real ride
     * boundary rather than running a ride into break time. The uncapped
     * "finish out the day" pass may run past `end` when the hard rule forces a
     * wait, which is exactly what the rule allows.
     */
    function fill(i: number, cap: number | null): void {
      const arena = arenas[i];
      if (!arena) return;

      let madeProgress = true;
      while (arena.queue.length > 0 && madeProgress) {
        madeProgress = false;
        let stalled = 0;

        while (arena.queue.length > 0 && stalled < arena.queue.length) {
          const ride = arena.queue[0];
          if (!ride) break;

          // A day pin is harder than everything below it — rotate and let
          // something else have today's slot.
          if (ride.pinnedDay != null && ride.pinnedDay !== day) {
            arena.queue.push(ride);
            arena.queue.shift();
            stalled++;
            continue;
          }

          const clock = clocks[i] ?? 0;
          if (cap != null && clock + ride.step > cap) return;
          if (clock + ride.step > end) return; // rolls to the next day

          const horse = horseKey(ride.horseId, ride.horse);
          const win = conflictWindow(ride.num, horse, day, clock, clock + ride.step);

          if (win) {
            // Defer rather than wait: the clock has not moved, so whichever
            // ride comes up next gets the same slot and the ring stays compact.
            arena.queue.push(ride);
            arena.queue.shift();
            stalled++;
            conflictsAvoided++;
            conflicts.avoided.push({
              riderNum: ride.num,
              riderName: ride.name,
              horse: ride.horse,
              classA: ride.label,
              ringA: arena.ring,
              classB: win.label,
              ringB: arenas[win.ring]?.ring ?? '',
            });
            continue;
          }

          arena.items.push({
            type: 'ride',
            cls: ride.cls,
            entryId: ride.entryId,
            label: ride.label,
            num: ride.num,
            name: ride.name,
            horse: ride.horse,
            division: ride.division,
            quals: ride.quals,
            qualifying: ride.quals.length > 0,
            day,
            start: clock,
            end: clock + ride.step,
            status: ride.status,
          });
          const windows = riderWindows.get(ride.num) ?? [];
          windows.push({
            ring: i,
            day,
            start: clock,
            end: clock + ride.step,
            cls: ride.cls,
            label: ride.label,
            horse,
          });
          riderWindows.set(ride.num, windows);

          clocks[i] = clock + ride.step;
          arena.queue.shift();
          stalled = 0;
          madeProgress = true;
        }

        // Everything left conflicts and reordering could not resolve it — this
        // is where the hard rule bites. Wait for the gap, never force it.
        if (arena.queue.length > 0 && stalled >= arena.queue.length) {
          const ride = arena.queue[0];
          if (!ride) return;
          if (ride.pinnedDay != null && ride.pinnedDay !== day) return;

          const clock = clocks[i] ?? 0;
          const horse = horseKey(ride.horseId, ride.horse);
          const safeStart = earliestSafeStart(ride.num, horse, day, clock, ride.step);
          if (cap != null && safeStart + ride.step > cap) return;

          const waited = safeStart > clock;
          const win = waited ? conflictWindow(ride.num, horse, day, clock, clock + ride.step) : null;

          arena.items.push({
            type: 'ride',
            cls: ride.cls,
            entryId: ride.entryId,
            label: ride.label,
            num: ride.num,
            name: ride.name,
            horse: ride.horse,
            division: ride.division,
            quals: ride.quals,
            qualifying: ride.quals.length > 0,
            day,
            start: safeStart,
            end: safeStart + ride.step,
            status: ride.status,
          });
          const windows = riderWindows.get(ride.num) ?? [];
          windows.push({
            ring: i,
            day,
            start: safeStart,
            end: safeStart + ride.step,
            cls: ride.cls,
            label: ride.label,
            horse,
          });
          riderWindows.set(ride.num, windows);

          clocks[i] = safeStart + ride.step;
          arena.queue.shift();
          madeProgress = true;

          if (waited) {
            conflictsWaited++;
            if (win) {
              conflicts.waited.push({
                riderNum: ride.num,
                riderName: ride.name,
                horse: ride.horse,
                classA: ride.label,
                ringA: arena.ring,
                classB: win.label,
                ringB: arenas[win.ring]?.ring ?? '',
              });
            }
          }
        }
      }
    }

    const hasMoreToday = (i: number) => {
      const arena = arenas[i];
      const ride = arena?.queue[0];
      if (!arena || !ride) return false;
      return (clocks[i] ?? 0) + ride.step <= end;
    };

    for (const planned of dayBreaks) {
      // Let every ring run as far as it can without passing target+tolerance —
      // the swing that keeps anyone from being cut off mid-ride.
      const cap = planned.at + planned.tol;
      for (let i = 0; i < arenas.length; i++) fill(i, cap);

      // The break moment is the latest boundary any still-active ring reached;
      // every ring pauses there together.
      let sync = -1;
      for (let i = 0; i < arenas.length; i++) {
        if (hasMoreToday(i) && (clocks[i] ?? 0) > sync) sync = clocks[i] ?? 0;
      }
      if (sync >= 0 && sync + planned.dur <= end) {
        for (let i = 0; i < arenas.length; i++) {
          if (!hasMoreToday(i)) continue;
          arenas[i]?.items.push({
            type: planned.type,
            label: planned.label,
            day,
            start: sync,
            end: sync + planned.dur,
          });
          clocks[i] = sync + planned.dur;
        }
      }
    }

    for (let i = 0; i < arenas.length; i++) fill(i, null);
    day++;
  }

  return {
    arenas: arenas.map((a) => ({
      ring: a.ring,
      ringSize: a.ringSize,
      items: [...a.items].sort((x, y) => x.day - y.day || x.start - y.start),
    })),
    tooLarge: null,
    conflictsAvoided,
    conflictsWaited,
    conflicts,
  };
}

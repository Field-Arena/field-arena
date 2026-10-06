import { fmtTime, type ConflictDetail, type MasterSchedule } from './schedule-engine';

export interface RingDaySummary {
  ring: string;
  judges: string[];
  rides: number;
  window: string;
}

export interface DaySummary {
  day: number;
  label: string;
  rings: RingDaySummary[];
}

interface RingAcc {
  judges: Set<string>;
  rides: number;
  start: number;
  end: number;
}

export interface ScheduleSummary {
  days: DaySummary[];
  rides: number;
  riders: number;
  rings: number;
  classes: number;
  ringsWithJudges: number;
  /** Times a ring sat idle so a rider riding in two rings got their rest gap.
   * The builder always resolves double-bookings this way — these are not
   * open conflicts. */
  restWaits: ConflictDetail[];
}

function dayLabel(startDate: string | null, day: number): string {
  if (!startDate) return `Day ${String(day + 1)}`;
  const d = new Date(`${startDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return `Day ${String(day + 1)}`;
  d.setDate(d.getDate() + day);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${weekday} · ${date}`;
}

/** Rolls the built master schedule up to one row per ring per day — the
 * Schedule / Review tab's summary table and approval checklist. */
export function summarizeSchedule(
  schedule: MasterSchedule,
  judgesByClass: Record<string, string[]>,
  startDate: string | null,
): ScheduleSummary {
  const byDay = new Map<
    number,
    Map<string, { judges: Set<string>; rides: number; start: number; end: number }>
  >();
  const classes = new Set<string>();
  const ringsWithJudges = new Set<string>();
  const riders = new Set<string>();
  let rides = 0;

  for (const arena of schedule.arenas) {
    for (const item of arena.items) {
      if (item.type !== 'ride') continue;
      rides += 1;
      riders.add(item.num || item.name);
      classes.add(item.cls);
      const rings = byDay.get(item.day) ?? new Map<string, RingAcc>();
      byDay.set(item.day, rings);
      const row: RingAcc = rings.get(arena.ring) ?? {
        judges: new Set<string>(),
        rides: 0,
        start: item.start,
        end: item.end,
      };
      row.rides += 1;
      row.start = Math.min(row.start, item.start);
      row.end = Math.max(row.end, item.end);
      for (const judge of judgesByClass[item.cls] ?? []) row.judges.add(judge);
      if (row.judges.size > 0) ringsWithJudges.add(arena.ring);
      rings.set(arena.ring, row);
    }
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, rings]) => ({
      day,
      label: dayLabel(startDate, day),
      rings: [...rings.entries()].map(([ring, r]) => ({
        ring,
        judges: [...r.judges],
        rides: r.rides,
        window: `${fmtTime(r.start)}–${fmtTime(r.end)}`,
      })),
    }));

  const ringNames = new Set(days.flatMap((d) => d.rings.map((r) => r.ring)));

  return {
    days,
    rides,
    riders: riders.size,
    rings: ringNames.size,
    classes: classes.size,
    ringsWithJudges: ringsWithJudges.size,
    restWaits: schedule.conflicts.waited,
  };
}

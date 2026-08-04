'use client';

import { useState } from 'react';
import { PrinterIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { fmtTime, type Arena, type ScheduleRide } from '../../schedule-engine';
import type { MasterScheduleData } from '../../data/setup-queries';
import {
  useMoveClassToRingDay,
  useReorderRide,
  useScratchEntry,
  useSetClassDuration,
} from '../../hooks/use-schedule-mutations';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { SM_GHOST_BTN } from '../show-manager/tokens';
import { AwardsGroupingToggle, ScheduleKeyCard, ScheduleRulesCard } from './schedule-rules-card';
import { ScheduleClashesCard } from './schedule-clashes-card';
import { PublishScheduleButton } from './publish-schedule-button';

const RING_SIZE_LABEL: Record<string, string> = {
  standard: 'Standard (20m × 60m)',
  small: 'Small (20m × 40m)',
};

/** The show's calendar date for a day index, or a plain "Day n" when undated. */
function dayDate(startDate: string | null, day: number): string {
  if (!startDate) return `Day ${String(day + 1)}`;
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Which riders are doing more than one thing on a given day.
 *
 * Two separate facts, because they mean different things to whoever runs the
 * day: riding several events, and riding more than one horse. The legacy view
 * marks each with its own colour, and both together with both.
 */
function riderDayFlags(arenas: Arena[]): Map<string, { count: number; horses: Set<string> }> {
  const flags = new Map<string, { count: number; horses: Set<string> }>();

  for (const arena of arenas) {
    for (const item of arena.items) {
      if (item.type !== 'ride') continue;
      const key = `${item.num}|${String(item.day)}`;
      const current = flags.get(key) ?? { count: 0, horses: new Set<string>() };
      current.count += 1;
      if (item.horse) current.horses.add(item.horse);
      flags.set(key, current);
    }
  }

  return flags;
}

/**
 * The built master schedule, ported from showstaff.html's masterScheduleView.
 *
 * One page per ring per day. Everything on it that can change, changes in
 * place — ride time, which ring and day a class runs in, the order riders go,
 * and scratching — because those are decisions an organizer makes while reading
 * the schedule, not somewhere else.
 *
 * Each edit writes to what the schedule is *built from* (ride order, the class's
 * ring and date, its ride minutes) rather than to a stored schedule, so the
 * rebuild is automatic and the hard rider-conflict rule is re-applied every
 * time.
 *
 * A class that a break interrupted appears twice, the second time marked
 * "Continues" — nothing is atomic below a single ride, so a class genuinely can
 * pause and pick back up.
 */
export function MasterScheduleView({ data }: { data: MasterScheduleData }) {
  const { schedule } = data;

  const totalDays = Math.max(1, ...schedule.arenas.flatMap((a) => a.items.map((it) => it.day + 1)));
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const flags = riderDayFlags(schedule.arenas);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5 print:hidden">
        <button
          type="button"
          className={SM_GHOST_BTN}
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className="size-4" aria-hidden />
          Print schedule
        </button>

        <PublishScheduleButton showId={data.showId} published={data.published} />

        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
          Awards grouping
          <AwardsGroupingToggle data={data} />
        </span>
      </div>

      <div className="print:hidden">
        {/* The counts used to sit as bare text on the toolbar. They are the
            headline of a real story — which riders clashed and what the
            scheduler did — so they carry their own card now. */}
        <ScheduleClashesCard schedule={schedule} />
        <ScheduleRulesCard data={data} />
        <ScheduleKeyCard />
      </div>

      {totalDays > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5 print:hidden">
          <DayButton
            active={filterDay == null}
            onClick={() => {
              setFilterDay(null);
            }}
          >
            All
          </DayButton>
          {Array.from({ length: totalDays }, (_, i) => i).map((i) => (
            <DayButton
              key={i}
              active={filterDay === i}
              onClick={() => {
                setFilterDay(i);
              }}
            >
              Day {i + 1} — {dayDate(data.startDate, i)}
            </DayButton>
          ))}
        </div>
      )}

      {schedule.arenas.map((arena) => (
        <RingSchedule
          key={arena.ring}
          arena={arena}
          data={data}
          filterDay={filterDay}
          totalDays={totalDays}
          flags={flags}
        />
      ))}
    </div>
  );
}

function DayButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[9px] border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
        active
          ? 'border-forest bg-forest text-white'
          : 'border-[#D9E1DD] bg-white text-forest hover:border-gold'
      )}
    >
      {children}
    </button>
  );
}

function RingSchedule({
  arena,
  data,
  filterDay,
  totalDays,
  flags,
}: {
  arena: Arena;
  data: MasterScheduleData;
  filterDay: number | null;
  totalDays: number;
  flags: Map<string, { count: number; horses: Set<string> }>;
}) {
  const days = [...new Set(arena.items.map((it) => it.day))].sort((a, b) => a - b);

  /**
   * "Riding now" is the first ride in this ring with no score yet, across every
   * day — the ring's real progress runs through all of them, so scoping this to
   * the day on screen would mark a second rider as current on Day 2 while Day 1
   * was still going.
   */
  const rides = arena.items.filter((it): it is ScheduleRide => it.type === 'ride');
  const currentEntryId = rides.find((r) => !data.finalPctByEntry[r.entryId])?.entryId ?? null;

  return (
    <>
      {days.map((day) => {
        if (filterDay != null && day !== filterDay) return null;
        const items = arena.items.filter((it) => it.day === day);
        if (items.length === 0) return null;

        const lastEnd = items[items.length - 1]?.end ?? 0;

        return (
          <section
            key={`${arena.ring}-${String(day)}`}
            className="mb-6 rounded-[12px] border border-[#E9EDEB] bg-white p-5 print:break-after-page"
          >
            <header className="mb-3 border-b border-[#E9EDEB] pb-2.5">
              <h2 className="font-[family-name:var(--font-nr)] text-[19px] font-semibold text-forest">
                {data.showName}
              </h2>
              <div className="text-[12.5px] text-[#7A8781]">
                Schedule of Classes
                {data.timezone && (
                  <span className="font-normal"> — times shown in {data.timezone}</span>
                )}
              </div>
              <div className="mt-0.5 text-[12.5px] font-semibold text-ink-deep">
                {days.length > 1
                  ? `Day ${String(day + 1)} of ${String(days.length)} — ${dayDate(data.startDate, day)}`
                  : dayDate(data.startDate, day)}
              </div>
            </header>

            <div className="mb-3 text-[14px] font-bold text-forest">
              {arena.ring}{' '}
              <span className="text-[12.5px] font-normal text-[#7A8781]">
                — {RING_SIZE_LABEL[arena.ringSize] ?? RING_SIZE_LABEL.standard}
              </span>
            </div>

            <DayItems
              items={items}
              data={data}
              day={day}
              ring={arena.ring}
              totalDays={totalDays}
              flags={flags}
              currentEntryId={currentEntryId}
            />

            <div className="mt-3 text-center text-[12.5px] font-semibold text-[#7A8781]">
              — Arena Done {fmtTime(lastEnd)} —
            </div>
          </section>
        );
      })}
    </>
  );
}

function DayItems({
  items,
  data,
  day,
  ring,
  totalDays,
  flags,
  currentEntryId,
}: {
  items: Arena['items'];
  data: MasterScheduleData;
  day: number;
  ring: string;
  totalDays: number;
  flags: Map<string, { count: number; horses: Set<string> }>;
  currentEntryId: string | null;
}) {
  const blocks: { cls: string; label: string; continues: boolean; rides: ScheduleRide[] }[] = [];
  const seen = new Set<string>();
  // Tracked by index rather than a nullable reference: a break resets it to -1,
  // and an index keeps both the null check and the append in one expression.
  let openIndex = -1;

  for (const item of items) {
    if (item.type !== 'ride') {
      openIndex = -1;
      blocks.push({
        cls: `break-${String(item.start)}`,
        label: `${item.label} ${fmtTime(item.start)} to ${fmtTime(item.end)}`,
        continues: false,
        rides: [],
      });
      continue;
    }

    if (blocks[openIndex]?.cls !== item.cls) {
      blocks.push({
        cls: item.cls,
        label: item.label,
        continues: seen.has(item.cls),
        rides: [],
      });
      seen.add(item.cls);
      openIndex = blocks.length - 1;
    }
    blocks[openIndex]?.rides.push(item);
  }

  return (
    <>
      {blocks.map((block) =>
        block.rides.length === 0 ? (
          <div
            key={block.cls}
            className="my-2.5 text-center text-[12.5px] font-semibold text-[#7A8781]"
          >
            — {block.label} —
          </div>
        ) : (
          <ClassBlock
            key={`${block.cls}-${String(block.rides[0]?.start ?? 0)}`}
            block={block}
            data={data}
            day={day}
            ring={ring}
            totalDays={totalDays}
            flags={flags}
            currentEntryId={currentEntryId}
          />
        )
      )}
    </>
  );
}

function ClassBlock({
  block,
  data,
  day,
  ring,
  totalDays,
  flags,
  currentEntryId,
}: {
  block: { cls: string; label: string; continues: boolean; rides: ScheduleRide[] };
  data: MasterScheduleData;
  day: number;
  ring: string;
  totalDays: number;
  flags: Map<string, { count: number; horses: Set<string> }>;
  currentEntryId: string | null;
}) {
  const setDuration = useSetClassDuration();
  const move = useMoveClassToRingDay();
  const reorder = useReorderRide();
  const [dragging, setDragging] = useState<string | null>(null);

  const judges = data.judgesByClass[block.cls] ?? [];
  const minutes = data.rideMinutesByClass[block.cls] ?? 0;

  return (
    <div className="mb-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-[13.5px] font-bold text-ink-deep">
          {block.label}
          {block.continues && <span className="ml-1.5 font-normal text-[#7A8781]">Continues</span>}
          <span className="ml-1.5 text-[12px] font-normal text-[#7A8781]">
            — Day {day + 1}, {dayDate(data.startDate, day)}
          </span>
        </span>

        <span className="flex flex-wrap items-center gap-2 print:hidden">
          <label className="flex items-center gap-1 text-[11.5px] text-[#7A8781]">
            Ride time
            <input
              type="number"
              min={1}
              max={60}
              defaultValue={minutes}
              className="w-[52px] rounded-[6px] border border-[#D9E1DD] px-1.5 py-0.5 text-[11.5px]"
              onBlur={(e) => {
                const next = Number(e.target.value);
                if (next === minutes) return;
                setDuration.mutate({ showId: data.showId, classId: block.cls, minutes: next });
              }}
            />
            min
          </label>

          {/* Only worth offering when there is somewhere else to go. */}
          {(data.rings.length > 1 || totalDays > 1) && (
            <select
              aria-label={`Move ${block.label}`}
              value={`${ring}|${String(day)}`}
              className="rounded-[6px] border border-[#D9E1DD] px-1.5 py-1 text-[11.5px]"
              onChange={(e) => {
                const [nextRing = ring, nextDay = '0'] = e.target.value.split('|');
                move.mutate({
                  showId: data.showId,
                  classId: block.cls,
                  ring: nextRing,
                  day: Number(nextDay),
                });
              }}
            >
              {data.rings.flatMap((r) =>
                Array.from({ length: totalDays }, (_, d) => (
                  <option key={`${r}|${String(d)}`} value={`${r}|${String(d)}`}>
                    {r}, Day {d + 1}
                  </option>
                ))
              )}
            </select>
          )}
        </span>
      </div>

      <div className="mb-1 text-[12px] text-[#7A8781]">
        {judges.length > 0 ? judges.join(' · ') : 'No judge assigned'}
      </div>

      <table className="w-full border-collapse text-[12.5px]">
        <tbody>
          {block.rides.map((ride, index) => {
            const scratched = ride.status === 'scratched';
            const isCurrent = ride.entryId === currentEntryId;
            const score = data.finalPctByEntry[ride.entryId];
            const flag = flags.get(`${ride.num}|${String(ride.day)}`);
            // A rider stays movable right up until their own ride has happened —
            // not gated on the show being live, so the last ride of the last day
            // is still movable while nobody has judged it.
            const movable = !scratched && !score;

            return (
              <tr
                key={ride.entryId}
                draggable={movable}
                onDragStart={() => {
                  setDragging(ride.entryId);
                }}
                onDragOver={(e) => {
                  if (dragging) e.preventDefault();
                }}
                onDrop={() => {
                  if (!dragging || dragging === ride.entryId) return;
                  reorder.mutate({
                    showId: data.showId,
                    classId: block.cls,
                    entryId: dragging,
                    toIndex: index,
                  });
                  setDragging(null);
                }}
                onDragEnd={() => {
                  setDragging(null);
                }}
                className={cn(
                  'border-b border-[#F1F4F3]',
                  scratched && 'text-[#98A29D] line-through',
                  isCurrent && 'bg-[#FCF3E4]',
                  movable && 'cursor-grab'
                )}
              >
                <td className="w-[112px] py-1.5 font-semibold">
                  {fmtTime(ride.start)}
                  {isCurrent && (
                    <span className="ml-1 text-[10px] font-bold text-[#8A6D14] print:hidden">
                      ▸ Riding now
                    </span>
                  )}
                </td>
                <td className="py-1.5">
                  {movable && (
                    <span
                      aria-hidden
                      title="Drag to reorder within this class"
                      className="mr-1 text-[#98A29D] print:hidden"
                    >
                      ⠿
                    </span>
                  )}
                  {ride.num} {ride.horse},{' '}
                  <span
                    className={cn(
                      flag && flag.count > 1 && 'font-bold text-[#8A6D14]',
                      flag && flag.count <= 1 && flag.horses.size > 1 && 'font-bold text-[#2F6FB0]',
                      flag && flag.horses.size > 1 && 'underline decoration-dotted'
                    )}
                  >
                    {ride.name}
                  </span>
                </td>
                <td className="w-[70px] py-1.5 text-[#7A8781]">
                  {ride.division !== 'O' && ride.division}
                  {ride.qualifying && (
                    <span
                      title={ride.quals.join(', ')}
                      className="ml-1 rounded bg-[#FCF3E4] px-1 text-[10px] font-bold text-[#8A6D14]"
                    >
                      Q
                    </span>
                  )}
                </td>
                <td className="w-[64px] py-1.5 text-right font-semibold">{score ?? ''}</td>
                <td className="w-[74px] py-1.5 text-right print:hidden">
                  {movable && (
                    <ScratchButton showId={data.showId} entryId={ride.entryId} num={ride.num} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScratchButton({ showId, entryId, num }: { showId: string; entryId: string; num: string }) {
  const [open, setOpen] = useState(false);
  const scratch = useScratchEntry();

  return (
    <>
      <button
        type="button"
        disabled={scratch.isPending}
        onClick={() => {
          setOpen(true);
        }}
        className="rounded-[6px] border border-[#E4B5AC] bg-[#FDF0EE] px-2 py-0.5 text-[11px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F]"
      >
        Scratch
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Scratch #${num}?`}
        description="They'll stay on the schedule, marked as scratched, so the printed sheet still accounts for them."
        confirmLabel={scratch.isPending ? 'Scratching…' : 'Scratch rider'}
        destructive
        pending={scratch.isPending}
        onConfirm={() => {
          scratch.mutate({ showId, entryId }, { onSuccess: () => { setOpen(false); } });
        }}
      />
    </>
  );
}

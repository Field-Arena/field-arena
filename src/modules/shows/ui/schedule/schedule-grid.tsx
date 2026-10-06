'use client';

import { useState } from 'react';
import { fmtTime, type Arena, type ScheduleRide } from '@/modules/shows/schedule-engine';
import type { MasterScheduleData } from '@/modules/shows/types';
import { RING_SIZE_LABEL } from '@/modules/shows/constants';
import {
  useMoveClassToRingDay,
  useReorderRide,
  useSetClassDuration,
} from '@/modules/shows/hooks/use-schedule-mutations';
import { groupDayItemsIntoBlocks } from '@/modules/shows/utils/group-day-items-into-blocks';
import { levelOf, type ScheduleLevelKey } from '@/modules/shows/utils/schedule-level';
import { RideCard } from './ride-card';

/** The prototype's three-column ring board for one day. */
export function ScheduleGrid({
  data,
  day,
  totalDays,
  hidden,
}: {
  data: MasterScheduleData;
  day: number;
  totalDays: number;
  hidden: Set<ScheduleLevelKey>;
}) {
  const arenas = data.schedule.arenas.filter((a) => a.items.some((it) => it.day === day));
  if (arenas.length === 0) {
    return (
      <div className="fa-mini-card">
        <p>Nothing is scheduled on this day.</p>
      </div>
    );
  }
  return (
    <div className="fa-rings">
      {arenas.map((arena) => (
        <RingColumn
          key={arena.ring}
          arena={arena}
          data={data}
          day={day}
          totalDays={totalDays}
          hidden={hidden}
        />
      ))}
    </div>
  );
}

function RingColumn({
  arena,
  data,
  day,
  totalDays,
  hidden,
}: {
  arena: Arena;
  data: MasterScheduleData;
  day: number;
  totalDays: number;
  hidden: Set<ScheduleLevelKey>;
}) {
  const items = arena.items.filter((it) => it.day === day);
  const rides = items.filter((it): it is ScheduleRide => it.type === 'ride');
  const blocks = groupDayItemsIntoBlocks(items);
  const judges = [...new Set(rides.flatMap((r) => data.judgesByClass[r.cls] ?? []))];
  const allRides = arena.items.filter((it): it is ScheduleRide => it.type === 'ride');
  const currentEntryId = allRides.find((r) => !data.finalPctByEntry[r.entryId])?.entryId ?? null;
  const start = items[0]?.start ?? 0;
  const end = items[items.length - 1]?.end ?? 0;

  const setDuration = useSetClassDuration();
  const move = useMoveClassToRingDay();
  const reorder = useReorderRide();
  const [dragging, setDragging] = useState<{ entryId: string; cls: string } | null>(null);

  return (
    <div className="fa-ring">
      <div className="fa-ring-head">
        <div className="fa-rn">
          <h4>{arena.ring}</h4>
          <span className="text-[11px] text-[var(--fa-ink-3)]">
            {RING_SIZE_LABEL[arena.ringSize] ?? RING_SIZE_LABEL.standard}
          </span>
        </div>
        <div className="fa-ring-judge">
          {judges.length > 0 ? judges.join(' · ') : 'No judge assigned'}
        </div>
        <div className="fa-ring-meta">
          <span>
            {rides.length} ride{rides.length === 1 ? '' : 's'} · starts <b>{fmtTime(start)}</b>
          </span>
          <span>
            Ends <b>{fmtTime(end)}</b>
          </span>
        </div>
      </div>

      <div className="fa-ring-body">
        {blocks.map((block) => {
          if (block.rides.length === 0) {
            const brk = items.find(
              (it) => it.type !== 'ride' && block.cls === `break-${String(it.start)}`,
            );
            return (
              <div key={block.cls} className="fa-break-row">
                <span className="fa-r-time">{brk ? fmtTime(brk.start) : ''}</span>
                <span className="fa-b-lab">
                  {brk?.label ?? block.label}
                  {brk && <span> · {String(brk.end - brk.start)} min</span>}
                </span>
              </div>
            );
          }

          const level = levelOf(block.label);
          const dim = hidden.has(level.key);
          const minutes = data.rideMinutesByClass[block.cls] ?? 0;
          return (
            <div key={`${block.cls}-${String(block.rides[0]?.start ?? 0)}`} className="contents">
              <div className="fa-class-div flex-wrap">
                <span className="fa-cl-bar" style={{ background: level.color }} />
                <span className="fa-cl-name">
                  {block.label}
                  {block.continues && (
                    <span className="ml-1 font-normal text-[var(--fa-ink-3)]">(cont.)</span>
                  )}
                </span>
                <span className="fa-cl-meta flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    defaultValue={minutes}
                    aria-label={`Minutes per ride for ${block.label}`}
                    title="Minutes per ride"
                    className="h-6 w-11 rounded-md border border-[var(--fa-line)] px-1 text-[11px]"
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (next === minutes || !next) return;
                      setDuration.mutate({
                        showId: data.showId,
                        classId: block.cls,
                        minutes: next,
                      });
                    }}
                  />
                  min
                  {(data.rings.length > 1 || totalDays > 1) && (
                    <select
                      aria-label={`Move ${block.label}`}
                      value={`${arena.ring}|${String(day)}`}
                      className="h-6 max-w-[120px] rounded-md border border-[var(--fa-line)] px-1 text-[11px]"
                      onChange={(e) => {
                        const [nextRing = arena.ring, nextDay = '0'] = e.target.value.split('|');
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
                        )),
                      )}
                    </select>
                  )}
                </span>
              </div>
              {block.rides.map((ride, index) => (
                <RideCard
                  key={ride.entryId}
                  showId={data.showId}
                  ride={ride}
                  index={index}
                  count={block.rides.length}
                  color={level.color}
                  score={data.finalPctByEntry[ride.entryId]}
                  isCurrent={ride.entryId === currentEntryId}
                  dim={dim}
                  dragging={dragging?.cls === block.cls ? dragging.entryId : null}
                  onDragStart={() => {
                    setDragging({ entryId: ride.entryId, cls: block.cls });
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                  }}
                  onDropHere={() => {
                    const from = dragging?.cls === block.cls ? dragging.entryId : null;
                    if (!from || from === ride.entryId) return;
                    reorder.mutate({
                      showId: data.showId,
                      classId: block.cls,
                      entryId: from,
                      toIndex: index,
                    });
                    setDragging(null);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

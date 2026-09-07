'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Table, TableBody, TableCell, TableRow } from '@/shared/ui/shadcn/table';
import { fmtTime } from '@/modules/shows/schedule-engine';
import type { MasterScheduleData } from '@/modules/shows/data/setup-queries';
import {
  useMoveClassToRingDay,
  useReorderRide,
  useSetClassDuration,
} from '@/modules/shows/hooks/use-schedule-mutations';
import type { DayBlock } from '@/modules/shows/utils/group-day-items-into-blocks';
import { dayDate } from '@/modules/shows/utils/day-date';
import { ScratchButton } from '@/modules/shows/ui/schedule/scratch-button';

export function ClassBlock({
  block,
  data,
  day,
  ring,
  totalDays,
  flags,
  currentEntryId,
}: {
  block: DayBlock;
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
        <span className="text-ink-deep text-[13.5px] font-bold">
          {block.label}
          {block.continues && <span className="ml-1.5 font-normal text-[#7A8781]">Continues</span>}
          <span className="ml-1.5 text-[12px] font-normal text-[#7A8781]">
            — Day {day + 1}, {dayDate(data.startDate, day)}
          </span>
        </span>

        <span className="flex flex-wrap items-center gap-2 print:hidden">
          <Label className="flex items-center gap-1 text-[11.5px] text-[#7A8781]">
            Ride time
            <Input
              type="number"
              min={1}
              max={60}
              defaultValue={minutes}
              className="h-auto w-[52px] rounded-[6px] border border-[#D9E1DD] px-1.5 py-0.5 text-[11.5px]"
              onBlur={(e) => {
                const next = Number(e.target.value);
                if (next === minutes) return;
                setDuration.mutate({ showId: data.showId, classId: block.cls, minutes: next });
              }}
            />
            min
          </Label>

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
                )),
              )}
            </select>
          )}
        </span>
      </div>

      <div className="mb-1 text-[12px] text-[#7A8781]">
        {judges.length > 0 ? judges.join(' · ') : 'No judge assigned'}
      </div>

      <Table className="w-full border-collapse text-[12.5px]">
        <TableBody className="[&_tr:last-child]:border-b">
          {block.rides.map((ride, index) => {
            const scratched = ride.status === 'scratched';
            const isCurrent = ride.entryId === currentEntryId;
            const score = data.finalPctByEntry[ride.entryId];
            const flag = flags.get(`${ride.num}|${String(ride.day)}`);

            const movable = !scratched && !score;

            return (
              <TableRow
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
                  'border-b border-[#F1F4F3] hover:bg-transparent',
                  scratched && 'text-[#98A29D] line-through',
                  isCurrent && 'bg-[#FCF3E4]',
                  movable && 'cursor-grab',
                )}
              >
                <TableCell className="w-[112px] py-1.5 font-semibold whitespace-normal">
                  {fmtTime(ride.start)}
                  {isCurrent && (
                    <span className="ml-1 text-[10px] font-bold text-[#8A6D14] print:hidden">
                      ▸ Riding now
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-1.5 whitespace-normal">
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
                      flag && flag.horses.size > 1 && 'underline decoration-dotted',
                    )}
                  >
                    {ride.name}
                  </span>
                </TableCell>
                <TableCell className="w-[70px] py-1.5 whitespace-normal text-[#7A8781]">
                  {ride.division !== 'O' && ride.division}
                  {ride.qualifying && (
                    <span
                      title={ride.quals.join(', ')}
                      className="ml-1 rounded bg-[#FCF3E4] px-1 text-[10px] font-bold text-[#8A6D14]"
                    >
                      Q
                    </span>
                  )}
                </TableCell>
                <TableCell className="w-[64px] py-1.5 text-right font-semibold whitespace-normal">
                  {score ?? ''}
                </TableCell>
                <TableCell className="w-[74px] py-1.5 text-right whitespace-normal print:hidden">
                  {movable && (
                    <ScratchButton showId={data.showId} entryId={ride.entryId} num={ride.num} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

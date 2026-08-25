'use client';

import { useState } from 'react';
import type { UpdateSchedulePrefsInput } from '@/modules/shows/schemas';
import type { SchedulePrefs, ClassRow } from '@/modules/shows/data/setup-queries';
import { useUpdateSchedulePrefs, useReorderClasses } from '@/modules/shows/hooks/use-show-mutations';
import { showDayDates } from '@/modules/shows/utils/show-day-dates';
import { dayLabel } from '@/modules/shows/utils/day-label';
import { Card } from '@/shared/ui/organizer/card';
import { Input } from '@/shared/ui/shadcn/input';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
} from '@/modules/shows/ui/show-manager/tokens';

export function SchedulePreferencesCard({
  showId,
  startDate,
  endDate,
  prefs,
  dayStartTimes,
  dayEndTimes,
  classes,
}: {
  showId: string;
  startDate: string | null;
  endDate: string | null;
  prefs: SchedulePrefs;
  dayStartTimes: string[];
  dayEndTimes: string[];
  classes: ClassRow[];
}) {
  const days = showDayDates(startDate ?? '', endDate ?? '');
  const effDays = days.length ? days : ['__day1__'];

  const [perMin, setPerMin] = useState(prefs.perMin);
  const [buffer, setBuffer] = useState(prefs.buffer);
  const [upper, setUpper] = useState(prefs.upper);
  const [end, setEnd] = useState(prefs.end);
  const [order, setOrder] = useState(prefs.order);
  const [warmup, setWarmup] = useState(prefs.warmup);
  const [lunch, setLunch] = useState(prefs.lunch);
  const [extraBreaks, setExtraBreaks] = useState(prefs.extraBreaks);
  const [extraBreakMin, setExtraBreakMin] = useState(prefs.extraBreakMin);
  const [dayStarts, setDayStarts] = useState<string[]>(
    effDays.map((_, i) => dayStartTimes[i] ?? '08:00'),
  );
  const [dayEnds, setDayEnds] = useState<string[]>(effDays.map((_, i) => dayEndTimes[i] ?? ''));

  const { mutate } = useUpdateSchedulePrefs();
  const { mutate: reorder } = useReorderClasses();
  const [manualOrder, setManualOrder] = useState<ClassRow[]>(() =>
    [...classes].sort((a, b) => {
      const ao = a.runOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.runOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.label.localeCompare(b.label);
    }),
  );

  function moveClass(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= manualOrder.length) return;
    const next = [...manualOrder];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    setManualOrder(next);
    reorder({ showId, orderedClassIds: next.map((c) => c.id) });
  }

  const rateFields: {
    id: string;
    label: string;
    min: number;
    max: number;
    value: number;
    onChange: (v: number) => void;
  }[] = [
    {
      id: 'sm-permin',
      label: 'Time per ride (min)',
      min: 3,
      max: 30,
      value: perMin,
      onChange: setPerMin,
    },
    {
      id: 'sm-buffer',
      label: 'Change-over buffer (min)',
      min: 0,
      max: 15,
      value: buffer,
      onChange: setBuffer,
    },
    {
      id: 'sm-upper',
      label: 'Upper-level allowance (min)',
      min: 0,
      max: 15,
      value: upper,
      onChange: setUpper,
    },
  ];

  function save(overrides: Partial<UpdateSchedulePrefsInput> = {}) {
    mutate({
      showId,
      perMin,
      buffer,
      upper,
      end,
      order,
      warmup,
      lunch,
      extraBreaks,
      extraBreakMin,
      dayStartTimes: dayStarts,
      dayEndTimes: dayEnds,
      ...overrides,
    });
  }

  function setDayStart(index: number, value: string) {
    const next = dayStarts.map((v, i) => (i === index ? value : v));
    setDayStarts(next);
    save({ dayStartTimes: next });
  }

  function setDayEnd(index: number, value: string) {
    const next = dayEnds.map((v, i) => (i === index ? value : v));
    setDayEnds(next);
    save({ dayEndTimes: next });
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Schedule preferences</h2>
      <p className={SM_NOTE}>
        How Show Manager paces the day. These are your call any time — they don&rsquo;t depend on
        entries, so there&rsquo;s no reason to wait.
      </p>

      <div className="grid grid-cols-1 gap-x-[26px] gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {rateFields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className={SM_LABEL}>
              {f.label}
            </label>
            <Input
              id={f.id}
              type="number"
              min={f.min}
              max={f.max}
              value={f.value}
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                f.onChange(Number(e.target.value));
              }}
              onBlur={() => {
                save();
              }}
            />
          </div>
        ))}
        <div>
          <label htmlFor="sm-latest-finish" className={SM_LABEL}>
            Latest finish
          </label>
          <Input
            id="sm-latest-finish"
            type="time"
            value={end}
            className={`h-auto ${SM_INPUT}`}
            onChange={(e) => {
              setEnd(e.target.value);
            }}
            onBlur={() => {
              save();
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1.5 text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
          Per-day start / stop times
        </div>
        <p className="mb-4 text-[12.5px] leading-[1.5] text-[#6E7C76]">
          Overrides &ldquo;Latest finish&rdquo; above for a specific day — a day with no stop-time
          override still uses that show-wide default.
        </p>
        <div className="flex flex-col gap-2.5">
          {effDays.map((day, i) => (
            <div key={day} className="flex flex-wrap items-center gap-3">
              <span className="text-forest w-[100px] flex-none text-[13.5px] font-bold">
                {day === '__day1__' ? 'Day 1' : dayLabel(day, i)}
              </span>
              <span className="w-9 flex-none text-[11px] text-[#7C8A84]">Start</span>
              <Input
                type="time"
                value={dayStarts[i] ?? '08:00'}
                className="text-ink-deep focus-visible:border-gold h-auto w-[130px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] outline-none"
                onChange={(e) => {
                  setDayStart(i, e.target.value);
                }}
              />
              <span className="ml-1.5 w-9 flex-none text-[11px] text-[#7C8A84]">Stop</span>
              <Input
                type="time"
                value={dayEnds[i] ?? ''}
                placeholder={end}
                className="text-ink-deep focus-visible:border-gold h-auto w-[130px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] outline-none"
                onChange={(e) => {
                  setDayEnd(i, e.target.value);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-[26px] gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="sm-order" className={SM_LABEL}>
            Class order
          </label>
          <select
            id="sm-order"
            value={order}
            className={SM_SELECT}
            onChange={(e) => {
              const next = e.target.value as 'low' | 'high' | 'custom';
              setOrder(next);
              save({ order: next });
            }}
          >
            <option value="low">Lowest level first</option>
            <option value="high">Highest level first</option>
            <option value="custom">Custom (manual order)</option>
          </select>
        </div>
        <div>
          <label htmlFor="sm-warmup" className={SM_LABEL}>
            Warm-up ring
          </label>
          <select
            id="sm-warmup"
            value={warmup}
            className={SM_SELECT}
            onChange={(e) => {
              const next = e.target.value as 'yes' | 'no';
              setWarmup(next);
              save({ warmup: next });
            }}
          >
            <option value="no">Not reserved</option>
            <option value="yes">Reserved</option>
          </select>
        </div>
        <div>
          <label htmlFor="sm-lunch" className={SM_LABEL}>
            Lunch break
          </label>
          <select
            id="sm-lunch"
            value={lunch ? 'yes' : 'no'}
            className={SM_SELECT}
            onChange={(e) => {
              const next = e.target.value === 'yes';
              setLunch(next);
              save({ lunch: next });
            }}
          >
            <option value="yes">Include lunch (12:00 PM, 1 hour)</option>
            <option value="no">No lunch</option>
          </select>
        </div>
        <div>
          <span className={SM_LABEL}>Additional breaks</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={6}
              value={extraBreaks}
              className="text-ink-deep focus-visible:border-gold h-auto w-[70px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-3 text-sm outline-none"
              onChange={(e) => {
                setExtraBreaks(Number(e.target.value));
              }}
              onBlur={() => {
                save();
              }}
            />
            <span className="text-[12.5px] text-[#7C8A84]">per day, at</span>
            <Input
              type="number"
              min={0}
              max={30}
              value={extraBreakMin}
              className="text-ink-deep focus-visible:border-gold h-auto w-[70px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-3 text-sm outline-none"
              onChange={(e) => {
                setExtraBreakMin(Number(e.target.value));
              }}
              onBlur={() => {
                save();
              }}
            />
            <span className="text-[12.5px] text-[#7C8A84]">min each</span>
          </div>
        </div>
      </div>

      {order === 'custom' && (
        <div className="mt-6 border-t border-[#EEF2F0] pt-5">
          <span className={SM_LABEL}>Running order</span>
          <p className={SM_NOTE}>
            Arrange classes into the exact order they should run — this order drives the schedule.
          </p>
          {manualOrder.length === 0 ? (
            <p className="text-[13px] text-[#98A29D] italic">
              No classes yet — add classes in Select Events first.
            </p>
          ) : (
            <ol className="mt-2 flex flex-col gap-1.5">
              {manualOrder.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-[10px] border border-[#E9EDEB] px-3 py-2"
                >
                  <span className="w-6 text-[12px] font-semibold text-[#98A29D]">
                    {String(i + 1)}
                  </span>
                  <span className="text-ink-deep min-w-0 flex-1 truncate text-[13.5px]">
                    {c.displayName ?? c.label}
                    {c.division ? (
                      <span className="text-[12px] text-[#98A29D]"> · {c.division}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => {
                      moveClass(i, -1);
                    }}
                    className="text-forest h-7 w-7 rounded-[8px] border border-[#E9EDEB] text-[13px] font-semibold transition-colors hover:bg-[#F4F7F5] disabled:cursor-not-allowed disabled:text-[#C7D0CB]"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === manualOrder.length - 1}
                    onClick={() => {
                      moveClass(i, 1);
                    }}
                    className="text-forest h-7 w-7 rounded-[8px] border border-[#E9EDEB] text-[13px] font-semibold transition-colors hover:bg-[#F4F7F5] disabled:cursor-not-allowed disabled:text-[#C7D0CB]"
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Card>
  );
}

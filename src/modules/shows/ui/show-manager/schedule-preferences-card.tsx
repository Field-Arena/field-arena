'use client';

import type { SchedulePrefs, ClassRow } from '@/modules/shows/data/setup-queries';
import { useSchedulePreferencesForm } from '@/modules/shows/hooks/use-schedule-preferences-form';
import { dayLabel } from '@/modules/shows/utils/day-label';
import { Card } from '@/shared/ui/organizer/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
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
  const {
    effDays,
    rateFields,
    end,
    setEnd,
    order,
    changeOrder,
    warmup,
    changeWarmup,
    lunch,
    changeLunch,
    extraBreaks,
    setExtraBreaks,
    extraBreakMin,
    setExtraBreakMin,
    dayStarts,
    dayEnds,
    setDayStart,
    setDayEnd,
    save,
    manualOrder,
    moveClass,
  } = useSchedulePreferencesForm({
    showId,
    startDate,
    endDate,
    prefs,
    dayStartTimes,
    dayEndTimes,
    classes,
  });

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
            <Label htmlFor={f.id} className={SM_LABEL}>
              {f.label}
            </Label>
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
          <Label htmlFor="sm-latest-finish" className={SM_LABEL}>
            Latest finish
          </Label>
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
          <Label htmlFor="sm-order" className={SM_LABEL}>
            Class order
          </Label>
          <select
            id="sm-order"
            value={order}
            className={SM_SELECT}
            onChange={(e) => {
              changeOrder(e.target.value as 'low' | 'high' | 'custom');
            }}
          >
            <option value="low">Lowest level first</option>
            <option value="high">Highest level first</option>
            <option value="custom">Custom (manual order)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sm-warmup" className={SM_LABEL}>
            Warm-up ring
          </Label>
          <select
            id="sm-warmup"
            value={warmup}
            className={SM_SELECT}
            onChange={(e) => {
              changeWarmup(e.target.value as 'yes' | 'no');
            }}
          >
            <option value="no">Not reserved</option>
            <option value="yes">Reserved</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sm-lunch" className={SM_LABEL}>
            Lunch break
          </Label>
          <select
            id="sm-lunch"
            value={lunch ? 'yes' : 'no'}
            className={SM_SELECT}
            onChange={(e) => {
              changeLunch(e.target.value === 'yes');
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

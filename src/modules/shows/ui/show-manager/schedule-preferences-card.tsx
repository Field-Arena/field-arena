'use client';

import { useState } from 'react';
import type { UpdateSchedulePrefsInput } from '../../schemas';
import type { SchedulePrefs } from '../../data/setup-queries';
import { useUpdateSchedulePrefs } from '../../hooks/use-show-mutations';
import { Card } from '@/shared/ui/organizer/card';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_LABEL, SM_INPUT, SM_SELECT } from './tokens';

/** Local-date parts back to 'YYYY-MM-DD' — not toISOString(), which converts to UTC and lands on the wrong calendar day for any server/viewer timezone ahead of UTC (e.g. a local-midnight Sep 19 in PKT, UTC+5, is Sep 18 in UTC). */
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${day}`;
}

/** One 'YYYY-MM-DD' per day in [start, end], inclusive. Falls back to a single "Day 1" when no dates are set yet — matches showstaff.html's effDays fallback in renderSetupView. */
function showDayDates(startDate: string, endDate: string): string[] {
  if (!startDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [startDate];
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(toIsoDate(d));
  }
  return days;
}

function dayLabel(iso: string, index: number): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return `Day ${String(index + 1)}`;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * "Schedule preferences" — the last of the three Setup cards this batch
 * builds. Autosaves on blur/change, same as Show Details; see
 * updateSchedulePrefs in data/mutations.ts.
 *
 * One simplification from the design: "Latest finish" and each day's
 * start/stop are native <input type="time"> here rather than the design's
 * custom popover (preset chips + H:M:AP selects). showstaff.html — the real
 * functionality source — uses a plain <input type="time"> for these too;
 * the popover is a design-file-only flourish with no functional
 * counterpart, so this keeps the exact field set, labels, defaults, and
 * min/max, and trades only the picker widget for time (out of scope to
 * build a bespoke popover for one field).
 */
export function SchedulePreferencesCard({
  showId,
  startDate,
  endDate,
  prefs,
  dayStartTimes,
  dayEndTimes,
}: {
  showId: string;
  startDate: string | null;
  endDate: string | null;
  prefs: SchedulePrefs;
  dayStartTimes: string[];
  dayEndTimes: string[];
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
    effDays.map((_, i) => dayStartTimes[i] ?? '08:00')
  );
  const [dayEnds, setDayEnds] = useState<string[]>(effDays.map((_, i) => dayEndTimes[i] ?? ''));

  const { mutate } = useUpdateSchedulePrefs();

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
        <div>
          <label htmlFor="sm-permin" className={SM_LABEL}>
            Time per ride (min)
          </label>
          <input
            id="sm-permin"
            type="number"
            min={3}
            max={30}
            value={perMin}
            className={SM_INPUT}
            onChange={(e) => {
              setPerMin(Number(e.target.value));
            }}
            onBlur={() => {
              save();
            }}
          />
        </div>
        <div>
          <label htmlFor="sm-buffer" className={SM_LABEL}>
            Change-over buffer (min)
          </label>
          <input
            id="sm-buffer"
            type="number"
            min={0}
            max={15}
            value={buffer}
            className={SM_INPUT}
            onChange={(e) => {
              setBuffer(Number(e.target.value));
            }}
            onBlur={() => {
              save();
            }}
          />
        </div>
        <div>
          <label htmlFor="sm-upper" className={SM_LABEL}>
            Upper-level allowance (min)
          </label>
          <input
            id="sm-upper"
            type="number"
            min={0}
            max={15}
            value={upper}
            className={SM_INPUT}
            onChange={(e) => {
              setUpper(Number(e.target.value));
            }}
            onBlur={() => {
              save();
            }}
          />
        </div>
        <div>
          <label htmlFor="sm-latest-finish" className={SM_LABEL}>
            Latest finish
          </label>
          <input
            id="sm-latest-finish"
            type="time"
            value={end}
            className={SM_INPUT}
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
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]">
          Per-day start / stop times
        </div>
        <p className="mb-4 text-[12.5px] leading-[1.5] text-[#6E7C76]">
          Overrides &ldquo;Latest finish&rdquo; above for a specific day — a day with no stop-time
          override still uses that show-wide default.
        </p>
        <div className="flex flex-col gap-2.5">
          {effDays.map((day, i) => (
            <div key={day} className="flex flex-wrap items-center gap-3">
              <span className="w-[100px] flex-none text-[13.5px] font-bold text-forest">
                {day === '__day1__' ? 'Day 1' : dayLabel(day, i)}
              </span>
              <span className="w-9 flex-none text-[11px] text-[#7C8A84]">Start</span>
              <input
                type="time"
                value={dayStarts[i] ?? '08:00'}
                className="w-[130px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold"
                onChange={(e) => {
                  setDayStart(i, e.target.value);
                }}
              />
              <span className="ml-1.5 w-9 flex-none text-[11px] text-[#7C8A84]">Stop</span>
              <input
                type="time"
                value={dayEnds[i] ?? ''}
                placeholder={end}
                className="w-[130px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold"
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
              const next = e.target.value as 'low' | 'high';
              setOrder(next);
              save({ order: next });
            }}
          >
            <option value="low">Lowest level first</option>
            <option value="high">Highest level first</option>
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
            <input
              type="number"
              min={0}
              max={6}
              value={extraBreaks}
              className="w-[70px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-3 text-sm text-ink-deep outline-none focus-visible:border-gold"
              onChange={(e) => {
                setExtraBreaks(Number(e.target.value));
              }}
              onBlur={() => {
                save();
              }}
            />
            <span className="text-[12.5px] text-[#7C8A84]">per day, at</span>
            <input
              type="number"
              min={0}
              max={30}
              value={extraBreakMin}
              className="w-[70px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-3 text-sm text-ink-deep outline-none focus-visible:border-gold"
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
    </Card>
  );
}

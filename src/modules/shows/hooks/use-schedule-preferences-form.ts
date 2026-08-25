'use client';

import { useState } from 'react';
import type { UpdateSchedulePrefsInput } from '@/modules/shows/schemas';
import type { SchedulePrefs } from '@/modules/shows/data/setup-queries';
import { useUpdateSchedulePrefs } from '@/modules/shows/hooks/use-show-mutations';
import { showDayDates } from '@/modules/shows/utils/show-day-dates';

export function useSchedulePreferencesForm({
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
    effDays.map((_, i) => dayStartTimes[i] ?? '08:00'),
  );
  const [dayEnds, setDayEnds] = useState<string[]>(effDays.map((_, i) => dayEndTimes[i] ?? ''));

  const { mutate } = useUpdateSchedulePrefs();

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

  function changeOrder(next: 'low' | 'high') {
    setOrder(next);
    save({ order: next });
  }

  function changeWarmup(next: 'yes' | 'no') {
    setWarmup(next);
    save({ warmup: next });
  }

  function changeLunch(next: boolean) {
    setLunch(next);
    save({ lunch: next });
  }

  return {
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
  };
}

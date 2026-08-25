'use client';

import { useState } from 'react';
import type { UpdateSchedulePrefsInput } from '@/modules/shows/schemas';
import type { SchedulePrefs, ClassRow } from '@/modules/shows/data/setup-queries';
import { useUpdateSchedulePrefs, useReorderClasses } from '@/modules/shows/hooks/use-show-mutations';
import { showDayDates } from '@/modules/shows/utils/show-day-dates';

export function useSchedulePreferencesForm({
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

  function changeOrder(next: 'low' | 'high' | 'custom') {
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
    manualOrder,
    moveClass,
  };
}

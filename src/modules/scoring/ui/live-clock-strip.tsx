'use client';

import { useEffect, useState } from 'react';
import { RIDE_MINUTES } from '@/modules/scoring/constants';
import { scheduleDelta, type ScheduleStatus } from '@/modules/scoring/utils/schedule-delta';

const STATUS_CLASSES: Record<ScheduleStatus, string> = {
  ahead: 'border-[#BFE0CB] bg-[#DCEFE1] text-[#2E7D46]',
  yellow: 'border-[#EAD9A0] bg-[#FBF0D8] text-[#8A6D14]',
  pink: 'border-[#E3A9C6] bg-[#FBE4EF] text-[#B0447A]',
  red: 'border-[#E3B8B8] bg-[#F7E1E1] text-[#B23A3A]',
};

const STATUS_DOT: Record<ScheduleStatus, string> = {
  ahead: 'bg-[#2E7D46]',
  yellow: 'bg-[#8A6D14]',
  pink: 'bg-[#B0447A]',
  red: 'bg-[#B23A3A]',
};

function formatClockTime(now: Date): string {
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${String(h)}:${m}:${s} ${ampm}`;
}

/** Counts down from RIDE_MINUTES, then counts up past zero as "+M:SS over" — ported from legacy's `fmtCountdown`. */
function formatCountdown(rideStartedAt: string, now: Date): { text: string; over: boolean } {
  const elapsedSec = (now.getTime() - new Date(rideStartedAt).getTime()) / 1000;
  const remainingSec = Math.round(RIDE_MINUTES * 60 - elapsedSec);
  const over = remainingSec < 0;
  const abs = Math.abs(remainingSec);
  const m = Math.floor(abs / 60);
  const s = String(abs % 60).padStart(2, '0');
  return { text: `${over ? '+' : ''}${String(m)}:${s}${over ? ' over' : ''}`, over };
}

/**
 * Live actual-time + ring-vs-schedule banner, ported from legacy's
 * liveClockCardHtml — but driven by the class's real `classes.time` and
 * `scoring_pos` rather than legacy's client-fabricated start time. The Ride
 * Time countdown only renders once `rideStartedAt` is set — a real
 * server-stamped anchor (see getScoringState), not legacy's client-seeded
 * fake one — so it's simply absent rather than fabricated until then.
 */
export function LiveClockStrip({
  scheduledTime,
  ringLabel,
  pos,
  rideStartedAt,
}: {
  scheduledTime: string | null;
  ringLabel: string;
  pos: number;
  rideStartedAt: string | null;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); }, 1000);
    return () => { clearInterval(id); };
  }, []);

  const schedule = scheduleDelta(scheduledTime, pos, now);
  const countdown = rideStartedAt ? formatCountdown(rideStartedAt, now) : null;

  return (
    <div className="mb-6 flex flex-wrap items-stretch gap-4">
      <div className="flex-1 basis-40 rounded-xl border border-[#E9EDEB] bg-white p-[12px_16px] text-center">
        <div className="text-[11px] font-bold tracking-[.08em] text-[#7A8781] uppercase">Actual time</div>
        <div className="font-[Newsreader,serif] text-2xl font-bold text-ink-deep">{formatClockTime(now)}</div>
      </div>

      {countdown && (
        <div className="flex-1 basis-40 rounded-xl border border-[#E9EDEB] bg-white p-[12px_16px] text-center">
          <div className="text-[11px] font-bold tracking-[.08em] text-[#7A8781] uppercase">Ride time</div>
          <div
            className={`font-[Newsreader,serif] text-2xl font-bold ${countdown.over ? 'text-[#B23A3A]' : 'text-ink-deep'}`}
          >
            {countdown.text}
          </div>
        </div>
      )}

      {schedule && (
        <div
          className={`flex flex-1 basis-60 items-center gap-3 rounded-xl border-2 p-[12px_16px] ${STATUS_CLASSES[schedule.status]}`}
        >
          <span className={`size-[14px] flex-none rounded-full ${STATUS_DOT[schedule.status]}`} />
          <div>
            <div className="text-[11px] font-bold tracking-[.08em] uppercase opacity-80">
              {ringLabel} — vs. schedule
            </div>
            <div className="font-[Newsreader,serif] text-lg font-bold">{schedule.label}</div>
          </div>
        </div>
      )}

      <p className="basis-full text-[12px] text-[#7A8781]">
        Ride spacing: {RIDE_MINUTES} min/rider, from the class&apos;s scheduled start.{' '}
        <span className="font-semibold text-[#2E7D46]">Green</span> = ahead of schedule ·{' '}
        <span className="font-semibold text-[#8A6D14]">Yellow</span> = on time or up to 1 min behind ·{' '}
        <span className="font-semibold text-[#B0447A]">Pink</span> = 1–10 min behind ·{' '}
        <span className="font-semibold text-[#B23A3A]">Red</span> = more than 10 min behind.
      </p>
    </div>
  );
}

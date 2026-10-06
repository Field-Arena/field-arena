'use client';

import { useEffect, useState } from 'react';
import { RIDE_MINUTES } from '@/shared/constants/ride-pace';
import { scheduleDelta, type ScheduleStatus } from '@/shared/lib/schedule-delta';

const STATUS_CLASSES: Record<ScheduleStatus, string> = {
  ahead: 'border-[#CDEEDE] bg-[var(--fa-emerald-tint)] text-[var(--fa-emerald)]',
  yellow: 'border-[#F6DCB8] bg-[var(--fa-amber-tint)] text-[var(--fa-amber)]',
  pink: 'border-[#F5C6DA] bg-[var(--fa-rose-tint)] text-[var(--fa-rose)]',
  red: 'border-[#FBCFC9] bg-[var(--fa-red-tint)] text-[var(--fa-red)]',
};

const STATUS_DOT: Record<ScheduleStatus, string> = {
  ahead: 'bg-[var(--fa-emerald)]',
  yellow: 'bg-[var(--fa-amber)]',
  pink: 'bg-[var(--fa-rose)]',
  red: 'bg-[var(--fa-red)]',
};

// A ride "started" hours ago is a stale marker (an unfinished ride from a
// past session), not a live ride — showing its raw elapsed time is noise.
const STALE_RIDE_SEC = 3 * 60 * 60;

function formatClockTime(now: Date): string {
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${String(h)}:${m}:${s} ${ampm}`;
}

function formatCountdown(rideStartedAt: string, now: Date): { text: string; over: boolean } | null {
  const elapsedSec = (now.getTime() - new Date(rideStartedAt).getTime()) / 1000;
  if (elapsedSec > STALE_RIDE_SEC) return null;
  const remainingSec = Math.round(RIDE_MINUTES * 60 - elapsedSec);
  const over = remainingSec < 0;
  const abs = Math.abs(remainingSec);
  const m = Math.floor(abs / 60);
  const s = String(abs % 60).padStart(2, '0');
  return { text: `${over ? '+' : ''}${String(m)}:${s}${over ? ' over' : ''}`, over };
}

export function LiveClockStrip({
  scheduledTime,
  timeZone,
  ringLabel,
  pos,
  rideStartedAt,
}: {
  scheduledTime: string | null;
  timeZone: string;
  ringLabel: string;
  pos: number;
  rideStartedAt: string | null;
}) {
  // Null until mounted: the server's clock never matches the browser's, and
  // rendering it on both sides is a hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => {
      setNow(new Date());
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const schedule = now ? scheduleDelta(scheduledTime, pos, now, timeZone) : null;
  const countdown = now && rideStartedAt ? formatCountdown(rideStartedAt, now) : null;

  return (
    <div className="mb-6 flex flex-wrap items-stretch gap-4">
      <div className="fa-card flex-1 basis-40 p-[12px_16px] text-center">
        <div className="text-[11px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
          Actual time
        </div>
        <div className="font-[family-name:var(--fa-serif)] text-2xl font-bold text-[#101828]">
          {now ? formatClockTime(now) : '—:—:—'}
        </div>
      </div>

      {countdown && (
        <div className="fa-card flex-1 basis-40 p-[12px_16px] text-center">
          <div className="text-[11px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
            Ride time
          </div>
          <div
            className={`font-[family-name:var(--fa-serif)] text-2xl font-bold ${countdown.over ? 'text-[#B23A3A]' : 'text-[#101828]'}`}
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
            <div className="font-[family-name:var(--fa-serif)] text-lg font-bold">
              {schedule.label}
            </div>
          </div>
        </div>
      )}

      <p className="basis-full text-[12px] text-[#8A94A3]">
        Ride spacing: {RIDE_MINUTES} min/rider, from the class&apos;s scheduled start.{' '}
        <span className="font-semibold text-[#2E7D46]">Green</span> = ahead of schedule ·{' '}
        <span className="font-semibold text-[#B45309]">Yellow</span> = on time or up to 1 min behind
        · <span className="font-semibold text-[#B0447A]">Pink</span> = 1–10 min behind ·{' '}
        <span className="font-semibold text-[#B23A3A]">Red</span> = more than 10 min behind.
      </p>
    </div>
  );
}

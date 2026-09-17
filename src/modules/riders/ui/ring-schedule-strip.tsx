'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { LEGACY_COLOR } from '@/modules/riders/ui/legacy-theme';
import type { RingScheduleStatus } from '@/modules/riders/data/queries';

const REFRESH_MS = 15_000;

const STATUS_STYLE: Record<RingScheduleStatus['status'], { bg: string; fg: string }> = {
  ahead: { bg: LEGACY_COLOR.greenPale, fg: LEGACY_COLOR.green },
  yellow: { bg: LEGACY_COLOR.goldPale, fg: LEGACY_COLOR.amber },
  pink: { bg: '#FBE4EF', fg: '#B0447A' },
  red: { bg: LEGACY_COLOR.redPale, fg: LEGACY_COLOR.red },
};

function formatClockTime(now: Date): string {
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${String(h)}:${m}:${s} ${ampm}`;
}

// Same pattern as OpsClock (operations/ui/ops-clock.tsx): useSyncExternalStore
// rather than setState-in-effect, bucketed to the second so the snapshot stays
// referentially stable between ticks. Server snapshot is null so the clock
// renders nothing until mounted -- the server and client would otherwise
// disagree on the current second.
function subscribeToTick(onChange: () => void): () => void {
  const id = setInterval(onChange, 1000);
  return () => {
    clearInterval(id);
  };
}
function getClientSecond(): string {
  return String(Math.floor(Date.now() / 1000));
}
function getServerSecond(): string | null {
  return null;
}

/* Rider-portal version of the same clock strip legacy's real rider
 * dashboard shows (rider.html:startRiderClock/clockStripHtml) -- ported
 * here off the app's own real scheduleDelta (scoring module) instead of
 * legacy's hardcoded demo deltas, since a real per-ring "behind/ahead"
 * status now exists in this codebase. */
export function RingScheduleStrip({ rows }: { rows: RingScheduleStatus[] }) {
  const router = useRouter();
  const second = useSyncExternalStore(subscribeToTick, getClientSecond, getServerSecond);
  const now = second ? new Date(Number(second) * 1000) : null;

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESH_MS);
    return () => {
      clearInterval(id);
    };
  }, [router]);

  if (rows.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: '#00D9FF',
          whiteSpace: 'nowrap',
          padding: '10px 16px',
          background: '#0A0A0E',
          borderRadius: '9px 0 0 9px',
          flex: 'none',
        }}
      >
        {now ? formatClockTime(now) : ''}
      </div>
      <div
        style={{
          display: 'flex',
          flex: '1 1 260px',
          minWidth: 0,
          border: `2px solid ${LEGACY_COLOR.hunterDeep}`,
          borderLeft: 'none',
          borderRadius: '0 9px 9px 0',
          overflow: 'hidden',
        }}
      >
        {rows.map((row) => {
          const style = STATUS_STYLE[row.status];
          return (
            <span
              key={row.ring}
              style={{
                flex: 1,
                padding: '9px 10px',
                fontSize: 11.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                background: style.bg,
                color: style.fg,
                borderRight: `1px solid rgba(0,0,0,.12)`,
              }}
            >
              <b>{row.ring}</b> · {row.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

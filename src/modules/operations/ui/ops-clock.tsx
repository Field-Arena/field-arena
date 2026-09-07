'use client';

import { useSyncExternalStore } from 'react';

/* Ride-day wall clock — legacy's clock strip (showstaff-ops.html:792
 * fmtClockTime / refreshClockStrip, ticked by tick()). On a show day the board
 * is often left open on a wall display, so the time on screen has to be the
 * real time, not whenever the page was rendered.
 *
 * Renders nothing until mounted: the server and the client would otherwise
 * disagree on the current minute and React would report a hydration mismatch. */
function subscribeToTick(onChange: () => void): () => void {
  const id = setInterval(onChange, 1000);
  return () => {
    clearInterval(id);
  };
}

// Snapshot must be referentially stable between ticks or React re-renders
// forever — bucket to the second and hand back the same string each time.
function getClientTime(): string {
  return String(Math.floor(Date.now() / 1000));
}

function getServerTime(): string | null {
  return null;
}

export function OpsClock({ className }: { className?: string }) {
  // useSyncExternalStore rather than setState-in-effect: the wall clock is
  // external, mutable state, and this is the sanctioned way to read it without
  // tripping the hydration mismatch. getServerSnapshot returns null so the
  // server renders nothing and the client fills it in on mount.
  const now = useSyncExternalStore(subscribeToTick, getClientTime, getServerTime);

  if (!now) return null;

  const stamp = new Date(Number(now) * 1000);
  const time = stamp.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const day = stamp.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <span className={className} aria-live="off">
      <time dateTime={stamp.toISOString()} style={{ fontWeight: 700 }}>
        {time}
      </time>
      <span style={{ opacity: 0.7, marginLeft: 8 }}>{day}</span>
    </span>
  );
}

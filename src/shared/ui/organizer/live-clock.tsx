'use client';

import { useEffect, useState } from 'react';

/**
 * A ticking wall-clock, ported from the Admin Console design's `wsClock` value
 * on the ring-timer strip (Field & Arena Admin Console.dc.html, the
 * `wsRings`/`wsClock` block around line 905). The design fed it a static mock
 * string; here it is the viewer's real local time, updated once a second.
 *
 * `now` starts null and is only ever set from the interval callback below, so
 * the very first client render matches the server-rendered placeholder
 * exactly (the server cannot know the viewer's clock or timezone) — no
 * separate "mounted" flag needed. The placeholder holds for up to one second
 * after mount, until the first tick.
 */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      {now
        ? now.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          })
        : '—:—:—'}
    </span>
  );
}

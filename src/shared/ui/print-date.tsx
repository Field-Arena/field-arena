'use client';

import { useSyncExternalStore } from 'react';

const EMPTY = '';

/** Nothing to subscribe to — the date is read once per render pass. */
function subscribe() {
  return () => undefined;
}

function today(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * The report's date, stamped in the browser rather than on the server.
 *
 * A server-rendered date is the moment the page was built, which for a cached
 * render is not the day someone hits Print.
 *
 * useSyncExternalStore rather than an effect: it takes a separate server
 * snapshot, so the markup React renders on the server and the markup it
 * hydrates against agree by construction instead of being reconciled after a
 * state write. The empty server value is never seen — the report is invisible
 * until the print stylesheet reveals it.
 */
export function PrintDate() {
  const date = useSyncExternalStore(subscribe, today, () => EMPTY);

  return <div className="text-right text-[12px] text-[#555]">{date}</div>;
}
